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
    <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full status-online" />
        <span className="text-xs font-medium text-white/90">
             {count > 0 ? count : '...'} online
        </span>
    </div>
  )
}
