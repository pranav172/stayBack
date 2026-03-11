'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { database } from '@/lib/firebase'
import { ref, push, set, get, remove, onValue, onDisconnect, serverTimestamp } from 'firebase/database'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Zap, Square, Users, ShieldCheck, BadgeCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { checkShadowban } from '@/lib/shadowban'
import { checkVerificationStatus } from '@/lib/email-verification'
import { track, EVENTS, initAnalytics, identifyUser } from '@/lib/analytics'
import { useConnection } from '@/components/connection-provider'
import { playMatchSound, unlockAudio } from '@/lib/sounds'
import Link from 'next/link'

const ICEBREAKERS = [
  "What's the best chai spot on campus?",
  "Are 8am classes a scam?",
  "Best late-night study spot?",
  "What's your go-to canteen order?",
  "Hostel or day scholar life?",
  "What course do you regret not taking?",
  "Best thing about MUJ?",
]

export type ChatMode = 'platonics' | 'study' | 'random'
export type Mood = 'happy' | 'low' | 'venting' | 'curious' | null

const MODES: { id: ChatMode; emoji: string; label: string }[] = [
  { id: 'random',    emoji: '🎲', label: 'Random'   },
  { id: 'platonics', emoji: '🤝', label: 'Platonics' },
  { id: 'study',     emoji: '📚', label: 'Study'     },
]

const TAGS = [
  'Engineering', 'Law', 'Business', 'Gaming', 'Music',
  'Anime', 'Sports', 'Tech', 'Movies', 'Memes', 'Art', 'Fitness',
]

// Share nudge shown when user is alone in queue
function ShareNudge() {
  const [copied, setCopied] = useState(false)
  const handleShare = async () => {
    const url = window.location.origin
    const text = 'Anonymous chat for MUJians — no names, real vibes 🔥'
    if (navigator.share) {
      try { await navigator.share({ title: 'mujAnon', text, url }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }
  return (
    <div style={{
      marginTop: '12px', padding: '12px 16px', borderRadius: '12px',
      background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.06))',
      border: '1px solid rgba(245,158,11,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    }}>
      <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
        👋 You&apos;re the first one here — invite a friend!
      </p>
      <button
        onClick={handleShare}
        style={{
          padding: '6px 14px', borderRadius: '16px', fontSize: '12px', fontWeight: 600,
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          border: 'none', color: '#000', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {copied ? '✅ Copied!' : '📤 Share'}
      </button>
    </div>
  )
}

function MatchButtonInner() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, onlineCount, isConnected } = useConnection()

  const [selectedMode, setSelectedMode] = useState<ChatMode>('random')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [icebreaker, setIcebreaker] = useState(ICEBREAKERS[0])
  const [waitTime, setWaitTime] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isShadowbanned, setIsShadowbanned] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const queueRef = useRef<string | null>(null)

  const getSessionId = () => {
    if (typeof window === 'undefined') return crypto.randomUUID()
    let sid = sessionStorage.getItem('mujanon_session_id')
    if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('mujanon_session_id', sid) }
    return sid
  }
  const sessionId = useRef<string>(getSessionId())

  useEffect(() => {
    if (status === 'searching') {
      const i1 = setInterval(() => setIcebreaker(ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]), 3000)
      const i2 = setInterval(() => setWaitTime(p => p + 1), 1000)
      return () => { clearInterval(i1); clearInterval(i2) }
    } else {
      setWaitTime(0)
    }
  }, [status])

  useEffect(() => {
    if (!userId) return
    initAnalytics(); identifyUser(userId); track(EVENTS.SESSION_STARTED)
    checkVerificationStatus(userId).then(v => setIsVerified(v.isVerified))
    checkShadowban().then(s => setIsShadowbanned(s.isShadowbanned))
  }, [userId])

  useEffect(() => {
    if (userId && isConnected && searchParams.get('autoMatch') === 'true') {
      setTimeout(() => handleMatch(), 500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isConnected, searchParams])

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current()
      if (queueRef.current) remove(ref(database, `queue/${queueRef.current}`))
    }
  }, [])

  const handleStop = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      if (queueRef.current) { await remove(ref(database, `queue/${queueRef.current}`)); queueRef.current = null }
      if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null }
      setStatus('idle')
    } finally { setLoading(false) }
  }, [userId])

  const handleMatch = useCallback(async () => {
    if (!userId || loading || !isConnected) return
    unlockAudio()
    setLoading(true)

    if (isShadowbanned) { setStatus('searching'); setLoading(false); return }

    try {
      const userChatsSnapshot = await get(ref(database, `userChats/${userId}`))
      if (userChatsSnapshot.exists()) {
        for (const [chatId, chatInfo] of Object.entries(userChatsSnapshot.val() as Record<string, { isActive: boolean; sessionId: string }>)) {
          if (chatInfo.isActive && chatInfo.sessionId === sessionId.current) {
            const chatSnap = await get(ref(database, `chats/${chatId}`))
            if (chatSnap.exists() && chatSnap.val().isActive) {
              setStatus('matched'); setLoading(false); router.push(`/chat/${chatId}`); return
            } else {
              await set(ref(database, `userChats/${userId}/${chatId}/isActive`), false).catch(() => {})
            }
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
          if (verifiedOnly && !e.isVerified) return false
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
            mood1: null, mood2: null,
            createdAt: serverTimestamp(), isActive: true,
          })
          await set(ref(database, `userChats/${matchData.userId}/${chatId}`), { sessionId: matchData.sessionId, isActive: true })
          await set(ref(database, `userChats/${userId}/${chatId}`), { sessionId: sessionId.current, isActive: true })
          await remove(ref(database, `queue/${matchKey}`))
          playMatchSound()
          setStatus('matched'); setLoading(false); router.push(`/chat/${chatId}`); return
        }
      }

      const myQueueRef = push(ref(database, 'queue'))
      queueRef.current = myQueueRef.key
      await set(myQueueRef, {
        userId, sessionId: sessionId.current, connectionId: userId,
        mode: selectedMode, tags: selectedTags, mood: '', isVerified,
        timestamp: serverTimestamp(),
      })
      onDisconnect(myQueueRef).remove()
      setStatus('searching'); setLoading(false)

      const unsubscribe = onValue(ref(database, `userChats/${userId}`), (snapshot) => {
        if (snapshot.exists()) {
          for (const [chatId, chatInfo] of Object.entries(snapshot.val() as Record<string, { isActive: boolean; sessionId: string }>)) {
            if (chatInfo.isActive && chatInfo.sessionId === sessionId.current) {
              playMatchSound(); setStatus('matched')
              if (queueRef.current) { remove(ref(database, `queue/${queueRef.current}`)); queueRef.current = null }
              unsubscribe(); unsubscribeRef.current = null
              router.push(`/chat/${chatId}`); return
            }
          }
        }
      })
      unsubscribeRef.current = unsubscribe
    } catch (e) { console.error(e); setLoading(false) }
  }, [userId, loading, router, selectedMode, selectedTags, isShadowbanned, isConnected, verifiedOnly, isVerified])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag))
    else if (selectedTags.length < 3) setSelectedTags([...selectedTags, tag])
  }

  const isAlone = onlineCount <= 1

  // ── Searching state ──────────────────────────────────────────────────────────
  if (status === 'searching') {
    return (
      <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>💬 Topic idea</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>&quot;{icebreaker}&quot;</p>
        </div>

        <button
          onClick={handleStop}
          disabled={loading}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: '12px',
            background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.35)',
            color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {loading
            ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            : <><Square size={14} style={{ fill: '#ef4444', color: '#ef4444' }} /> Stop searching</>}
        </button>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
          Searching... {waitTime}s
        </p>
      </div>
    )
  }

  // ── Idle / main screen ───────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', maxWidth: '320px' }}>

      {/* Online pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
          <Users size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{onlineCount > 0 ? onlineCount : '—'} online</span>
        </div>
      </div>

      {/* Mode chips — compact row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {MODES.map(m => {
          const sel = selectedMode === m.id
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '10px',
                border: sel ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--border-color)',
                backgroundColor: sel ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                transform: sel ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '2px' }}>{m.emoji}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: sel ? '#fbbf24' : 'var(--text-secondary)' }}>{m.label}</div>
            </button>
          )
        })}
      </div>

      {/* Main CTA */}
      <button
        onClick={handleMatch}
        disabled={loading || status === 'matched' || !userId}
        style={{
          width: '100%', padding: '14px 24px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          border: 'none', color: '#000', fontWeight: 700, fontSize: '15px',
          cursor: loading || !userId ? 'not-allowed' : 'pointer',
          opacity: loading || !userId ? 0.6 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          boxShadow: '0 4px 20px rgba(245,158,11,0.3)', transition: 'all 0.2s',
          marginBottom: '8px',
        }}
      >
        {loading
          ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          : status === 'matched'
          ? <span style={{ color: '#10b981' }}>Matched! 🎉</span>
          : <><Zap size={18} /> Find a MUJian</>}
      </button>

      {/* Preferences toggle */}
      <button
        onClick={() => setShowPrefs(p => !p)}
        style={{
          width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
          background: 'none', color: 'var(--text-muted)', fontSize: '12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          marginBottom: showPrefs ? '10px' : '0',
        }}
      >
        {showPrefs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showPrefs ? 'Hide preferences' : '⚙️ Preferences'}
      </button>

      {/* Collapsible preferences */}
      {showPrefs && (
        <div style={{ animation: 'fade-in 0.2s ease' }}>
          {/* Tags */}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textAlign: 'center' }}>
            Interests (up to 3)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginBottom: '12px' }}>
            {TAGS.map(tag => {
              const sel = selectedTags.includes(tag)
              const dis = selectedTags.length >= 3 && !sel
              return (
                <button
                  key={tag} onClick={() => toggleTag(tag)} disabled={dis}
                  style={{
                    padding: '5px 11px', borderRadius: '14px', fontSize: '11px',
                    border: sel ? '1px solid rgba(245,158,11,0.5)' : '1px solid var(--border-color)',
                    backgroundColor: sel ? 'rgba(245,158,11,0.15)' : 'var(--bg-surface)',
                    color: sel ? '#fbbf24' : dis ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.5 : 1,
                  }}
                >{tag}</button>
              )
            })}
          </div>

          {/* Verified filter */}
          <div style={{
            padding: '10px 14px', backgroundColor: 'var(--bg-surface)',
            borderRadius: '10px', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={15} style={{ color: isVerified ? '#10b981' : '#71717a' }} />
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Verified MUJ only</span>
            </div>
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              style={{
                width: '38px', height: '20px', borderRadius: '10px',
                backgroundColor: verifiedOnly ? '#f59e0b' : 'var(--bg-surface)',
                border: verifiedOnly ? 'none' : '1px solid var(--border-color)',
                cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
                position: 'absolute', top: '2px',
                left: verifiedOnly ? '20px' : '2px', transition: 'all 0.2s',
              }} />
            </button>
          </div>
          {!isVerified && (
            <Link href="/verify" style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#f59e0b', marginTop: '6px', textDecoration: 'none' }}>
              <BadgeCheck size={11} style={{ display: 'inline', marginRight: '3px' }} />
              Verify your MUJ email
            </Link>
          )}
        </div>
      )}

      {/* Share nudge when alone */}
      {isAlone && !showPrefs && <ShareNudge />}
    </div>
  )
}

export function MatchButton() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
      </div>
    }>
      <MatchButtonInner />
    </Suspense>
  )
}
