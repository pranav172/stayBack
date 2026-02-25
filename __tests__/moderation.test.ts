/// <reference types="jest" />
/**
 * mujAnon Comprehensive Test Suite
 * Covers: moderation, TTL filter, group room logic, confession limits, time utils
 */

import {
  moderateMessage,
  checkOffensiveContent,
  checkSensitiveInfo,
  getWarningMessage,
  calculateQueuePriority,
  formatTimeRemaining,
} from '../lib/moderation'

// ══════════════════════════════════════════════════════════════════════════════════════
// 1. MODERATION — OFFENSIVE CONTENT
// ══════════════════════════════════════════════════════════════════════════════════════
describe('checkOffensiveContent', () => {
  const CLEAN = ['hello', 'what year are you in?', 'best biryani in Jaipur?', 'let\'s study together', '😊 how\'s your day?']
  const DIRTY = ['send nudes', 'kys', 'kill yourself', 'go fuck yourself']

  test.each(CLEAN)('passes clean: %s', msg => {
    expect(checkOffensiveContent(msg)).toBe(false)
  })
  test.each(DIRTY)('blocks dirty: %s', msg => {
    expect(checkOffensiveContent(msg)).toBe(true)
  })
  it('is case-insensitive', () => {
    expect(checkOffensiveContent('SEND NUDES')).toBe(true)
    expect(checkOffensiveContent('KYS')).toBe(true)
  })
  it('partial-word match in sentence', () => {
    expect(checkOffensiveContent('please kys tomorrow')).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 2. MODERATION — SENSITIVE INFO
// ══════════════════════════════════════════════════════════════════════════════════════
describe('checkSensitiveInfo', () => {
  it('blocks 10-digit Indian phone numbers', () => {
    expect(checkSensitiveInfo('call me at 9876543210')).toBe(true)
  })
  it('blocks phone with +91 prefix', () => {
    expect(checkSensitiveInfo('+91 9876543210')).toBe(true)
    expect(checkSensitiveInfo('+91-9876543210')).toBe(true)
  })
  it('blocks email addresses', () => {
    expect(checkSensitiveInfo('email me at test@muj.manipal.edu')).toBe(true)
    expect(checkSensitiveInfo('john@example.com')).toBe(true)
  })
  it('blocks HTTP URLs', () => {
    expect(checkSensitiveInfo('check this https://example.com/chat')).toBe(true)
  })
  it('allows social handle sharing (📸 prefix)', () => {
    expect(checkSensitiveInfo('📸 My Instagram: @john.doe')).toBe(false)
  })
  it('allows Snapchat handle sharing', () => {
    expect(checkSensitiveInfo('👻 My Snapchat: @johndoe')).toBe(false)
  })
  it('allows clean messages', () => {
    expect(checkSensitiveInfo('What is your hostel?')).toBe(false)
    expect(checkSensitiveInfo('I love chai at the canteen')).toBe(false)
  })
  it('does not block 9-digit numbers (too short)', () => {
    expect(checkSensitiveInfo('code is 987654321')).toBe(false)
  })
  it('called multiple times returns consistent results (no lastIndex bug)', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkSensitiveInfo('john@example.com')).toBe(true)
      expect(checkSensitiveInfo('clean message')).toBe(false)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 3. MODERATION — moderateMessage composite
// ══════════════════════════════════════════════════════════════════════════════════════
describe('moderateMessage', () => {
  it('clean message → isClean=true, no warn', () => {
    const r = moderateMessage('Which prof teaches DSA best?')
    expect(r.isClean).toBe(true)
    expect(r.shouldWarn).toBe(false)
  })
  it('empty / whitespace → spam', () => {
    expect(moderateMessage('   ').isClean).toBe(false)
    expect(moderateMessage('   ').reason).toBe('spam')
    expect(moderateMessage('').isClean).toBe(false)
  })
  it('offensive word → isClean=false, reason=offensive, warn=true', () => {
    const r = moderateMessage('kys')
    expect(r.isClean).toBe(false)
    expect(r.reason).toBe('offensive')
    expect(r.shouldWarn).toBe(true)
  })
  it('phone number → isClean=false, reason=sensitive_info, warn=true', () => {
    const r = moderateMessage('call me 9876543210')
    expect(r.isClean).toBe(false)
    expect(r.reason).toBe('sensitive_info')
    expect(r.shouldWarn).toBe(true)
  })
  it('email → sensitive_info', () => {
    const r = moderateMessage('hmu at foo@bar.com')
    expect(r.isClean).toBe(false)
    expect(r.reason).toBe('sensitive_info')
  })
  it('social share allowed through', () => {
    const r = moderateMessage('📸 My Instagram: @john.doe')
    expect(r.isClean).toBe(true)
  })
  it('repeated calls return consistent result', () => {
    for (let i = 0; i < 10; i++) {
      expect(moderateMessage('hmu at foo@bar.com').isClean).toBe(false)
      expect(moderateMessage('hello there').isClean).toBe(true)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 4. MODERATION — Warning Messages
// ══════════════════════════════════════════════════════════════════════════════════════
describe('getWarningMessage', () => {
  it('offensive → mentions respectful', () => {
    expect(getWarningMessage('offensive').toLowerCase()).toContain('respectful')
  })
  it('sensitive_info → mentions personal info', () => {
    expect(getWarningMessage('sensitive_info').toLowerCase()).toContain('personal info')
  })
  it('spam → returns non-empty string', () => {
    expect(getWarningMessage('spam').length).toBeGreaterThan(0)
  })
  it('unknown reason → falls back gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = getWarningMessage('unknown_reason' as any)
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 5. QUEUE PRIORITY
// ══════════════════════════════════════════════════════════════════════════════════════
describe('calculateQueuePriority', () => {
  it('clean users get base priority (100)', () => {
    expect(calculateQueuePriority(0, 0)).toBe(100)
  })
  it('each report adds to priority (longer wait)', () => {
    expect(calculateQueuePriority(1, 0)).toBeGreaterThan(100)
    expect(calculateQueuePriority(5, 0)).toBeGreaterThan(calculateQueuePriority(1, 0))
  })
  it('warnings also increase priority', () => {
    expect(calculateQueuePriority(0, 3)).toBeGreaterThan(100)
  })
  it('returns a number', () => {
    expect(typeof calculateQueuePriority(2, 1)).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 6. FORMAT TIME REMAINING
// ══════════════════════════════════════════════════════════════════════════════════════
describe('formatTimeRemaining', () => {
  it('0ms → 0:00', () => expect(formatTimeRemaining(0)).toBe('0:00'))
  it('1 minute → 1:00', () => expect(formatTimeRemaining(60_000)).toBe('1:00'))
  it('90 seconds → 1:30', () => expect(formatTimeRemaining(90_000)).toBe('1:30'))
  it('10 minutes → 10:00', () => expect(formatTimeRemaining(600_000)).toBe('10:00'))
  it('negative → clamps to 0:00', () => expect(formatTimeRemaining(-1000)).toBe('0:00'))
  it('pads seconds correctly', () => {
    expect(formatTimeRemaining(65_000)).toBe('1:05')
    expect(formatTimeRemaining(9_000)).toBe('0:09')
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 7. TTL-BASED ONLINE COUNT (ghost fix)
// ══════════════════════════════════════════════════════════════════════════════════════
const TTL = 90_000
function countLive(snap: Record<string, { lastSeen?: number }>): number {
  const threshold = Date.now() - TTL
  return Object.values(snap).filter(e => ((e?.lastSeen ?? 0) as number) > threshold).length
}

describe('countLiveConnections — TTL filter', () => {
  const now = Date.now()

  it('counts fresh connections', () => {
    expect(countLive({ u1: { lastSeen: now - 10_000 }, u2: { lastSeen: now - 30_000 } })).toBe(2)
  })
  it('excludes stale ghosts (> 90s)', () => {
    expect(countLive({ ghost: { lastSeen: now - 120_000 }, live: { lastSeen: now - 20_000 } })).toBe(1)
  })
  it('excludes missing lastSeen (old schema)', () => {
    expect(countLive({ old: {}, fresh: { lastSeen: now - 5_000 } })).toBe(1)
  })
  it('empty snapshot → 0', () => expect(countLive({})).toBe(0))
  it('all stale → 0', () => {
    expect(countLive({ g1: { lastSeen: now - 200_000 }, g2: { lastSeen: 0 } })).toBe(0)
  })
  it('exactly at TTL boundary is excluded (> not >=)', () => {
    expect(countLive({ edge: { lastSeen: now - TTL } })).toBe(0)
  })
  it('large batch: 100 live + 50 ghosts = 100', () => {
    const snap: Record<string, { lastSeen: number }> = {}
    for (let i = 0; i < 100; i++) snap[`live-${i}`] = { lastSeen: now - Math.floor(Math.random() * 80_000) }
    for (let i = 0; i < 50; i++) snap[`ghost-${i}`] = { lastSeen: now - 100_000 - i * 1000 }
    expect(countLive(snap)).toBe(100)
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 8. GROUP ROOM LOGIC (pure functions extracted)
// ══════════════════════════════════════════════════════════════════════════════════════
const GROUP_TTL_MS = 30 * 60 * 1000
const MAX_MEMBERS = 4
const LABELS = ['A', 'B', 'C', 'D'] as const

type RoomData = { isActive?: boolean; createdAt?: number; members?: Record<string, string> }

function isRoomAvailable(room: RoomData, now = Date.now()): boolean {
  return !!(room.isActive && room.createdAt && (now - room.createdAt < GROUP_TTL_MS) &&
    Object.keys(room.members || {}).length < MAX_MEMBERS)
}

function getNextLabel(room: RoomData): string {
  const used = Object.values(room.members || {})
  return LABELS.find(l => !used.includes(l)) ?? LABELS[LABELS.length - 1]
}

describe('isRoomAvailable', () => {
  const now = Date.now()
  it('fresh room with space → available', () => {
    expect(isRoomAvailable({ isActive: true, createdAt: now - 5_000, members: { u1: 'A' } })).toBe(true)
  })
  it('full room → not available', () => {
    expect(isRoomAvailable({ isActive: true, createdAt: now, members: { u1: 'A', u2: 'B', u3: 'C', u4: 'D' } })).toBe(false)
  })
  it('expired room → not available', () => {
    expect(isRoomAvailable({ isActive: true, createdAt: now - GROUP_TTL_MS - 1000, members: {} })).toBe(false)
  })
  it('inactive room → not available', () => {
    expect(isRoomAvailable({ isActive: false, createdAt: now, members: {} })).toBe(false)
  })
  it('missing createdAt → not available', () => {
    expect(isRoomAvailable({ isActive: true, members: {} })).toBe(false)
  })
  it('empty room → available', () => {
    expect(isRoomAvailable({ isActive: true, createdAt: now, members: {} })).toBe(true)
  })
})

describe('getNextLabel', () => {
  it('empty room → A', () => expect(getNextLabel({ members: {} })).toBe('A'))
  it('A taken → B', () => expect(getNextLabel({ members: { u1: 'A' } })).toBe('B'))
  it('A and B taken → C', () => expect(getNextLabel({ members: { u1: 'A', u2: 'B' } })).toBe('C'))
  it('A, B, C taken → D', () => expect(getNextLabel({ members: { u1: 'A', u2: 'B', u3: 'C' } })).toBe('D'))
  it('no members field → A', () => expect(getNextLabel({})).toBe('A'))
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 9. CONFESSION POST LIMITS (client-side rate-limiting logic)
// ══════════════════════════════════════════════════════════════════════════════════════
const MAX_POSTS_PER_DAY = 3

function canPost(storageData: Record<string, number>, today: string): boolean {
  return (storageData[today] || 0) < MAX_POSTS_PER_DAY
}
function recordPost(storageData: Record<string, number>, today: string): Record<string, number> {
  return { ...storageData, [today]: (storageData[today] || 0) + 1 }
}

describe('confession post rate limiting', () => {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86_400_000).toDateString()

  it('can post if no posts today', () => expect(canPost({}, today)).toBe(true))
  it('can post after 1 or 2 posts', () => {
    expect(canPost({ [today]: 1 }, today)).toBe(true)
    expect(canPost({ [today]: 2 }, today)).toBe(true)
  })
  it('cannot post after 3 posts today', () => expect(canPost({ [today]: 3 }, today)).toBe(false))
  it('yesterday posts don\'t count toward today', () => {
    expect(canPost({ [yesterday]: 3 }, today)).toBe(true)
  })
  it('recordPost increments count', () => {
    const after = recordPost({}, today)
    expect(after[today]).toBe(1)
    const after2 = recordPost(after, today)
    expect(after2[today]).toBe(2)
  })
  it('cannot post when count is exactly MAX', () => {
    expect(canPost({ [today]: MAX_POSTS_PER_DAY }, today)).toBe(false)
  })
  it('can post on new day even after 3 yesterday', () => {
    expect(canPost({ [yesterday]: 3, [today]: 0 }, today)).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════
// 10. EDGE CASES — BOUNDARY CONDITIONS
// ══════════════════════════════════════════════════════════════════════════════════════
describe('Edge Cases', () => {
  it('ultra long message (5000 chars) passes moderation text check (length limit is at write level)', () => {
    const longMsg = 'a'.repeat(5000)
    const result = moderateMessage(longMsg)
    // moderation doesn't check length — Firebase rules do
    expect(result.isClean).toBe(true)
  })
  it('unicode emoji message is clean', () => {
    expect(moderateMessage('🙌🔥💜✨ heyy!!').isClean).toBe(true)
  })
  it('Hindi text is clean', () => {
    expect(moderateMessage('आप कैसे हैं?').isClean).toBe(true)
  })
  it('message with @ but no protocol is clean', () => {
    expect(checkSensitiveInfo('@johndoe on ig')).toBe(false)
  })
  it('formatTimeRemaining of very large values', () => {
    const result = formatTimeRemaining(7200_000) // 2 hours
    expect(result).toMatch(/^\d+:\d{2}$/) // e.g. "120:00"
  })
  it('moderateMessage called 100 times alternating has no state leakage', () => {
    for (let i = 0; i < 100; i++) {
      expect(moderateMessage('john@example.com').isClean).toBe(false)
      expect(moderateMessage('hey there, what is your major?').isClean).toBe(true)
    }
  })
})
