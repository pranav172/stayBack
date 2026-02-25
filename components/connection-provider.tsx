'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { database, auth } from '@/lib/firebase'
import { ref, set, remove, onValue, onDisconnect, serverTimestamp, off } from 'firebase/database'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'

// ─── TTL: a connection older than 90s without a fresh lastSeen is considered stale ───────────
const CONNECTION_TTL_MS = 90_000     // 90 seconds — 3× the heartbeat interval
const HEARTBEAT_INTERVAL_MS = 20_000 // Update lastSeen every 20 seconds

function countLiveConnections(snapshot: Record<string, { lastSeen: number }>): number {
  const threshold = Date.now() - CONNECTION_TTL_MS
  return Object.values(snapshot).filter(entry => {
    // Keep entries that have a recent lastSeen OR were just created (no lastSeen yet)
    const lastSeen = typeof entry?.lastSeen === 'number' ? entry.lastSeen : 0
    return lastSeen > threshold
  }).length
}

interface ConnectionContextType {
  userId: string | null
  onlineCount: number
  isConnected: boolean
}

const ConnectionContext = createContext<ConnectionContextType>({
  userId: null,
  onlineCount: 0,
  isConnected: false,
})

export function useConnection() {
  return useContext(ConnectionContext)
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const infoListenerCleanup = useRef<(() => void) | null>(null)
  const myUidRef = useRef<string | null>(null)

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error('[ConnectionProvider] Auth error:', e))

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[ConnectionProvider] Auth ready, uid:', user.uid)
        myUidRef.current = user.uid
        setUserId(user.uid)

        // Clean up previous .info/connected listener if auth fires again
        if (infoListenerCleanup.current) {
          infoListenerCleanup.current()
          infoListenerCleanup.current = null
        }

        const infoRef = ref(database, '.info/connected')
        const unsubInfo = onValue(infoRef, (snap) => {
          if (snap.val() === true) {
            setIsConnected(true)
            const myConnectionRef = ref(database, `connections/${user.uid}`)

            // Remove on disconnect — server-side guarantee
            onDisconnect(myConnectionRef).remove()

            // Write presence entry with current timestamp
            const now = Date.now()
            set(myConnectionRef, {
              odUserId: user.uid,
              connectedAt: serverTimestamp(),
              lastSeen: now,
            }).catch(e => console.error('[ConnectionProvider] Connection write error:', e))

            // Heartbeat: refresh lastSeen every 20s
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            heartbeatRef.current = setInterval(() => {
              set(ref(database, `connections/${user.uid}/lastSeen`), Date.now())
            }, HEARTBEAT_INTERVAL_MS)
          } else {
            setIsConnected(false)
          }
        })
        infoListenerCleanup.current = unsubInfo
      } else {
        myUidRef.current = null
        setUserId(null)
      }
    })

    // ── Listen to connections and apply TTL filter ──────────────────────────────────────────
    const connectionsRef = ref(database, 'connections')
    const unsubConnections = onValue(connectionsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setOnlineCount(0)
        return
      }
      const count = countLiveConnections(snapshot.val())
      setOnlineCount(Math.max(1, count)) // Always at least 1 (the current user)
    })

    // ── Refresh lastSeen when tab becomes visible again ─────────────────────────────────────
    const handleVisibilityChange = () => {
      const uid = myUidRef.current
      if (document.visibilityState === 'visible' && uid) {
        set(ref(database, `connections/${uid}/lastSeen`), Date.now()).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Remove connection on tab close (best-effort — onDisconnect handles the reliable case)
    const handleBeforeUnload = () => {
      const uid = auth.currentUser?.uid
      if (uid) remove(ref(database, `connections/${uid}`))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      unsubAuth()
      off(connectionsRef) // detach the connections listener properly
      unsubConnections()
      if (infoListenerCleanup.current) infoListenerCleanup.current()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [])

  return (
    <ConnectionContext.Provider value={{ userId, onlineCount, isConnected }}>
      {children}
    </ConnectionContext.Provider>
  )
}
