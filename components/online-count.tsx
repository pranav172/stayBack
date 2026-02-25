'use client'

import { useEffect, useState } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'

const CONNECTION_TTL_MS = 90_000

function countLive(snapshot: Record<string, { lastSeen?: number }>): number {
  const threshold = Date.now() - CONNECTION_TTL_MS
  return Object.values(snapshot).filter(entry => {
    const lastSeen = typeof entry?.lastSeen === 'number' ? entry.lastSeen : 0
    return lastSeen > threshold
  }).length
}

export function OnlineCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const connectionsRef = ref(database, 'connections')
    const unsubscribe = onValue(connectionsRef, (snapshot) => {
      if (!snapshot.exists()) { setCount(0); return }
      setCount(Math.max(1, countLive(snapshot.val())))
    })
    return () => unsubscribe()
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      backgroundColor: 'var(--bg-surface)', padding: '6px 12px',
      borderRadius: '9999px', border: '1px solid var(--border-color)'
    }}>
      <div style={{
        width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
        animation: 'pulse 2s ease-in-out infinite'
      }} />
      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
        {count === null ? '...' : count} online
      </span>
    </div>
  )
}
