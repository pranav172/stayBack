/**
 * Email Verification — Firebase Magic Link
 *
 * Uses Firebase Auth's sendSignInLinkToEmail (passwordless email link).
 * No Resend, no custom domain, no OTP — Firebase handles delivery for free
 * from noreply@[project].firebaseapp.com.
 *
 * Flow:
 *  1. User enters @muj.manipal.edu email on /verify
 *  2. sendMagicLink() → Firebase sends magic link to that address
 *  3. User clicks link → Firebase redirects to /verify-email?…
 *  4. completeMagicLinkSignIn() → links the anonymous auth session,
 *     then marks the user verified in Firebase DB
 */

import { auth, database } from './firebase'
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ActionCodeSettings,
} from 'firebase/auth'
import { ref, set, get, serverTimestamp } from 'firebase/database'

// ── Constants ──────────────────────────────────────────────────────────────────

/** Only @muj.manipal.edu addresses are allowed */
const VALID_EMAIL_DOMAIN = '@muj.manipal.edu'

/**
 * The page Firebase redirects to after the user clicks the magic link.
 * Must be registered in Firebase Console → Authentication → Authorized domains.
 */
const getActionCodeSettings = (): ActionCodeSettings => ({
  url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mujanon.vercel.app'}/verify-email`,
  handleCodeInApp: true,
})

/** localStorage key for persisting email across the email-link redirect */
const EMAIL_STORAGE_KEY = 'mujanon_verification_email'

// ── Validation ─────────────────────────────────────────────────────────────────

export function isValidMUJEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith(VALID_EMAIL_DOMAIN)
}

export function getEmailUsername(email: string): string {
  return email.split('@')[0]
}

// ── Step 1: Send the magic link ────────────────────────────────────────────────

/**
 * Send a Firebase magic link to the given MUJ email.
 * Persists the email to localStorage so we can complete sign-in after the
 * redirect (Firebase requires the email to be available on the redirect page).
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = email.toLowerCase().trim()
    if (!isValidMUJEmail(trimmed)) {
      return { success: false, error: 'Please use your @muj.manipal.edu email.' }
    }

    await sendSignInLinkToEmail(auth, trimmed, getActionCodeSettings())

    // Persist email for the callback page
    if (typeof window !== 'undefined') {
      localStorage.setItem(EMAIL_STORAGE_KEY, trimmed)
    }

    return { success: true }
  } catch (err: unknown) {
    console.error('sendMagicLink error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('auth/invalid-email')) return { success: false, error: 'Invalid email address.' }
    if (msg.includes('auth/too-many-requests')) return { success: false, error: 'Too many requests — wait a few minutes.' }
    return { success: false, error: 'Failed to send verification link. Please try again.' }
  }
}

// ── Step 2: Complete sign-in on redirect ───────────────────────────────────────

export interface MagicLinkResult {
  success: boolean
  email?: string
  error?: string
}

/**
 * Called on the /verify-email page after Firebase redirects back.
 * 1. Reads the stored email from localStorage
 * 2. Calls signInWithEmailLink (verifies the PKCE token Firebase embedded in the URL)
 * 3. Writes verifiedUsers/{uid} to Firebase DB
 *
 * Industry note: Firebase email links are PKCE-secured one-time tokens —
 * they expire after 1 hour and cannot be replayed.
 */
export async function completeMagicLinkSignIn(href: string): Promise<MagicLinkResult> {
  try {
    if (!isSignInWithEmailLink(auth, href)) {
      return { success: false, error: 'Invalid or expired verification link.' }
    }

    // Retrieve the email we saved before the redirect
    let email: string | null = null
    if (typeof window !== 'undefined') {
      email = localStorage.getItem(EMAIL_STORAGE_KEY)
    }

    if (!email) {
      return {
        success: false,
        error: 'Could not find your email. Please re-open the link on the same device.',
      }
    }

    if (!isValidMUJEmail(email)) {
      return { success: false, error: 'Only @muj.manipal.edu emails are allowed.' }
    }

    // signInWithEmailLink may upgrade the existing anonymous session or create a new one
    const result = await signInWithEmailLink(auth, email, href)
    const uid = result.user.uid

    // Mark user as verified in Firebase DB (same schema as before — no migration needed)
    await set(ref(database, `verifiedUsers/${uid}`), {
      email,
      verifiedAt: serverTimestamp(),
    })

    // Clean up stored email
    if (typeof window !== 'undefined') {
      localStorage.removeItem(EMAIL_STORAGE_KEY)
    }

    return { success: true, email }
  } catch (err: unknown) {
    console.error('completeMagicLinkSignIn error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('auth/expired-action-code')) {
      return { success: false, error: 'This link has expired. Please request a new one from /verify.' }
    }
    if (msg.includes('auth/invalid-action-code')) {
      return { success: false, error: 'This link is invalid or has already been used.' }
    }
    if (msg.includes('auth/email-already-in-use')) {
      return { success: false, error: 'This email is already linked to another account.' }
    }
    return { success: false, error: 'Verification failed. Please try again.' }
  }
}

// ── Check / Read verified status ───────────────────────────────────────────────

export interface VerificationStatus {
  isVerified: boolean
  email?: string
  verifiedAt?: number
}

export async function checkVerificationStatus(userId: string): Promise<VerificationStatus> {
  try {
    const snap = await get(ref(database, `verifiedUsers/${userId}`))
    if (!snap.exists()) return { isVerified: false }
    const data = snap.val()
    return { isVerified: true, email: data.email, verifiedAt: data.verifiedAt }
  } catch (err) {
    console.error('checkVerificationStatus error:', err)
    return { isVerified: false }
  }
}
