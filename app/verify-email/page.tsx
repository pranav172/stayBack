'use client'

/**
 * /verify-email — Firebase magic link callback page.
 *
 * Firebase redirects here after the user clicks the verification link.
 * We call completeMagicLinkSignIn() which:
 *  1. Validates the PKCE token embedded in the URL
 *  2. Signs the user in (or upgrades their anonymous session)
 *  3. Writes verifiedUsers/{uid} to Firebase DB
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeMagicLinkSignIn } from '@/lib/email-verification'
import { track, EVENTS } from '@/lib/analytics'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

type State = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [state, setState] = useState<State>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState('')

  useEffect(() => {
    // Run once on mount — the full verification URL is in window.location.href
    async function verify() {
      const result = await completeMagicLinkSignIn(window.location.href)

      if (result.success) {
        track(EVENTS.VERIFICATION_COMPLETED)
        setVerifiedEmail(result.email || '')
        setState('success')
        // Redirect to home after a short celebration delay
        setTimeout(() => router.push('/home'), 2200)
      } else {
        track(EVENTS.VERIFICATION_FAILED, { error: result.error })
        setErrorMsg(result.error || 'Verification failed.')
        setState('error')
      }
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '360px', width: '100%', textAlign: 'center' }}>

        {/* ── Verifying ───────────────────────────────────────────────── */}
        {state === 'verifying' && (
          <>
            <Loader2
              size={48}
              color="#f59e0b"
              style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }}
            />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Verifying your email…
            </h1>
            <p style={{ color: '#71717a', fontSize: '14px' }}>Just a moment</p>
          </>
        )}

        {/* ── Success ─────────────────────────────────────────────────── */}
        {state === 'success' && (
          <>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={44} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Verified! 🎉
            </h1>
            <p style={{ color: '#71717a', marginBottom: '6px' }}>
              <strong style={{ color: '#a1a1aa' }}>{verifiedEmail}</strong> is now verified.
            </p>
            <p style={{ color: '#52525b', fontSize: '13px', marginBottom: '28px' }}>
              Redirecting you to mujAnon…
            </p>
            <Link href="/home" style={{
              display: 'inline-block',
              padding: '12px 28px',
              backgroundColor: '#f59e0b',
              color: '#000',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
            }}>
              Start Chatting →
            </Link>
          </>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {state === 'error' && (
          <>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <XCircle size={44} color="#ef4444" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Verification Failed
            </h1>
            <p style={{ color: '#71717a', marginBottom: '24px', fontSize: '14px' }}>
              {errorMsg}
            </p>
            <Link href="/verify" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: '#000',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 700,
            }}>
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
