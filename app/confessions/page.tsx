'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { database, auth } from '@/lib/firebase'
import { ref, push, set, onValue, increment } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { Heart, X, MessageCircle, ArrowLeft, Send, ChevronDown, ChevronUp, Loader2, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { useConnection } from '@/components/connection-provider'
import { moderateMessage } from '@/lib/moderation'

const MAX_CHARS = 280
const MAX_POSTS_PER_DAY = 3

interface Comment {
  id: string
  text: string
  timestamp: number
}

interface Confession {
  id: string
  text: string
  timestamp: number
  hearts: number
  comments?: Record<string, Comment>
  expiresAt?: number
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

// ── Swipe Card Component ──────────────────────────────────────────────────────────────────────────
function SwipeCard({
  confession,
  isTop,
  onLike,
  onSkip,
  hearted,
}: {
  confession: Confession
  isTop: boolean
  onLike: () => void
  onSkip: () => void
  hearted: boolean
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [dragDelta, setDragDelta] = useState(0)
  const { userId } = useConnection()

  // Real-time comments
  useEffect(() => {
    if (!confession.id) return
    const commentsRef = ref(database, `confessions/${confession.id}/comments`)
    const unsub = onValue(commentsRef, (snap) => {
      if (!snap.exists()) { setComments([]); return }
      const list = Object.entries(snap.val()).map(([id, v]) => ({
        id,
        ...(v as Omit<Comment, 'id'>),
      })).sort((a, b) => a.timestamp - b.timestamp)
      setComments(list)
    })
    return () => unsub()
  }, [confession.id])

  const handleCommentSubmit = async () => {
    const user = auth.currentUser
    if (!commentText.trim() || !user) return
    const result = moderateMessage(commentText)
    if (!result.isClean) return
    const text = commentText.trim()
    setCommentText('')
    try {
      await push(ref(database, `confessions/${confession.id}/comments`), {
        text,
        timestamp: Date.now(),
      })
    } catch (e) { console.error('Comment failed:', e) }
  }

  // — Touch / Pointer drag —————————————————————————————
  const onPointerDown = (e: React.PointerEvent) => {
    if (!isTop || showComments) return
    isDragging.current = true
    startX.current = e.clientX
    currentX.current = e.clientX
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    currentX.current = e.clientX
    const delta = currentX.current - startX.current
    setDragDelta(delta)
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const delta = currentX.current - startX.current
    if (delta > 80) { onLike(); setDragDelta(0) }
    else if (delta < -80) { onSkip(); setDragDelta(0) }
    else setDragDelta(0)
  }

  const rotation = dragDelta / 15
  const opacity = Math.max(0.6, 1 - Math.abs(dragDelta) / 400)
  const likeOpacity = Math.min(1, dragDelta / 80)
  const skipOpacity = Math.min(1, -dragDelta / 80)

  const commentCount = comments.length

  if (!isTop) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(26,26,37,0.5)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.06)',
        transform: 'scale(0.95) translateY(12px)',
        zIndex: 1,
      }} />
    )
  }

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute', inset: 0, zIndex: 2,
        touchAction: 'none', cursor: isDragging.current ? 'grabbing' : 'grab',
        transform: `translateX(${dragDelta}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Card body */}
      <div style={{
        flex: 1, backgroundColor: 'rgba(22,22,32,0.98)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Like / Skip overlays */}
        {likeOpacity > 0.05 && (
          <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10, border: '3px solid #10b981', borderRadius: '10px', padding: '6px 14px', opacity: likeOpacity }}>
            <span style={{ color: '#10b981', fontWeight: 800, fontSize: '22px', letterSpacing: '2px' }}>LIKE</span>
          </div>
        )}
        {skipOpacity > 0.05 && (
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10, border: '3px solid #ef4444', borderRadius: '10px', padding: '6px 14px', opacity: skipOpacity }}>
            <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '22px', letterSpacing: '2px' }}>SKIP</span>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{
            fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 500, lineHeight: 1.55,
            color: '#e4e4e7', margin: 0, textAlign: 'center',
            letterSpacing: '-0.01em',
          }}>
            &ldquo;{confession.text}&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', color: '#52525b' }}>{timeAgo(confession.timestamp)}</span>
            {confession.expiresAt && (() => {
              const msLeft = confession.expiresAt - Date.now()
              const hLeft = Math.max(0, Math.floor(msLeft / 3600000))
              const soon = hLeft < 2
              return (
                <span style={{
                  fontSize: '10px', color: soon ? '#f59e0b' : '#3f3f52',
                  animation: soon ? 'pulse 2s ease-in-out infinite' : 'none',
                }}>
                  ⏱ {hLeft > 0 ? `${hLeft}h left` : 'Expiring soon'}
                </span>
              )
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: hearted ? '#ef4444' : '#71717a' }}>
              <Heart size={14} style={{ fill: hearted ? '#ef4444' : 'none', color: hearted ? '#ef4444' : '#71717a' }} />
              {confession.hearts || 0}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments) }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: showComments ? '#f59e0b' : '#71717a', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <MessageCircle size={14} />
              {commentCount > 0 ? commentCount : ''}
              {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            backgroundColor: 'rgba(15,15,22,0.9)',
            maxHeight: '220px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#52525b', fontSize: '12px', padding: '12px' }}>No comments yet. Be the first!</p>
              ) : comments.map(c => (
                <div key={c.id} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 12px' }}>
                  <p style={{ color: '#d4d4d8', fontSize: '13px', margin: '0 0 2px' }}>{c.text}</p>
                  <span style={{ fontSize: '10px', color: '#52525b' }}>{timeAgo(c.timestamp)}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
              <input
                type="text" value={commentText}
                onChange={e => setCommentText(e.target.value.slice(0, 200))}
                onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                placeholder="Add a comment..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '8px 14px', color: '#e4e4e7', fontSize: '13px', outline: 'none' }}
              />
              <button onClick={handleCommentSubmit} disabled={!commentText.trim() || !userId} style={{ padding: '8px 12px', borderRadius: '20px', background: commentText.trim() ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.08)', border: 'none', cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}>
                <Send size={14} color={commentText.trim() ? '#000' : '#52525b'} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────────────────────────
export default function ConfessionsPage() {
  const { userId } = useConnection()
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [heartedIds, setHeartedIds] = useState<Set<string>>(new Set())
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [postLimitReached, setPostLimitReached] = useState(false)
  const [swipeHint, setSwipeHint] = useState(true)
  const [authReady, setAuthReady] = useState(!!auth.currentUser)
  const [postError, setPostError] = useState('')

  // Wait for Firebase anonymous auth to complete
  useEffect(() => {
    if (auth.currentUser) { setAuthReady(true); return }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAuthReady(true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('mujanon_hearts')
    if (saved) setHeartedIds(new Set(JSON.parse(saved)))
    const today = new Date().toDateString()
    const raw = localStorage.getItem('mujanon_post_count')
    const data = raw ? JSON.parse(raw) : {}
    setPostLimitReached((data[today] || 0) >= MAX_POSTS_PER_DAY)
    setTimeout(() => setSwipeHint(false), 3000)
  }, [])

  useEffect(() => {
    const confessRef = ref(database, 'confessions')
    const unsub = onValue(confessRef, (snapshot) => {
      if (!snapshot.exists()) { setConfessions([]); return }
      const now = Date.now()
      const list: Confession[] = Object.entries(snapshot.val())
        .map(([id, v]) => ({ id, ...(v as Omit<Confession, 'id'>) }))
        .filter(c => !c.expiresAt || c.expiresAt > now)
        .sort((a, b) => b.timestamp - a.timestamp)  // newest first
      setConfessions(list)
    })
    return () => unsub()
  }, [])

  const handleLike = useCallback(async () => {
    const c = confessions[currentIndex]
    if (!c) return
    const newSet = new Set(heartedIds).add(c.id)
    setHeartedIds(newSet)
    localStorage.setItem('mujanon_hearts', JSON.stringify([...newSet]))
    try {
      await set(ref(database, `confessions/${c.id}/hearts`), increment(1))
    } catch { /* ignore — hearts are best-effort */ }
    setCurrentIndex(i => i + 1)
  }, [confessions, currentIndex, heartedIds])

  const handleSkip = useCallback(() => {
    setCurrentIndex(i => i + 1)
  }, [])

  const handlePost = async () => {
    if (!text.trim() || posting) return
    setPostError('')
    const user = auth.currentUser
    if (!user) {
      setPostError('Still connecting... please try again in a moment.')
      return
    }
    setPosting(true)
    try {
      const today = new Date().toDateString()
      const raw = localStorage.getItem('mujanon_post_count')
      const data = raw ? JSON.parse(raw) : {}
      if ((data[today] || 0) >= MAX_POSTS_PER_DAY) { setPostLimitReached(true); return }
      const result = moderateMessage(text)
      if (!result.isClean) {
        setPostError('Your confession was flagged. Please keep it respectful.')
        return
      }
      await push(ref(database, 'confessions'), {
        text: text.trim(),
        timestamp: Date.now(),
        hearts: 0,
        expiresAt: Date.now() + 48 * 60 * 60 * 1000,
      })
      data[today] = (data[today] || 0) + 1
      localStorage.setItem('mujanon_post_count', JSON.stringify(data))
      if (data[today] >= MAX_POSTS_PER_DAY) setPostLimitReached(true)
      setText('')
      setShowCompose(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setPostError(msg.includes('PERMISSION_DENIED') ? 'Auth not ready yet — wait 2s and retry.' : 'Failed to post. Try again.')
    } finally {
      setPosting(false)
    }
  }

  const current = confessions[currentIndex]
  const next = confessions[currentIndex + 1]
  const done = currentIndex >= confessions.length

  return (
    <div style={{
      height: '100dvh', backgroundColor: '#0a0a12',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{
        flexShrink: 0, padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ color: '#52525b', display: 'flex', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>🕯️ Confession Wall</h1>
            <p style={{ fontSize: '11px', color: '#52525b', margin: 0 }}>Anonymous · 48h · Swipe to explore</p>
          </div>
        </div>
        {/* Count badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {confessions.length > 0 && (
            <div style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#f59e0b',
            }}>
              {confessions.length} confession{confessions.length !== 1 ? 's' : ''}
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Swipe area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '20px' }}>
        {confessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#52525b' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕯️</div>
            <p style={{ fontSize: '16px', color: '#71717a' }}>No confessions yet.</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Be the first to share something anonymously.</p>
          </div>
        ) : done ? (
          <div style={{ textAlign: 'center', color: '#52525b' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontSize: '16px', color: '#71717a' }}>You&apos;ve seen everything!</p>
            <button onClick={() => setCurrentIndex(0)} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '20px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', border: 'none', color: '#000', fontWeight: 600, cursor: 'pointer' }}>
              Start over
            </button>
          </div>
        ) : (
          <>
            {/* Card stack */}
            <div style={{ width: '100%', maxWidth: '400px', height: '340px', position: 'relative' }}>
              {next && <SwipeCard confession={next} isTop={false} onLike={() => {}} onSkip={() => {}} hearted={false} />}
              {current && (
                <SwipeCard
                  key={current.id}
                  confession={current}
                  isTop
                  onLike={handleLike}
                  onSkip={handleSkip}
                  hearted={heartedIds.has(current.id)}
                />
              )}
            </div>

            {/* Swipe hint */}
            {swipeHint && (
              <div style={{ textAlign: 'center', color: '#3f3f52', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>← Skip</span>
                <span style={{ opacity: 0.4 }}>swipe</span>
                <span>Like →</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <button onClick={handleSkip} style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <X size={24} color="#ef4444" />
              </button>
              <button onClick={handleLike} style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
                transition: 'all 0.2s',
              }}>
                <Heart size={28} color="#000" style={{ fill: '#000' }} />
              </button>
              <button onClick={handleSkip} style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: 'rgba(113,113,122,0.1)', border: '2px solid rgba(113,113,122,0.2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowLeft size={20} color="#71717a" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>

            {/* Progress */}
            <p style={{ fontSize: '12px', color: '#3f3f52' }}>
              {Math.min(currentIndex + 1, confessions.length)} / {confessions.length}
            </p>
          </>
        )}
      </div>

      {/* FAB — Confess button bottom-right */}
      {!showCompose && (
        <button
          onClick={() => setShowCompose(true)}
          disabled={postLimitReached}
          title={postLimitReached ? '3 confessions posted today' : 'Write a confession'}
          style={{
            position: 'fixed', bottom: '28px', right: '20px', zIndex: 50,
            width: '56px', height: '56px', borderRadius: '50%', border: 'none',
            background: postLimitReached
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            boxShadow: postLimitReached ? 'none' : '0 8px 24px rgba(245,158,11,0.45)',
            cursor: postLimitReached ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <Edit3 size={22} color={postLimitReached ? '#52525b' : '#000'} />
        </button>
      )}
      {showCompose && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowCompose(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '500px',
              backgroundColor: '#16161f', borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,0.1)', padding: '24px',
              paddingBottom: '32px',
            }}
          >
            <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2px', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', marginBottom: '16px', textAlign: 'center' }}>
              🕯️ Confess Anonymously
            </h3>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="What's on your mind... no names, no judgment"
              autoFocus
              style={{
                width: '100%', minHeight: '100px', backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                padding: '14px', color: '#e4e4e7', fontSize: '15px', lineHeight: 1.5,
                resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {postError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{postError}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: text.length > 250 ? '#ef4444' : '#52525b' }}>
                {text.length}/{MAX_CHARS}
              </span>
              <button
                onClick={handlePost}
                disabled={!text.trim() || posting || !authReady}
                style={{
                  padding: '10px 24px', borderRadius: '20px', fontWeight: 600, fontSize: '14px',
                  background: text.trim() && authReady ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'rgba(255,255,255,0.08)',
                  border: 'none', color: text.trim() && authReady ? '#000' : '#52525b',
                  cursor: text.trim() && authReady ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {!authReady ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</> : posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
