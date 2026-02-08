// Moderation utilities for mujAnon
// Client-side content filtering and safety features

// Offensive keywords blacklist (basic - extend as needed)
const OFFENSIVE_KEYWORDS = [
  // Explicit content indicators
  'nudes', 'nude', 'naked', 'sex', 'porn', 'xxx',
  // Harassment terms
  'kill yourself', 'kys', 'die',
  // Add more as needed
]

// Patterns to detect and block (prevent doxxing)
const SENSITIVE_PATTERNS = [
  // Phone numbers (Indian format)
  /\b[6-9]\d{9}\b/g,
  // Phone with country code
  /\+91[\s-]?\d{10}/g,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Links (basic URL pattern)
  /https?:\/\/[^\s]+/gi,
]

// Allowed social patterns (for sharing feature)
const ALLOWED_SOCIAL_PATTERNS = [
  /📸 My Instagram: @[\w.]+/,
  /👻 My Snapchat: @[\w.]+/,
]

export interface ModerationResult {
  isClean: boolean
  reason?: 'offensive' | 'sensitive_info' | 'spam'
  shouldWarn: boolean
  filteredText?: string
}

/**
 * Check if message contains offensive content
 */
export function checkOffensiveContent(text: string): boolean {
  const lowerText = text.toLowerCase()
  return OFFENSIVE_KEYWORDS.some(keyword => lowerText.includes(keyword))
}

/**
 * Check if message contains sensitive personal info
 */
export function checkSensitiveInfo(text: string): boolean {
  // First check if it's an allowed social share message
  if (ALLOWED_SOCIAL_PATTERNS.some(pattern => pattern.test(text))) {
    return false
  }
  
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(text))
}

/**
 * Main moderation function - checks message before sending
 */
export function moderateMessage(text: string): ModerationResult {
  const trimmedText = text.trim()
  
  // Empty message
  if (!trimmedText) {
    return { isClean: false, reason: 'spam', shouldWarn: false }
  }
  
  // Check for offensive keywords
  if (checkOffensiveContent(trimmedText)) {
    return { 
      isClean: false, 
      reason: 'offensive', 
      shouldWarn: true 
    }
  }
  
  // Check for sensitive personal info (except allowed social patterns)
  if (checkSensitiveInfo(trimmedText)) {
    return { 
      isClean: false, 
      reason: 'sensitive_info', 
      shouldWarn: true 
    }
  }
  
  return { isClean: true, shouldWarn: false }
}

/**
 * Get warning message for user
 */
export function getWarningMessage(reason: ModerationResult['reason']): string {
  switch (reason) {
    case 'offensive':
      return "Let's keep it respectful 🙏"
    case 'sensitive_info':
      return "Sharing personal info like phone numbers or emails isn't safe here. Use the social share buttons instead!"
    case 'spam':
      return "Please type a message"
    default:
      return "Message blocked"
  }
}

// Report reasons for UI
export const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment', icon: '😠' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: '🔞' },
  { id: 'spam', label: 'Spam / Bot', icon: '🤖' },
  { id: 'threats', label: 'Threats / Violence', icon: '⚠️' },
  { id: 'other', label: 'Other', icon: '❓' },
] as const

export type ReportReason = typeof REPORT_REASONS[number]['id']

// Chat session limits
export const CHAT_LIMITS = {
  SESSION_DURATION_MS: 10 * 60 * 1000, // 10 minutes
  WARNING_THRESHOLD_MS: 2 * 60 * 1000, // 2 minutes remaining
  MAX_MESSAGES_PER_SESSION: 60,
  MESSAGE_RATE_LIMIT_MS: 1000, // 1 message per second
  NEXT_BUTTON_COOLDOWN_MS: 2000, // 2 seconds between "next" clicks
  INACTIVITY_NUDGE_MS: 60 * 1000, // 60 seconds before nudge
  INACTIVITY_OFFER_MS: 2 * 60 * 1000, // 2 minutes before offering new match
}

/**
 * Format remaining time for display
 */
export function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Calculate reputation-based queue priority
 * Lower number = higher priority (faster matching)
 */
export function calculateQueuePriority(reportCount: number, warnings: number): number {
  // Base priority is 100
  // Each report adds 20 to priority (longer wait)
  // Each warning adds 10
  return 100 + (reportCount * 20) + (warnings * 10)
}
