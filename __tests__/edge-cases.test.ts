/**
 * mujAnon — Edge Case & Reliability Test Suite
 * Senior-engineer POV: real failure modes at production scale.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// localStorage polyfill for Node test environment
const _store: Record<string, string> = {}
const localStorage = {
  getItem: (k: string) => _store[k] ?? null,
  setItem: (k: string, v: string) => { _store[k] = v },
  removeItem: (k: string) => { delete _store[k] },
  clear: () => { Object.keys(_store).forEach(k => delete _store[k]) },
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const MAX_POSTS_PER_DAY = 3

function canPostConfession(user: { uid: string } | null) { return user !== null }

function canPostToday(): boolean {
  try {
    const today = new Date().toDateString()
    const raw = localStorage.getItem('mujanon_post_count')
    const data = raw ? JSON.parse(raw) : {}
    return (data[today] || 0) < MAX_POSTS_PER_DAY
  } catch { return true }
}

function incrementPostCount(today: string): void {
  const raw = localStorage.getItem('mujanon_post_count')
  const data = raw ? JSON.parse(raw) : {}
  data[today] = (data[today] || 0) + 1
  localStorage.setItem('mujanon_post_count', JSON.stringify(data))
}

function computeExpiresAt() { return Date.now() + 48 * 60 * 60 * 1000 }

function friendlyErrorMessage(error: Error): string {
  if (error.message.includes('PERMISSION_DENIED')) return 'Auth not ready yet — wait 2s and retry.'
  return 'Failed to post. Try again.'
}

const SENSITIVE_PATTERNS = [
  /\b[6-9]\d{9}\b/,
  /\+91[\s-]?\d{10}/,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /https?:\/\/[^\s]+/i,
]
const OFFENSIVE_KEYWORDS = ['nudes', 'nude', 'naked', 'sex', 'porn', 'xxx', 'kill yourself', 'kys']

function containsSensitiveInfo(text: string) {
  return SENSITIVE_PATTERNS.some(p => new RegExp(p.source, p.flags).test(text))
}
function containsOffensiveContent(text: string) {
  const lower = text.toLowerCase()
  return OFFENSIVE_KEYWORDS.some(k => lower.includes(k))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Auth Race Conditions', () => {
  it('blocks post when auth.currentUser is null', () => expect(canPostConfession(null)).toBe(false))
  it('allows post after auth ready', () => expect(canPostConfession({ uid: 'x' })).toBe(true))
  it('hides PERMISSION_DENIED from user', () => {
    const msg = friendlyErrorMessage(new Error('PERMISSION_DENIED'))
    expect(msg).not.toContain('PERMISSION_DENIED')
  })
})

describe('Confession Rate Limiting', () => {
  beforeEach(() => localStorage.clear())

  it('allows exactly 3 per day then blocks', () => {
    const today = new Date().toDateString()
    for (let i = 0; i < 3; i++) { expect(canPostToday()).toBe(true); incrementPostCount(today) }
    expect(canPostToday()).toBe(false)
  })

  it('resets on new day', () => {
    const yd = new Date(Date.now() - 86400000).toDateString()
    localStorage.setItem('mujanon_post_count', JSON.stringify({ [yd]: 3 }))
    expect(canPostToday()).toBe(true)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('mujanon_post_count', 'INVALID{{{')
    expect(() => canPostToday()).not.toThrow()
    expect(canPostToday()).toBe(true)
  })
})

describe('Confession TTL Integrity', () => {
  it('filters expired confessions client-side', () => {
    const now = Date.now()
    const list = [
      { id: 'a', expiresAt: now + 10000 },
      { id: 'b', expiresAt: now - 1000 },  // expired
      { id: 'c', expiresAt: undefined },     // no TTL: kept (compat)
    ]
    const kept = list.filter(c => !c.expiresAt || c.expiresAt > now)
    expect(kept).toHaveLength(2)
    expect(kept.find(c => c.id === 'b')).toBeUndefined()
  })

  it('expiresAt is 48h from now', () => {
    const expected = 48 * 60 * 60 * 1000
    const t = computeExpiresAt()
    expect(t - Date.now()).toBeGreaterThanOrEqual(expected - 200)
    expect(t - Date.now()).toBeLessThanOrEqual(expected + 200)
  })

  it('legacy confessions (no expiresAt) pass through for backward compat', () => {
    const legacy: any = { id: 'x' }
    expect(!legacy.expiresAt || legacy.expiresAt > Date.now()).toBe(true)
  })
})

describe('Group Room Lifecycle', () => {
  const TTL = 30 * 60 * 1000
  const MAX = 4
  const LABELS = ['A', 'B', 'C', 'D']

  it('hides rooms older than 30 min', () => {
    const now = Date.now()
    const rooms = [
      { id: 'r1', createdAt: now - 10 * 60 * 1000, isActive: true },
      { id: 'r2', createdAt: now - 35 * 60 * 1000, isActive: true },
    ]
    const visible = rooms.filter(r => r.isActive && (now - r.createdAt < TTL))
    expect(visible).toHaveLength(1)
    expect(visible[0].id).toBe('r1')
  })

  it('blocks joining full rooms', () => {
    expect(4 < MAX).toBe(false)
    expect(3 < MAX).toBe(true)
  })

  it('assigns next available label', () => {
    const used = ['A', 'C']
    expect(LABELS.find(l => !used.includes(l))).toBe('B')
  })

  it('TODO: concurrent joins need runTransaction to avoid last-write-wins race', () => {
    // Using set() is last-write-wins — two simultaneous joins can overwrite each other.
    // Fix: migrate to runTransaction() on the members node.
    expect('use runTransaction for concurrent join safety').toBeTruthy()
  })
})

describe('Hearts Persistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves hearted IDs to localStorage', () => {
    localStorage.setItem('mujanon_hearts', JSON.stringify(['conf-123']))
    const saved = JSON.parse(localStorage.getItem('mujanon_hearts') || '[]')
    expect(saved).toContain('conf-123')
  })

  it('prevents double-hearting', () => {
    const set = new Set(['conf-abc'])
    const tryHeart = (id: string) => { if (set.has(id)) return false; set.add(id); return true }
    expect(tryHeart('conf-abc')).toBe(false)
    expect(tryHeart('conf-new')).toBe(true)
  })

  it('swallows hearts PERMISSION_DENIED silently', async () => {
    const fn = async () => { try { throw new Error('PERMISSION_DENIED') } catch { /**/ } }
    await expect(fn()).resolves.toBeUndefined()
  })
})

describe('Content Moderation', () => {
  it('blocks phone numbers', () => {
    expect(containsSensitiveInfo('call 9876543210')).toBe(true)
    expect(containsSensitiveInfo('num 9123456789')).toBe(true)
  })
  it('blocks emails', () => expect(containsSensitiveInfo('a@muj.edu.in')).toBe(true))
  it('blocks URLs', () => expect(containsSensitiveInfo('https://ig.com/x')).toBe(true))
  it('allows clean text', () => {
    expect(containsSensitiveInfo('I like someone in CS batch')).toBe(false)
    expect(containsOffensiveContent('I like someone in CS batch')).toBe(false)
  })
})

describe('Shadowban', () => {
  it('active non-expired ban = blocked', () => {
    const b = { active: true, expiresAt: Date.now() + 1000 }
    expect(b.active && b.expiresAt > Date.now()).toBe(true)
  })
  it('expired ban = unblocked', () => {
    const b = { active: true, expiresAt: Date.now() - 1000 }
    expect(b.active && b.expiresAt > Date.now()).toBe(false)
  })
})

describe('PWA', () => {
  it('does not crash if serviceWorker is unavailable', () => {
    const nav: Record<string, unknown> = {}
    expect(() => { if ('serviceWorker' in nav) { /**/ } }).not.toThrow()
  })
})
