/// <reference types="jest" />
/**
 * Tests for the TTL-based online count filter logic.
 * These test the pure countLiveConnections logic extracted for testability.
 */

const CONNECTION_TTL_MS = 90_000

// Extracted pure function matching the one in connection-provider.tsx
function countLiveConnections(snapshot: Record<string, { lastSeen?: number }>): number {
  const threshold = Date.now() - CONNECTION_TTL_MS
  return Object.values(snapshot).filter(entry => {
    const lastSeen = typeof entry?.lastSeen === 'number' ? entry.lastSeen : 0
    return lastSeen > threshold
  }).length
}

describe('countLiveConnections (TTL filter)', () => {
  const now = Date.now()

  it('counts connections with recent lastSeen', () => {
    const snapshot = {
      'user-1': { lastSeen: now - 10_000 }, // 10s ago — alive
      'user-2': { lastSeen: now - 45_000 }, // 45s ago — alive
      'user-3': { lastSeen: now - 80_000 }, // 80s ago — alive (just under TTL)
    }
    expect(countLiveConnections(snapshot)).toBe(3)
  })

  it('excludes stale connections beyond TTL', () => {
    const snapshot = {
      'user-ghost': { lastSeen: now - 120_000 }, // 2 min ago — ghost!
      'user-alive': { lastSeen: now - 30_000 },  // 30s ago — alive
    }
    expect(countLiveConnections(snapshot)).toBe(1)
  })

  it('excludes connections with no lastSeen (old schema)', () => {
    const snapshot = {
      'user-old': {},  // no lastSeen — treat as dead
      'user-new': { lastSeen: now - 20_000 },
    }
    expect(countLiveConnections(snapshot)).toBe(1)
  })

  it('returns 0 for empty snapshot', () => {
    expect(countLiveConnections({})).toBe(0)
  })

  it('handles all stale connections', () => {
    const snapshot = {
      'ghost-1': { lastSeen: now - 200_000 },
      'ghost-2': { lastSeen: now - 300_000 },
      'ghost-3': { lastSeen: 0 },
    }
    expect(countLiveConnections(snapshot)).toBe(0)
  })

  it('correctly handles TTL boundary (exactly at TTL edge is excluded)', () => {
    const exactlyAtTTL = { lastSeen: now - CONNECTION_TTL_MS }
    expect(countLiveConnections({ user: exactlyAtTTL })).toBe(0) // equal = excluded (not greater)
  })

  it('counts large batches correctly', () => {
    const snapshot: Record<string, { lastSeen: number }> = {}
    for (let i = 0; i < 100; i++) {
      snapshot[`user-alive-${i}`] = { lastSeen: now - Math.floor(Math.random() * 80_000) }
    }
    for (let i = 0; i < 50; i++) {
      snapshot[`user-ghost-${i}`] = { lastSeen: now - 100_000 - Math.floor(Math.random() * 100_000) }
    }
    expect(countLiveConnections(snapshot)).toBe(100)
  })
})
