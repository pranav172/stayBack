'use client'

import { useEffect, useState } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'

export function OnlineCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Listen to connections (per-tab), not presence (per-user)
    const connectionsRef = ref(database, 'connections')
    const unsubscribe = onValue(connectionsRef, (snapshot) => {
      const onlineCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      setCount(onlineCount)
    })

    return () => unsubscribe()
  }, [])
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }} />
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
             {count > 0 ? count : '...'} online
        </span>
    </div>
  )
}
