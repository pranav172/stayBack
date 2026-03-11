'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import {
  isValidMUJEmail,
  sendMagicLink,
  verifyWithGoogle,
  checkVerificationStatus,
} from '@/lib/email-verification'
import { track, EVENTS } from '@/lib/analytics'
import { ArrowLeft, Loader2, ShieldCheck, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Step = 'choose' | 'link-sent' | 'success' | 'already-verified'

export default function VerifyPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState<Step>('choose')
  const [email, setEmail] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [loading, setLoading] = useState<'google' | 'link' | null>(null)
  const [error, setError] = useState('')
  const [showLinkFallback, setShowLinkFallback] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/home'); return }
      setUser(u)
      const status = await checkVerificationStatus(u.uid)
      if (status.isVerified) {
        setVerifiedEmail(status.email || '')
        setStep('already-verified')
      }
    })
    return () => unsub()
  }, [router])

  // ── Google Sign-In (primary) ─────────────────────────────────────────────
  const handleGoogleVerify = async () => {
    if (!user) return
    setError('')
    setLoading('google')
    track(EVENTS.VERIFICATION_STARTED, { method: 'google' })
    try {
      const result = await verifyWithGoogle()
      if (result.success) {
        track(EVENTS.VERIFICATION_COMPLETED)
        setVerifiedEmail(result.email || '')
        setStep('success')
      } else if (result.error) {
        setError(result.error)
      }
    } finally {
      setLoading(null)
    }
  }

  // ── Magic link (fallback) ────────────────────────────────────────────────
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!isValidMUJEmail(trimmed)) {
      setError('Please enter a valid MUJ email (@muj.manipal.edu)')
      return
    }
    setLoading('link')
    track(EVENTS.VERIFICATION_STARTED, { method: 'magic-link' })
    try {
      const result = await sendMagicLink(trimmed)
      if (result.success) {
        setStep('link-sent')
      } else {
        setError(result.error || 'Failed to send link.')
      }
    } finally {
      setLoading(null)
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '24px' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Link href="/" style={{ color: '#f59e0b', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={16} /> Back to mujAnon
        </Link>

        {/* ── Already verified ─────────────────────────────────────── */}
        {step === 'already-verified' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <ShieldCheck size={40} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Already Verified</h1>
            <p style={{ color: '#71717a', marginBottom: '24px' }}>
              Your email <strong style={{ color: '#fff' }}>{verifiedEmail}</strong> is verified.
            </p>
            <Link href="/home" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#f59e0b', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
              Back to Chat
            </Link>
          </div>
        )}

        {/* ── Choose method ─────────────────────────────────────────── */}
        {step === 'choose' && (
          <div style={{ marginTop: '48px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                Verify Your MUJ Email
              </h1>
              <p style={{ color: '#71717a', fontSize: '14px' }}>
                Unlocks the &quot;Verified Only&quot; matching filter
              </p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Primary: Google Sign-In */}
            <button
              onClick={handleGoogleVerify}
              disabled={loading !== null}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                backgroundColor: '#fff', color: '#1a1a2e',
                fontSize: '15px', fontWeight: 600, border: 'none',
                cursor: loading !== null ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                opacity: loading !== null ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading === 'google' ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.9 29.5 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.9 29.5 5 24 5 16.3 5 9.6 9 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 45c5.2 0 9.9-1.8 13.5-4.8l-6.2-5.2C29.4 36.6 26.8 37 24 37c-5.2 0-9.6-3.3-11.3-8H6.1C9.4 38.8 16.2 45 24 45z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.2 5.2C40.9 35.9 44 31 44 25c0-1.3-.1-2.6-.4-3.9z"/>
                </svg>
              )}
              {loading === 'google' ? 'Verifying...' : 'Continue with MUJ Google Account'}
            </button>

            <p style={{ textAlign: 'center', color: '#52525b', fontSize: '12px', marginTop: '10px', marginBottom: '20px' }}>
              Sign in with your <strong style={{ color: '#a1a1aa' }}>@muj.manipal.edu</strong> Google account
            </p>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: '#52525b', fontSize: '12px' }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Fallback: Magic Link */}
            {!showLinkFallback ? (
              <button
                onClick={() => setShowLinkFallback(true)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: '14px', cursor: 'pointer' }}
              >
                ✉️ Send magic link to my MUJ email instead
              </button>
            ) : (
              <form onSubmit={handleSendLink}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@muj.manipal.edu"
                  autoComplete="email"
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: '8px',
                    backgroundColor: '#12121a', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '16px', outline: 'none',
                    marginBottom: '12px', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading !== null || !email.trim()}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px',
                    backgroundColor: loading || !email.trim() ? '#3f3f46' : '#f59e0b',
                    color: '#fff', fontWeight: 600, border: 'none',
                    cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading === 'link' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading === 'link' ? 'Sending...' : '✉️ Send Magic Link'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Link sent ──────────────────────────────────────────────── */}
        {step === 'link-sent' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📬</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Check your inbox!</h1>
            <p style={{ color: '#71717a', marginBottom: '6px' }}>Link sent to <strong style={{ color: '#fff' }}>{email}</strong></p>
            <p style={{ color: '#52525b', fontSize: '13px', marginBottom: '24px' }}>Tap the link to verify — expires in 1 hour. Check spam too.</p>
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>💡 Open the link on this same device.</p>
            </div>
            <button onClick={() => { setStep('choose'); setShowLinkFallback(true); setError('') }} style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
              Use a different email
            </button>
          </div>
        )}

        {/* ── Success ────────────────────────────────────────────────── */}
        {step === 'success' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={44} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Verified! 🎉</h1>
            <p style={{ color: '#71717a', marginBottom: '6px' }}>
              <strong style={{ color: '#a1a1aa' }}>{verifiedEmail}</strong> confirmed
            </p>
            <p style={{ color: '#52525b', fontSize: '13px', marginBottom: '28px' }}>You can now use the &quot;Verified Only&quot; filter.</p>
            <Link href="/home" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: '#f59e0b', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
              Start Chatting →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
