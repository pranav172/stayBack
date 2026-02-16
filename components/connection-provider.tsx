'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { database, auth } from '@/lib/firebase'
import { ref, set, remove, onValue, onDisconnect, serverTimestamp, off } from 'firebase/database'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'

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

  useEffect(() => {
    signInAnonymously(auth).catch(e => console.error('[ConnectionProvider] Auth error:', e))

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[ConnectionProvider] Auth ready, uid:', user.uid)
        setUserId(user.uid)

        // Clean up previous .info/connected listener if auth fires again
        if (infoListenerCleanup.current) {
          infoListenerCleanup.current()
          infoListenerCleanup.current = null
        }

        const infoRef = ref(database, '.info/connected')
        const unsubInfo = onValue(infoRef, (snap) => {
          console.log('[ConnectionProvider] .info/connected:', snap.val())
          if (snap.val() === true) {
            setIsConnected(true)
            const myConnectionRef = ref(database, `connections/${user.uid}`)
            onDisconnect(myConnectionRef).remove()
            set(myConnectionRef, {
              odUserId: user.uid,
              connectedAt: serverTimestamp(),
              lastSeen: serverTimestamp(),
            }).then(() => {
              console.log('[ConnectionProvider] Connection written for', user.uid)
            }).catch(e => console.error('[ConnectionProvider] Connection write error:', e))

            // Heartbeat every 30s
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            heartbeatRef.current = setInterval(() => {
              set(ref(database, `connections/${user.uid}/lastSeen`), serverTimestamp())
            }, 30000)
          } else {
            setIsConnected(false)
          }
        })
        infoListenerCleanup.current = unsubInfo
      } else {
        console.log('[ConnectionProvider] No user')
        setUserId(null)
      }
    })

    // Listen to total online count
    const connectionsRef = ref(database, 'connections')
    const unsubConnections = onValue(connectionsRef, (snapshot) => {
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      setOnlineCount(count)
    })

    // Only remove connection on actual tab close
    const handleBeforeUnload = () => {
      const uid = auth.currentUser?.uid
      if (uid) {
        remove(ref(database, `connections/${uid}`))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      unsubAuth()
      unsubConnections()
      if (infoListenerCleanup.current) infoListenerCleanup.current()
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
