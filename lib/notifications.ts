/**
 * Push Notifications — Firebase Cloud Messaging
 *
 * Industry pattern: request permission when user initiates an action
 * (not on page load — that tanks acceptance rates). Save FCM token to DB.
 * Use Notification API directly as fallback when tab is hidden.
 */

import { database } from './firebase'
import { ref, set, onValue, off } from 'firebase/database'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { app } from './firebase'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''

// ── Permission + Token ─────────────────────────────────────────────────────────

let _messagingInitialized = false

async function getMessagingInstance() {
  if (typeof window === 'undefined') return null
  try {
    const supported = await isSupported()
    if (!supported) return null
    return getMessaging(app)
  } catch {
    return null
  }
}

/**
 * Request notification permission and save FCM token to Firebase DB.
 * Called when user starts searching for a match.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (_messagingInitialized) return Notification.permission === 'granted'

  // Don't ask if already denied — respects user's choice
  if (Notification.permission === 'denied') return false

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    _messagingInitialized = true

    // Try to get FCM token (requires VAPID key + SW registration)
    const messaging = await getMessagingInstance()
    if (messaging && VAPID_KEY) {
      try {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (token) {
          await set(ref(database, `fcmTokens/${userId}`), {
            token,
            updatedAt: Date.now(),
            userAgent: navigator.userAgent.slice(0, 100),
          })
        }
      } catch {
        // FCM token fetch failed — we still have Notification API as fallback
      }
    }

    return true
  } catch {
    return false
  }
}

// ── In-browser match notification (Notification API fallback) ──────────────────

let _matchListenerActive = false
let _matchUnsubscribe: (() => void) | null = null

/**
 * Listen to userChats/{uid} — when a new active chat appears and the
 * document is hidden, show a browser Notification to bring the user back.
 *
 * This works without FCM tokens since the page is still open (just backgrounded).
 */
export function listenForMatchNotification(userId: string, sessionId: string): void {
  if (_matchListenerActive) return
  if (typeof window === 'undefined') return
  if (Notification.permission !== 'granted') return

  _matchListenerActive = true
  const chatsRef = ref(database, `userChats/${userId}`)

  let initialized = false
  const unsubscribe = onValue(chatsRef, (snapshot) => {
    // Skip the initial read — we only want NEW entries
    if (!initialized) { initialized = true; return }

    if (!snapshot.exists()) return
    const chats = snapshot.val() as Record<string, { isActive: boolean; sessionId: string }>

    for (const [chatId, info] of Object.entries(chats)) {
      if (info.isActive && info.sessionId === sessionId) {
        // New match! Show notification if tab is hidden
        if (document.visibilityState !== 'visible') {
          try {
            const n = new Notification('mujAnon — Match Found! 🎉', {
              body: 'A fellow MUJian is ready to chat. Tap to open.',
              icon: '/icon.png',
              tag: 'match-notification',
            } as NotificationOptions)
            n.onclick = () => {
              window.focus()
              window.location.href = `/chat/${chatId}`
              n.close()
            }
          } catch {
            // Notification constructor can fail in some browsers — silent fail
          }
        }
        stopMatchNotificationListener()
        break
      }
    }
  })

  _matchUnsubscribe = () => {
    off(chatsRef)
    unsubscribe()
    _matchListenerActive = false
  }
}

export function stopMatchNotificationListener(): void {
  if (_matchUnsubscribe) {
    _matchUnsubscribe()
    _matchUnsubscribe = null
  }
  _matchListenerActive = false
}
