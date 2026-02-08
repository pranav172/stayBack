// Admin authentication utilities
import { auth, database } from './firebase'
import { ref, get } from 'firebase/database'

// List of admin emails (add your email here)
const ADMIN_EMAILS: string[] = [
  // Add admin emails here when deploying
  // 'admin@muj.manipal.edu',
]

// Or use environment variable
const ADMIN_EMAILS_FROM_ENV = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []

export const ALL_ADMIN_EMAILS = [...ADMIN_EMAILS, ...ADMIN_EMAILS_FROM_ENV]

/**
 * Check if current user is an admin
 * For now, uses email whitelist. Can be upgraded to Firebase custom claims later.
 */
export async function isAdmin(): Promise<boolean> {
  const user = auth.currentUser
  if (!user) return false
  
  // Check if user email is in admin list
  if (user.email && ALL_ADMIN_EMAILS.includes(user.email)) {
    return true
  }
  
  // Check Firebase for admin status (for future custom claims)
  try {
    const adminRef = ref(database, `admins/${user.uid}`)
    const snapshot = await get(adminRef)
    return snapshot.exists() && snapshot.val() === true
  } catch {
    return false
  }
}

/**
 * Admin password check (simple authentication for MVP)
 */
export function checkAdminPassword(password: string): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  if (!adminPassword) return false
  return password === adminPassword
}
