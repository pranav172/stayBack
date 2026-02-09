// Device fingerprinting for ban enforcement
// Uses FingerprintJS to generate stable device identifiers

import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { database, auth } from './firebase'
import { ref, get, set, serverTimestamp } from 'firebase/database'

let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null
let cachedVisitorId: string | null = null

/**
 * Initialize FingerprintJS (lazy load)
 */
function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  return fpPromise
}

/**
 * Get the device fingerprint (visitor ID)
 * Returns a stable identifier for this device/browser
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Return cached value if available
  if (cachedVisitorId) {
    return cachedVisitorId
  }

  try {
    const fp = await initFingerprint()
    const result = await fp.get()
    cachedVisitorId = result.visitorId
    return result.visitorId as string
  } catch (error) {
    console.error('Fingerprint error:', error)
    // Fallback: generate a random ID stored in localStorage
    let fallbackId = localStorage.getItem('mujAnon_deviceId')
    if (!fallbackId) {
      fallbackId = 'fallback_' + crypto.randomUUID()
      localStorage.setItem('mujAnon_deviceId', fallbackId)
    }
    cachedVisitorId = fallbackId
    return fallbackId
  }
}

/**
 * Device ban status
 */
export interface DeviceBanStatus {
  isBanned: boolean
  bannedUntil?: number
  reason?: string
  remainingMs?: number
}

/**
 * Check if the current device is banned
 */
export async function checkDeviceBan(): Promise<DeviceBanStatus> {
  try {
    const deviceId = await getDeviceFingerprint()
    const deviceRef = ref(database, `devices/${deviceId}`)
    const snapshot = await get(deviceRef)

    if (!snapshot.exists()) {
      return { isBanned: false }
    }

    const deviceData = snapshot.val()
    const bannedUntil = deviceData.bannedUntil

    if (!bannedUntil) {
      return { isBanned: false }
    }

    const now = Date.now()
    if (bannedUntil > now) {
      return {
        isBanned: true,
        bannedUntil,
        reason: deviceData.banReason || 'Violation of community guidelines',
        remainingMs: bannedUntil - now
      }
    }

    // Ban expired
    return { isBanned: false }
  } catch (error) {
    console.error('Error checking device ban:', error)
    // Fail open - allow access if check fails
    return { isBanned: false }
  }
}

/**
 * Register or update device in Firebase
 * Called after successful anonymous auth
 */
export async function registerDevice(): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) return

    const deviceId = await getDeviceFingerprint()
    const deviceRef = ref(database, `devices/${deviceId}`)
    const snapshot = await get(deviceRef)

    if (!snapshot.exists()) {
      // First time seeing this device
      await set(deviceRef, {
        odUserId: user.uid,
        firstSeen: serverTimestamp(),
        lastSeen: serverTimestamp(),
        sessionCount: 1
      })
    } else {
      // Update existing device
      const deviceData = snapshot.val()
      await set(deviceRef, {
        ...deviceData,
        odUserId: user.uid,
        lastSeen: serverTimestamp(),
        sessionCount: (deviceData.sessionCount || 0) + 1
      })
    }
  } catch (error) {
    console.error('Error registering device:', error)
    // Non-blocking - don't break the app if this fails
  }
}

/**
 * Get device ID for use in reports and bans
 */
export async function getDeviceIdForReport(): Promise<string> {
  return getDeviceFingerprint()
}

/**
 * Format ban remaining time for display
 */
export function formatBanTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''}`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}
