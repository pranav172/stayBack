/**
 * mujAnon Firebase Cloud Functions
 * 
 * Server-side validation, rate limiting, and scheduled cleanup
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.database();

// ============================================
// OFFENSIVE CONTENT FILTER (Server-side)
// ============================================

const OFFENSIVE_KEYWORDS = [
  'nudes', 'nude', 'naked', 'sex', 'porn', 'xxx',
  'kill yourself', 'kys', 'die',
];

const SENSITIVE_PATTERNS = [
  /\b[6-9]\d{9}\b/g, // Indian phone numbers
  /\+91[\s-]?\d{10}/g, // Phone with country code
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Email addresses
  /https?:\/\/[^\s]+/gi, // URLs
];

function containsOffensiveContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return OFFENSIVE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function containsSensitiveInfo(text: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
}

// ============================================
// MESSAGE VALIDATION (Callable Function)
// ============================================

interface ValidateMessageData {
  chatId: string;
  text: string;
}

export const validateMessage = functions.https.onCall(
  async (data: ValidateMessageData, context) => {
    const { chatId, text } = data;
    const userId = context.auth?.uid;

    // Must be authenticated
    if (!userId) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to send messages'
      );
    }

    // Validate text
    if (!text || typeof text !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message text is required'
      );
    }

    const trimmedText = text.trim();

    // Max length check
    if (trimmedText.length > 500) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message too long (max 500 characters)'
      );
    }

    // Empty message check
    if (trimmedText.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message cannot be empty'
      );
    }

    // Offensive content check
    if (containsOffensiveContent(trimmedText)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Message contains inappropriate content'
      );
    }

    // Sensitive info check
    if (containsSensitiveInfo(trimmedText)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Please avoid sharing personal information'
      );
    }

    // Check rate limiting (max 60 messages per minute)
    const rateLimitRef = db.ref(`rateLimit/${userId}`);
    const rateLimitSnap = await rateLimitRef.once('value');
    const rateData = rateLimitSnap.val() || { count: 0, resetAt: Date.now() + 60000 };

    if (Date.now() > rateData.resetAt) {
      // Reset counter
      await rateLimitRef.set({ count: 1, resetAt: Date.now() + 60000 });
    } else if (rateData.count >= 60) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Please slow down.'
      );
    } else {
      await rateLimitRef.update({ count: rateData.count + 1 });
    }

    // Verify user is part of this chat
    const chatSnap = await db.ref(`chats/${chatId}`).once('value');
    if (!chatSnap.exists()) {
      throw new functions.https.HttpsError(
        'not-found',
        'Chat not found'
      );
    }

    const chat = chatSnap.val();
    if (chat.user1 !== userId && chat.user2 !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Not a participant in this chat'
      );
    }

    if (!chat.isActive) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Chat has ended'
      );
    }

    // All checks passed
    return { 
      success: true, 
      sanitizedText: trimmedText 
    };
  }
);

// ============================================
// CLEANUP OLD CHATS (Scheduled Function)
// ============================================

export const cleanupOldChats = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    console.log('Starting cleanup of chats older than:', new Date(cutoffTime).toISOString());

    try {
      // Get old chats
      const chatsRef = db.ref('chats');
      const oldChatsSnap = await chatsRef
        .orderByChild('createdAt')
        .endAt(cutoffTime)
        .once('value');

      if (!oldChatsSnap.exists()) {
        console.log('No old chats to clean up');
        return null;
      }

      const updates: Record<string, null> = {};
      let chatCount = 0;

      oldChatsSnap.forEach((chatSnap) => {
        const chatId = chatSnap.key;
        if (chatId) {
          // Mark chat for deletion
          updates[`chats/${chatId}`] = null;
          // Mark messages for deletion
          updates[`messages/${chatId}`] = null;
          chatCount++;
        }
      });

      // Perform batch delete
      await db.ref().update(updates);
      console.log(`Cleaned up ${chatCount} old chats and their messages`);

      return null;
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  });

// ============================================
// CLEANUP EXPIRED CONFESSIONS (48h TTL)
// ============================================

export const cleanupExpiredConfessions = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const now = Date.now();
    console.log('Cleaning up expired confessions...');

    try {
      const snap = await db.ref('confessions')
        .orderByChild('expiresAt')
        .endAt(now)
        .once('value');

      if (!snap.exists()) {
        console.log('No expired confessions');
        return null;
      }

      const updates: Record<string, null> = {};
      let count = 0;
      snap.forEach((child) => {
        if (child.key) {
          updates[`confessions/${child.key}`] = null;
          count++;
        }
      });

      await db.ref().update(updates);
      console.log(`Deleted ${count} expired confessions`);
      return null;
    } catch (error) {
      console.error('Confession cleanup failed:', error);
      throw error;
    }
  });

// ============================================
// CLEANUP EXPIRED GROUP ROOMS (30min TTL)
// ============================================

export const cleanupExpiredGroupRooms = functions.pubsub
  .schedule('every 30 minutes')
  .onRun(async () => {
    const cutoff = Date.now() - 30 * 60 * 1000; // 30 min ago
    console.log('Cleaning up expired group rooms...');

    try {
      const snap = await db.ref('groupChats')
        .orderByChild('createdAt')
        .endAt(cutoff)
        .once('value');

      if (!snap.exists()) {
        console.log('No expired group rooms');
        return null;
      }

      const updates: Record<string, null> = {};
      let count = 0;
      snap.forEach((child) => {
        if (child.key) {
          updates[`groupChats/${child.key}`] = null;
          updates[`groupMessages/${child.key}`] = null; // delete messages too
          count++;
        }
      });

      await db.ref().update(updates);
      console.log(`Deleted ${count} expired group rooms + their messages`);
      return null;
    } catch (error) {
      console.error('Group room cleanup failed:', error);
      throw error;
    }
  });


// ============================================
// CLEANUP OLD FEEDBACK (Scheduled Function)
// ============================================

export const cleanupOldFeedback = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago

    console.log('Starting cleanup of feedback older than:', new Date(cutoffTime).toISOString());

    try {
      const feedbackRef = db.ref('feedback');
      const oldFeedbackSnap = await feedbackRef.once('value');

      if (!oldFeedbackSnap.exists()) {
        console.log('No feedback to check');
        return null;
      }

      const updates: Record<string, null> = {};
      let feedbackCount = 0;

      oldFeedbackSnap.forEach((chatFeedback) => {
        chatFeedback.forEach((feedback) => {
          const data = feedback.val();
          if (data.timestamp && data.timestamp < cutoffTime) {
            updates[`feedback/${chatFeedback.key}/${feedback.key}`] = null;
            feedbackCount++;
          }
        });
      });

      if (feedbackCount > 0) {
        await db.ref().update(updates);
        console.log(`Cleaned up ${feedbackCount} old feedback entries`);
      }

      return null;
    } catch (error) {
      console.error('Feedback cleanup failed:', error);
      throw error;
    }
  });

// ============================================
// CLEANUP OLD REPORTS (Keep 7 days)
// ============================================

export const cleanupOldReports = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago

    console.log('Starting cleanup of resolved reports older than:', new Date(cutoffTime).toISOString());

    try {
      const reportsRef = db.ref('reports');
      const reportsSnap = await reportsRef.once('value');

      if (!reportsSnap.exists()) {
        console.log('No reports to check');
        return null;
      }

      const updates: Record<string, null> = {};
      let reportCount = 0;

      reportsSnap.forEach((report) => {
        const data = report.val();
        // Only delete resolved/dismissed reports older than 7 days
        if (data.status !== 'pending' && data.timestamp && data.timestamp < cutoffTime) {
          updates[`reports/${report.key}`] = null;
          reportCount++;
        }
      });

      if (reportCount > 0) {
        await db.ref().update(updates);
        console.log(`Cleaned up ${reportCount} old resolved reports`);
      }

      return null;
    } catch (error) {
      console.error('Reports cleanup failed:', error);
      throw error;
    }
  });

// ============================================
// BAN DEVICE (Admin Only - Callable)
// ============================================

interface BanDeviceData {
  deviceId: string;
  duration: 'ban_1h' | 'ban_24h' | 'ban_7d' | 'ban_permanent';
  reason: string;
  reportId?: string;
}

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export const banDevice = functions.https.onCall(
  async (data: BanDeviceData, context) => {
    const { deviceId, duration, reason, reportId } = data;
    const userId = context.auth?.uid;
    const userEmail = context.auth?.token?.email;

    // Must be authenticated
    if (!userId) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in'
      );
    }

    // Must be admin (check email or custom claims)
    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);
    const hasAdminClaim = context.auth?.token?.admin === true;

    if (!isAdmin && !hasAdminClaim) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin access required'
      );
    }

    // Calculate ban duration
    const durations: Record<string, number> = {
      'ban_1h': 60 * 60 * 1000,
      'ban_24h': 24 * 60 * 60 * 1000,
      'ban_7d': 7 * 24 * 60 * 60 * 1000,
      'ban_permanent': 100 * 365 * 24 * 60 * 60 * 1000, // 100 years
    };

    const banDuration = durations[duration];
    if (!banDuration) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid ban duration'
      );
    }

    const bannedUntil = Date.now() + banDuration;

    // Apply ban to device
    await db.ref(`devices/${deviceId}`).update({
      bannedUntil,
      banReason: reason,
      bannedAt: Date.now(),
      bannedBy: userId,
    });

    // Log admin action
    await db.ref('adminActions').push({
      action: 'ban',
      deviceId,
      duration,
      reason,
      reportId: reportId || null,
      adminId: userId,
      adminEmail: userEmail,
      timestamp: Date.now(),
    });

    console.log(`Device ${deviceId} banned until ${new Date(bannedUntil).toISOString()} by ${userEmail}`);

    return { success: true, bannedUntil };
  }
);

// ============================================
// UNBAN DEVICE (Admin Only - Callable)
// ============================================

interface UnbanDeviceData {
  deviceId: string;
}

export const unbanDevice = functions.https.onCall(
  async (data: UnbanDeviceData, context) => {
    const { deviceId } = data;
    const userId = context.auth?.uid;
    const userEmail = context.auth?.token?.email;

    if (!userId) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);
    const hasAdminClaim = context.auth?.token?.admin === true;

    if (!isAdmin && !hasAdminClaim) {
      throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // Remove ban
    await db.ref(`devices/${deviceId}`).update({
      bannedUntil: null,
      banReason: null,
      unbannedAt: Date.now(),
      unbannedBy: userId,
    });

    // Log admin action
    await db.ref('adminActions').push({
      action: 'unban',
      deviceId,
      adminId: userId,
      adminEmail: userEmail,
      timestamp: Date.now(),
    });

    console.log(`Device ${deviceId} unbanned by ${userEmail}`);

    return { success: true };
  }
);
