/**
 * Shadowban Utilities
 * 
 * Shadowbanned users can still use the app but won't be matched with others.
 * They see a fake "searching" state indefinitely.
 */

import { database } from './firebase'
import { ref, get } from 'firebase/database'
import { getDeviceFingerprint } from './fingerprint'

export interface ShadowbanStatus {
  isShadowbanned: boolean
  reason?: string
  shadowbannedAt?: number
}

/**
 * Check if a device is shadowbanned
 */
export async function checkShadowban(): Promise<ShadowbanStatus> {
  try {
    const deviceId = await getDeviceFingerprint()
    const shadowbanRef = ref(database, `shadowbans/${deviceId}`)
    const snapshot = await get(shadowbanRef)
    
    if (!snapshot.exists()) {
      return { isShadowbanned: false }
    }
    
    const data = snapshot.val()
    
    // Check if shadowban has expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      return { isShadowbanned: false }
    }
    
    return {
      isShadowbanned: true,
      reason: data.reason,
      shadowbannedAt: data.shadowbannedAt,
    }
  } catch (error) {
    console.error('Error checking shadowban:', error)
    return { isShadowbanned: false }
  }
}

/**
 * Check if a user ID is shadowbanned (for admin use)
 */
export async function checkUserShadowban(deviceId: string): Promise<ShadowbanStatus> {
  try {
    const shadowbanRef = ref(database, `shadowbans/${deviceId}`)
    const snapshot = await get(shadowbanRef)
    
    if (!snapshot.exists()) {
      return { isShadowbanned: false }
    }
    
    const data = snapshot.val()
    return {
      isShadowbanned: true,
      reason: data.reason,
      shadowbannedAt: data.shadowbannedAt,
    }
  } catch (error) {
    console.error('Error checking user shadowban:', error)
    return { isShadowbanned: false }
  }
}
