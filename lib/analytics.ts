/**
 * Analytics Utilities
 * 
 * Mixpanel integration for tracking user behavior
 */

// Mixpanel types for client-side usage
type MixpanelInstance = {
  track: (event: string, properties?: Record<string, unknown>) => void
  identify: (userId: string) => void
  people: {
    set: (properties: Record<string, unknown>) => void
  }
  reset: () => void
}

let mixpanel: MixpanelInstance | null = null

/**
 * Initialize Mixpanel
 * Call this once when the app loads
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined') return
  
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) {
    console.log('Analytics: Mixpanel token not configured')
    return
  }
  
  // Dynamic import to avoid SSR issues
  import('mixpanel-browser').then((mp) => {
    mp.default.init(token, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    })
    mixpanel = mp.default as unknown as MixpanelInstance
    console.log('Analytics: Mixpanel initialized')
  }).catch((err) => {
    console.error('Analytics: Failed to load Mixpanel', err)
  })
}

/**
 * Identify user for analytics
 */
export function identifyUser(userId: string): void {
  if (!mixpanel) return
  mixpanel.identify(userId)
}

/**
 * Track an event
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (!mixpanel) {
    // Log to console in development if Mixpanel not configured
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}`, properties)
    }
    return
  }
  mixpanel.track(event, properties)
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!mixpanel) return
  mixpanel.people.set(properties)
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics(): void {
  if (!mixpanel) return
  mixpanel.reset()
}

// ============================================
// Pre-defined Event Names
// ============================================

export const EVENTS = {
  // Matching
  SEARCH_STARTED: 'search_started',
  SEARCH_CANCELLED: 'search_cancelled',
  MATCH_FOUND: 'match_found',
  
  // Chat
  CHAT_STARTED: 'chat_started',
  MESSAGE_SENT: 'message_sent',
  CHAT_ENDED: 'chat_ended',
  PARTNER_DISCONNECTED: 'partner_disconnected',
  
  // Reports
  REPORT_OPENED: 'report_opened',
  REPORT_SUBMITTED: 'report_submitted',
  
  // Feedback
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  
  // Verification
  VERIFICATION_STARTED: 'verification_started',
  VERIFICATION_COMPLETED: 'verification_completed',
  VERIFICATION_FAILED: 'verification_failed',
  
  // Session
  SESSION_STARTED: 'session_started',
  PAGE_VIEW: 'page_view',
} as const
