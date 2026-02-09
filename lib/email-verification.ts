/**
 * Email Verification Utilities
 * 
 * Handles college email verification for MUJ students
 * Email domain: @muj.manipal.edu
 */

import { database } from './firebase'
import { ref, get, set, serverTimestamp } from 'firebase/database'

// Valid email domain for MUJ
const VALID_EMAIL_DOMAIN = '@muj.manipal.edu'

export interface VerificationStatus {
  isVerified: boolean
  email?: string
  verifiedAt?: number
}

/**
 * Check if an email is a valid MUJ email
 */
export function isValidMUJEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase().trim()
  return lowerEmail.endsWith(VALID_EMAIL_DOMAIN)
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP in Firebase for verification
 * OTP expires after 10 minutes
 */
export async function storeOTP(userId: string, email: string, otp: string): Promise<void> {
  const otpRef = ref(database, `pendingVerifications/${userId}`)
  await set(otpRef, {
    email: email.toLowerCase().trim(),
    otp,
    createdAt: serverTimestamp(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Verify OTP and mark user as verified
 */
export async function verifyOTP(userId: string, inputOTP: string): Promise<{ success: boolean; error?: string }> {
  try {
    const otpRef = ref(database, `pendingVerifications/${userId}`)
    const snapshot = await get(otpRef)
    
    if (!snapshot.exists()) {
      return { success: false, error: 'No pending verification found. Please request a new code.' }
    }
    
    const data = snapshot.val()
    
    // Check if expired
    if (Date.now() > data.expiresAt) {
      return { success: false, error: 'Verification code expired. Please request a new one.' }
    }
    
    // Check OTP match
    if (data.otp !== inputOTP) {
      return { success: false, error: 'Invalid verification code.' }
    }
    
    // Mark user as verified
    const verifiedRef = ref(database, `verifiedUsers/${userId}`)
    await set(verifiedRef, {
      email: data.email,
      verifiedAt: serverTimestamp(),
    })
    
    // Clean up pending verification
    await set(otpRef, null)
    
    return { success: true }
  } catch (error) {
    console.error('Verification error:', error)
    return { success: false, error: 'Verification failed. Please try again.' }
  }
}

/**
 * Check if a user is verified
 */
export async function checkVerificationStatus(userId: string): Promise<VerificationStatus> {
  try {
    const verifiedRef = ref(database, `verifiedUsers/${userId}`)
    const snapshot = await get(verifiedRef)
    
    if (!snapshot.exists()) {
      return { isVerified: false }
    }
    
    const data = snapshot.val()
    return {
      isVerified: true,
      email: data.email,
      verifiedAt: data.verifiedAt,
    }
  } catch (error) {
    console.error('Error checking verification:', error)
    return { isVerified: false }
  }
}

/**
 * Get the username portion of an MUJ email for display
 * e.g., "john.doe@muj.manipal.edu" -> "john.doe"
 */
export function getEmailUsername(email: string): string {
  return email.split('@')[0]
}
