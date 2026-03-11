'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { isValidMUJEmail, sendMagicLink, checkVerificationStatus } from '@/lib/email-verification'
import { track, EVENTS } from '@/lib/analytics'
import { Mail, CheckCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

type Step = 'email' | 'sent' | 'already-verified'

export default function VerifyPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/home')
        return
      }
      setUser(currentUser)
      const status = await checkVerificationStatus(currentUser.uid)
      if (status.isVerified) {
        setVerifiedEmail(status.email || '')
        setStep('already-verified')
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError('')
    const trimmed = email.trim().toLowerCase()

    if (!isValidMUJEmail(trimmed)) {
      setError('Please enter a valid MUJ email (@muj.manipal.edu)')
      return
    }

    setLoading(true)
    track(EVENTS.VERIFICATION_STARTED, { email: trimmed })

    try {
      const result = await sendMagicLink(trimmed)
      if (!result.success) {
        setError(result.error || 'Failed to send verification link.')
        return
      }
      setStep('sent')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={32} color="#f59e0b" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Link href="/" style={{
          color: '#f59e0b',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <ArrowLeft size={16} />
          Back to mujAnon
        </Link>

        {/* ── Already verified ────────────────────────────────────────── */}
        {step === 'already-verified' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <ShieldCheck size={40} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Already Verified
            </h1>
            <p style={{ color: '#71717a', marginBottom: '24px' }}>
              Your email <strong style={{ color: '#fff' }}>{verifiedEmail}</strong> is verified.
            </p>
            <Link href="/home" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              Back to Chat
            </Link>
          </div>
        )}

        {/* ── Enter email ─────────────────────────────────────────────── */}
        {step === 'email' && (
          <div style={{ marginTop: '48px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Mail size={32} color="#f59e0b" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center' }}>
              Verify Your MUJ Email
            </h1>
            <p style={{ color: '#71717a', marginBottom: '8px', textAlign: 'center' }}>
              We&apos;ll send a magic link — just tap it to verify. No code to type.
            </p>
            <p style={{ color: '#52525b', fontSize: '12px', marginBottom: '28px', textAlign: 'center' }}>
              Unlocks the &quot;Verified Only&quot; matching filter
            </p>

            <form onSubmit={handleSendLink}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@muj.manipal.edu"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#12121a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
              />

              {error && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: loading || !email.trim() ? '#3f3f46' : '#f59e0b',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                {loading ? 'Sending...' : '✉️ Send Magic Link'}
              </button>
            </form>
          </div>
        )}

        {/* ── Link sent ───────────────────────────────────────────────── */}
        {step === 'sent' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '40px',
            }}>
              📬
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Check your inbox!
            </h1>
            <p style={{ color: '#71717a', marginBottom: '8px' }}>
              We sent a link to <strong style={{ color: '#fff' }}>{email}</strong>
            </p>
            <p style={{ color: '#52525b', fontSize: '13px', marginBottom: '28px' }}>
              Tap the link to verify — it expires in 1 hour. Check your spam folder too.
            </p>

            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '8px',
              marginBottom: '24px',
            }}>
              <p style={{ color: '#f59e0b', fontSize: '12px', margin: 0 }}>
                💡 Open the link on this same device for the best experience.
              </p>
            </div>

            <button
              onClick={() => { setStep('email'); setError('') }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </div>
        )}

        {/* ── Success (redirect from verify-email page sets this rarely) ── */}
        {step === ('success' as Step) && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Verified! 🎉
            </h1>
            <p style={{ color: '#71717a', marginBottom: '24px' }}>
              You can now use the &quot;Verified Only&quot; filter when matching.
            </p>
            <Link href="/home" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              Start Chatting
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
