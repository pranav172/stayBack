'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { database, auth } from '@/lib/firebase'
import { ref, push, set, get, remove, onValue, onDisconnect, serverTimestamp } from 'firebase/database'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Zap, Square, Users, ArrowLeft, ChevronRight, ShieldCheck, BadgeCheck } from 'lucide-react'
import { checkShadowban } from '@/lib/shadowban'
import { checkVerificationStatus } from '@/lib/email-verification'
import { track, EVENTS, initAnalytics, identifyUser } from '@/lib/analytics'
import Link from 'next/link'

const ICEBREAKERS = [
  "What's the best chai spot on campus?",
  "Are 8am classes a scam?",
  "Best late-night study spot?",
  "What's your go-to canteen order?",
  "Hostel or day scholar life?",
]

export type ChatMode = 'platonics' | 'study' | 'random'

type MatchStep = 'mode' | 'tags' | 'matching'

const MODES = [
  { id: 'platonics' as ChatMode, emoji: '🤝', title: 'Platonics', desc: 'Make friends' },
  { id: 'study' as ChatMode, emoji: '📚', title: 'Study', desc: 'Find study buddy' },
  { id: 'random' as ChatMode, emoji: '🎲', title: 'Random', desc: 'Match anyone' },
]

const TAGS = ['Engineering', 'Law', 'Business', 'Gaming', 'Music', 'Anime', 'Sports', 'Tech', 'Movies', 'Memes']

function MatchButtonInner() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle')
  const [loading, setLoading] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState<MatchStep>('mode')
  const [selectedMode, setSelectedMode] = useState<ChatMode>('random')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [icebreaker, setIcebreaker] = useState(ICEBREAKERS[0])
  const [waitTime, setWaitTime] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isShadowbanned, setIsShadowbanned] = useState(false)
  
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const queueRef = useRef<string | null>(null)
  const connectionRef = useRef<string | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use sessionStorage so sessionId survives page refreshes/HMR
  const getSessionId = () => {
    if (typeof window === 'undefined') return crypto.randomUUID()
    let sid = sessionStorage.getItem('mujanon_session_id')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('mujanon_session_id', sid)
    }
    return sid
  }
  const sessionId = useRef<string>(getSessionId())

  useEffect(() => {
    if (status === 'searching') {
      const i1 = setInterval(() => {
        setIcebreaker(ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)])
      }, 3000)
      const i2 = setInterval(() => setWaitTime(prev => prev + 1), 1000)
      return () => { clearInterval(i1); clearInterval(i2) }
    } else {
      setWaitTime(0)
    }
  }, [status])

  useEffect(() => {
    initAnalytics()
    signInAnonymously(auth).catch(console.error)
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        identifyUser(user.uid)
        track(EVENTS.SESSION_STARTED)
        
        // Check verification status
        const verificationStatus = await checkVerificationStatus(user.uid)
        setIsVerified(verificationStatus.isVerified)
        
        // Check shadowban status
        const shadowbanStatus = await checkShadowban()
        setIsShadowbanned(shadowbanStatus.isShadowbanned)
        
        const connectedRef = ref(database, '.info/connected')
        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            const myConnectionRef = ref(database, `connections/${sessionId.current}`)
            onDisconnect(myConnectionRef).remove()
            set(myConnectionRef, { odUserId: user.uid, connectedAt: serverTimestamp(), lastSeen: serverTimestamp() })
            connectionRef.current = sessionId.current
            
            // Heartbeat: update lastSeen every 15 seconds
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            heartbeatRef.current = setInterval(() => {
              set(ref(database, `connections/${sessionId.current}/lastSeen`), serverTimestamp())
            }, 15000)
            
            if (searchParams.get('autoMatch') === 'true') {
              setStep('matching')
              setTimeout(() => handleMatch(), 500)
            }
          }
        })
      }
    })

    const unsubConnections = onValue(ref(database, 'connections'), (snapshot) => {
      setOnlineCount(snapshot.exists() ? Object.keys(snapshot.val()).length : 0)
    })

    const handleBeforeUnload = () => {
      if (connectionRef.current) remove(ref(database, `connections/${connectionRef.current}`))
      if (queueRef.current) remove(ref(database, `queue/${queueRef.current}`))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      unsubAuth()
      unsubConnections()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (unsubscribeRef.current) unsubscribeRef.current()
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (connectionRef.current) remove(ref(database, `connections/${connectionRef.current}`))
    }
  }, [searchParams])

  const handleStop = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      if (queueRef.current) { await remove(ref(database, `queue/${queueRef.current}`)); queueRef.current = null }
      if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null }
      setStatus('idle')
      setStep('mode')
    } finally { setLoading(false) }
  }, [userId])

  const handleMatch = useCallback(async () => {
    if (!userId || loading || !connectionRef.current) return
    setLoading(true)
    
    // Shadowbanned users see fake searching state - never actually match
    if (isShadowbanned) {
      setStatus('searching')
      setLoading(false)
      return
    }
    
    try {
      // Check if user already has an active chat using userChats index
      const userChatsSnapshot = await get(ref(database, `userChats/${userId}`))
      if (userChatsSnapshot.exists()) {
        const userChats = userChatsSnapshot.val()
        for (const [chatId, chatInfo] of Object.entries(userChats as Record<string, { isActive: boolean; sessionId: string }>)) {
          if (chatInfo.isActive && chatInfo.sessionId === sessionId.current) {
            setStatus('matched'); setLoading(false); router.push(`/chat/${chatId}`); return
          }
        }
      }
      
      const queueSnapshot = await get(ref(database, 'queue'))
      if (queueSnapshot.exists()) {
        const queue = queueSnapshot.val()
        const waitingKeys = Object.keys(queue).filter(key => {
          const e = queue[key]
          if (e.sessionId === sessionId.current || e.userId === userId) return false
          if (selectedMode !== 'random' && e.mode !== 'random' && e.mode !== selectedMode) return false
          return true
        }).sort((a, b) => {
          const aO = (queue[a].tags || []).filter((t: string) => selectedTags.includes(t)).length
          const bO = (queue[b].tags || []).filter((t: string) => selectedTags.includes(t)).length
          return bO - aO
        })
        
        if (waitingKeys.length > 0) {
          const matchKey = waitingKeys[0]
          const matchData = queue[matchKey]
          const chatRef = push(ref(database, 'chats'))
          const chatId = chatRef.key!
          
          await set(chatRef, {
            user1: matchData.userId, user2: userId,
            session1: matchData.sessionId, session2: sessionId.current,
            mode: selectedMode, tags: [...new Set([...selectedTags, ...(matchData.tags || [])])],
            createdAt: serverTimestamp(), isActive: true
          })
          
          // Update userChats index for both users
          await set(ref(database, `userChats/${matchData.userId}/${chatId}`), {
            sessionId: matchData.sessionId, isActive: true
          })
          await set(ref(database, `userChats/${userId}/${chatId}`), {
            sessionId: sessionId.current, isActive: true
          })
          
          await remove(ref(database, `queue/${matchKey}`))
          setStatus('matched'); setLoading(false); router.push(`/chat/${chatId}`); return
        }
      }
      
      const myQueueRef = push(ref(database, 'queue'))
      queueRef.current = myQueueRef.key
      await set(myQueueRef, {
        userId, sessionId: sessionId.current, connectionId: connectionRef.current,
        mode: selectedMode, tags: selectedTags, timestamp: serverTimestamp()
      })
      onDisconnect(myQueueRef).remove()
      setStatus('searching'); setLoading(false)
      
      // Listen to user's own chat index instead of all chats
      const unsubscribe = onValue(ref(database, `userChats/${userId}`), (snapshot) => {
        if (snapshot.exists()) {
          const userChats = snapshot.val()
          for (const [chatId, chatInfo] of Object.entries(userChats as Record<string, { isActive: boolean; sessionId: string }>)) {
            if (chatInfo.isActive && chatInfo.sessionId === sessionId.current) {
              setStatus('matched')
              if (queueRef.current) { remove(ref(database, `queue/${queueRef.current}`)); queueRef.current = null }
              unsubscribe(); unsubscribeRef.current = null
              router.push(`/chat/${chatId}`); return
            }
          }
        }
      })
      unsubscribeRef.current = unsubscribe
    } catch (e) { console.error(e); setLoading(false) }
  }, [userId, loading, router, selectedMode, selectedTags, isShadowbanned])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag))
    else if (selectedTags.length < 3) setSelectedTags([...selectedTags, tag])
  }

  const isAlone = onlineCount <= 1

  // Compact Mode Selection
  if (step === 'mode') {
    return (
      <div style={{ width: '100%', maxWidth: '320px' }}>
        {/* Online indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '6px 14px', borderRadius: '20px',
            backgroundColor: 'rgba(18, 18, 26, 0.8)', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)' }} />
            <Users size={12} style={{ color: '#71717a' }} />
            <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{onlineCount > 0 ? onlineCount : '—'} online</span>
          </div>
        </div>

        {/* Mode cards - horizontal on larger screens, compact */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {MODES.map((mode) => {
            const sel = selectedMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                style={{ 
                  flex: 1, padding: '12px 8px', borderRadius: '10px', 
                  border: sel ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.08)', 
                  backgroundColor: sel ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{mode.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: sel ? '#fff' : '#a1a1aa' }}>{mode.title}</div>
              </button>
            )
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={() => setStep('tags')}
          style={{ 
            width: '100%', padding: '12px', borderRadius: '10px', 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: '#fff', fontWeight: 600, fontSize: '14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)'
          }}
        >
          Continue <ChevronRight size={16} />
        </button>

        {isAlone && <p style={{ color: '#52525b', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>You&apos;re first here. Share the link!</p>}
      </div>
    )
  }

  // Compact Tags Selection
  if (step === 'tags') {
    return (
      <div style={{ width: '100%', maxWidth: '320px' }}>
        <button onClick={() => setStep('mode')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '12px' }}>
          <ArrowLeft size={14} /> Back
        </button>

        <p style={{ fontSize: '13px', color: '#71717a', textAlign: 'center', marginBottom: '10px' }}>Pick up to 3 interests (optional)</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '14px' }}>
          {TAGS.map(tag => {
            const sel = selectedTags.includes(tag)
            const dis = selectedTags.length >= 3 && !sel
            return (
              <button
                key={tag} onClick={() => toggleTag(tag)} disabled={dis}
                style={{
                  padding: '6px 12px', borderRadius: '16px', fontSize: '12px',
                  border: sel ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: sel ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: sel ? '#a5b4fc' : dis ? '#3f3f46' : '#71717a',
                  cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.5 : 1
                }}
              >{tag}</button>
            )
          })}
        </div>

        {/* Verified filter toggle */}
        <div style={{ 
          padding: '10px 14px', 
          backgroundColor: 'rgba(18, 18, 26, 0.8)', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: isVerified ? '#10b981' : '#71717a' }} />
            <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Verified MUJ only</span>
          </div>
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            style={{
              width: '40px', height: '22px', borderRadius: '11px',
              backgroundColor: verifiedOnly ? '#6366f1' : 'rgba(255,255,255,0.1)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              backgroundColor: '#fff',
              position: 'absolute', top: '2px',
              left: verifiedOnly ? '20px' : '2px',
              transition: 'all 0.2s'
            }} />
          </button>
        </div>
        
        {!isVerified && (
          <Link href="/verify" style={{
            display: 'block',
            textAlign: 'center',
            fontSize: '12px',
            color: '#818cf8',
            marginBottom: '14px',
            textDecoration: 'none'
          }}>
            <BadgeCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Verify your MUJ email to unlock this filter
          </Link>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setStep('matching'); handleMatch() }} style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa', fontSize: '13px', cursor: 'pointer' }}>Skip</button>
          <button onClick={() => { setStep('matching'); handleMatch() }} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)' }}>Find Match</button>
        </div>
      </div>
    )
  }

  // Matching view
  return (
    <div style={{ width: '100%', maxWidth: '300px', textAlign: 'center' }}>
      {status === 'searching' && (
        <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>
          <ArrowLeft size={14} /> Cancel
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(18, 18, 26, 0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }} />
          <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{onlineCount} online</span>
        </div>
      </div>

      {status === 'searching' && (
        <div style={{ padding: '12px', backgroundColor: 'rgba(18, 18, 26, 0.8)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: '#52525b', marginBottom: '4px' }}>Topic idea:</p>
          <p style={{ fontSize: '13px', color: '#a1a1aa', fontStyle: 'italic' }}>&quot;{icebreaker}&quot;</p>
        </div>
      )}

      <button 
        onClick={() => status === 'searching' ? handleStop() : handleMatch()}
        disabled={loading || status === 'matched' || !userId}
        style={{ 
          width: '100%', padding: '14px 24px', borderRadius: '12px', 
          background: status === 'searching' ? 'rgba(18, 18, 26, 0.8)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: status === 'searching' ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
          color: '#fff', fontWeight: 600, fontSize: '15px',
          cursor: (loading || status === 'matched' || !userId) ? 'not-allowed' : 'pointer',
          opacity: (loading || status === 'matched' || !userId) ? 0.5 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: status === 'searching' ? 'none' : '0 4px 20px rgba(99, 102, 241, 0.3)'
        }}
      >
        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          : status === 'searching' ? <><Square size={14} style={{ fill: '#ef4444', color: '#ef4444' }} /> Stop</>
          : status === 'matched' ? <span style={{ color: '#10b981' }}>Matched!</span>
          : <><Zap size={18} /> Find a MUJian</>}
      </button>
      
      {status === 'searching' && (
        <p style={{ color: '#52525b', fontSize: '12px', marginTop: '10px' }}>Searching... {waitTime}s</p>
      )}
    </div>
  )
}

// Wrapper with Suspense for Next.js SSR compatibility
export function MatchButton() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
      </div>
    }>
      <MatchButtonInner />
    </Suspense>
  )
}
