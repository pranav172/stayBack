'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { database, auth } from '@/lib/firebase'
import { ref, push, set, get, onValue, remove } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { ArrowLeft, Users, Send, X, Zap, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { useConnection } from '@/components/connection-provider'
import { moderateMessage, getWarningMessage } from '@/lib/moderation'

const MAX_GROUP_SIZE = 4
const GROUP_DURATION_MS = 30 * 60 * 1000
const LABELS = ['A', 'B', 'C', 'D'] as const
const LABEL_COLORS: Record<string, string> = {
  A: '#f59e0b', B: '#6366f1', C: '#10b981', D: '#ec4899'
}

interface GroupRoom { id: string; memberCount: number; createdAt: number }
interface GroupMessage { id: string; senderId: string; senderLabel: string; text: string; timestamp: number }

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  return `${Math.floor(s / 60)}m ago`
}

export default function GroupsPage() {
  const { userId } = useConnection()
  const [rooms, setRooms] = useState<GroupRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [memberCount, setMemberCount] = useState(0)
  const [myLabel, setMyLabel] = useState<string>('A')
  const [warning, setWarning] = useState('')
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(!!auth.currentUser)
  const [joinError, setJoinError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Wait for Firebase anonymous auth
  useEffect(() => {
    if (auth.currentUser) { setAuthReady(true); return }
    const unsub = onAuthStateChanged(auth, (user) => { if (user) setAuthReady(true) })
    return () => unsub()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // List rooms
  useEffect(() => {
    if (activeRoomId) return
    const unsub = onValue(ref(database, 'groupChats'), (snapshot) => {
      setLoading(false)
      if (!snapshot.exists()) { setRooms([]); return }
      const now = Date.now()
      const list: GroupRoom[] = Object.entries(snapshot.val())
        .filter(([, v]) => {
          const r = v as { isActive?: boolean; createdAt?: number; members?: Record<string, unknown> }
          return r.isActive && r.createdAt && (now - r.createdAt < GROUP_DURATION_MS) &&
            Object.keys(r.members || {}).length < MAX_GROUP_SIZE
        })
        .map(([id, v]) => {
          const r = v as { members?: Record<string, unknown>; createdAt?: number }
          return { id, memberCount: Object.keys(r.members || {}).length, createdAt: r.createdAt || 0 }
        })
        .sort((a, b) => b.memberCount - a.memberCount)
      setRooms(list)
    })
    return () => unsub()
  }, [activeRoomId])

  const joinOrCreateRoom = useCallback(async () => {
    const user = auth.currentUser
    if (!user || joining) return
    setJoining(true)
    try {
      const snap = await get(ref(database, 'groupChats'))
      let roomId: string | null = null
      let label = 'A'
      if (snap.exists()) {
        const now = Date.now()
        for (const [id, v] of Object.entries(snap.val())) {
          const r = v as { isActive?: boolean; createdAt?: number; members?: Record<string, string> }
          const memberKeys = Object.keys(r.members || {})
          if (r.isActive && r.createdAt && (now - r.createdAt < GROUP_DURATION_MS) && memberKeys.length < MAX_GROUP_SIZE) {
            const usedLabels = Object.values(r.members || {})
            const nextLabel = LABELS.find(l => !usedLabels.includes(l)) || 'A'
            label = nextLabel; roomId = id; break
          }
        }
      }
      if (!roomId) {
        const newRoomRef = push(ref(database, 'groupChats'))
        roomId = newRoomRef.key!
        await set(newRoomRef, { isActive: true, createdAt: Date.now(), members: { [user.uid]: 'A' } })
        label = 'A'
      } else {
        await set(ref(database, `groupChats/${roomId}/members/${user.uid}`), label)
      }
      setMyLabel(label)
      setActiveRoomId(roomId)
    } finally { setJoining(false) }
  }, [joining])

  // Listen to active room
  useEffect(() => {
    if (!activeRoomId) return
    const unsubMsgs = onValue(ref(database, `groupMessages/${activeRoomId}`), (snap) => {
      if (!snap.exists()) { setMessages([]); return }
      const list: GroupMessage[] = Object.entries(snap.val())
        .map(([id, v]) => ({ id, ...(v as Omit<GroupMessage, 'id'>) }))
        .sort((a, b) => a.timestamp - b.timestamp)
      setMessages(list)
    })
    const unsubMembers = onValue(ref(database, `groupChats/${activeRoomId}/members`), (snap) => {
      setMemberCount(snap.exists() ? Object.keys(snap.val()).length : 0)
    })
    return () => { unsubMsgs(); unsubMembers() }
  }, [activeRoomId])

  const handleSend = async () => {
    const user = auth.currentUser
    if (!inputText.trim() || !user || !activeRoomId) return
    const result = moderateMessage(inputText)
    if (!result.isClean) {
      setWarning(getWarningMessage(result.reason))
      setTimeout(() => setWarning(''), 3000); return
    }
    const text = inputText.trim()
    setInputText('')
    await push(ref(database, `groupMessages/${activeRoomId}`), {
      senderId: user.uid, senderLabel: `User ${myLabel}`, text, timestamp: Date.now(),
    })
  }

  const handleLeave = async () => {
    const user = auth.currentUser
    if (!activeRoomId || !user) return
    await remove(ref(database, `groupChats/${activeRoomId}/members/${user.uid}`))
    setActiveRoomId(null); setMessages([])
  }

  // ── Active Room Chat ────────────────────────────────────────────────────────────────────────
  if (activeRoomId) {
    return (
      <div style={{ height: '100dvh', backgroundColor: '#0a0a12', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          flexShrink: 0, height: '60px', padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleLeave} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', display: 'flex', padding: '4px' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>👥</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e4e4e7' }}>Group Room</div>
                <div style={{ fontSize: '11px', color: '#52525b' }}>{memberCount}/{MAX_GROUP_SIZE} members · 30 min</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '4px 10px', borderRadius: '16px', backgroundColor: `${LABEL_COLORS[myLabel]}20`, border: `1px solid ${LABEL_COLORS[myLabel]}40`, fontSize: '12px', fontWeight: 600, color: LABEL_COLORS[myLabel] }}>
              You = User {myLabel}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Warning */}
        {warning && (
          <div style={{ flexShrink: 0, padding: '8px 16px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '13px', textAlign: 'center', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
            ⚠️ {warning}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#52525b', textAlign: 'center', gap: '12px', padding: '60px 0' }}>
              <div style={{ fontSize: '48px' }}>👋</div>
              <p style={{ color: '#71717a', fontSize: '15px' }}>Room&apos;s ready! Waiting for others...</p>
              <p style={{ fontSize: '12px' }}>Anyone can join until it&apos;s full.</p>
            </div>
          ) : messages.map(msg => {
            const isMe = msg.senderId === (auth.currentUser?.uid || userId)
            const labelChar = (msg.senderLabel || 'User ?').replace('User ', '')
            const color = LABEL_COLORS[labelChar] || '#71717a'
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <span style={{ fontSize: '11px', color, marginBottom: '4px', fontWeight: 600 }}>{msg.senderLabel}</span>}
                <div style={{
                  maxWidth: '72%', padding: '10px 16px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: isMe ? color : 'rgba(255,255,255,0.07)',
                  color: isMe ? '#000' : '#e4e4e7',
                  fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                  border: isMe ? 'none' : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: isMe ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '10px', color: '#3f3f52', marginTop: '3px' }}>{timeAgo(msg.timestamp)}</span>
              </div>
            )
          })}
          <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, padding: '12px 16px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(12px)' }}>
          <form onSubmit={e => { e.preventDefault(); handleSend() }} style={{ display: 'flex', gap: '10px', maxWidth: '640px', margin: '0 auto', alignItems: 'center' }}>
            <input
              type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="Say something..."
              style={{
                flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
                padding: '12px 20px', fontSize: '14px', color: '#e4e4e7',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={!inputText.trim()} style={{
              width: '46px', height: '46px', borderRadius: '50%', border: 'none', flexShrink: 0,
              background: inputText.trim() ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.08)',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: inputText.trim() ? '0 4px 12px rgba(245,158,11,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>
              <Send size={18} color={inputText.trim() ? '#000' : '#52525b'} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Room Browser ──────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#0a0a12', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(12px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ color: '#52525b', display: 'flex', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>👥 Group Rooms</h1>
            <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>Up to 4 people · 30 min</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div style={{ flex: 1, maxWidth: '520px', width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        {joinError && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>
            ⚠️ {joinError}
          </div>
        )}
        {/* CTA */}
        <button
          onClick={joinOrCreateRoom}
          disabled={joining || !authReady}
          style={{
            width: '100%', padding: '18px', borderRadius: '16px',
            background: authReady ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.08)',
            border: 'none', color: authReady ? '#000' : '#71717a', fontWeight: 700, fontSize: '16px',
            cursor: joining || !authReady ? 'not-allowed' : 'pointer', marginBottom: '28px',
            boxShadow: authReady ? '0 8px 30px rgba(245,158,11,0.3)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            opacity: joining ? 0.7 : 1, transition: 'all 0.2s',
          }}
        >
          {!authReady ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</> : joining ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Joining...</> : <><Zap size={20} />{rooms.length > 0 ? `Join a Room (${rooms.length} open)` : 'Create New Room'}</>}
        </button>

        {/* Label guide */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
          {LABELS.map(l => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '12px', backgroundColor: `${LABEL_COLORS[l]}15`, border: `1px solid ${LABEL_COLORS[l]}30` }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: LABEL_COLORS[l] }} />
              <span style={{ fontSize: '12px', color: LABEL_COLORS[l], fontWeight: 600 }}>User {l}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#52525b' }}>Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#52525b' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🚪</div>
            <p style={{ color: '#71717a', fontSize: '16px' }}>No rooms open right now.</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Tap the button above to start one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rooms.map(r => (
              <div key={r.id} onClick={joinOrCreateRoom} style={{
                backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.08)', padding: '16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👥</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e4e4e7' }}>Anonymous Room</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {Array.from({ length: MAX_GROUP_SIZE }).map((_, i) => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i < r.memberCount ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{MAX_GROUP_SIZE - r.memberCount} spot{MAX_GROUP_SIZE - r.memberCount !== 1 ? 's' : ''} left</div>
                  <div style={{ fontSize: '11px', color: '#52525b', marginTop: '2px' }}>{r.memberCount}/{MAX_GROUP_SIZE} joined</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={{ padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#3f3f52' }}>🔒 Anonymous · 30 min rooms · Auto-expire</p>
      </footer>
    </div>
  )
}
