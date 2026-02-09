'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { 
  isValidMUJEmail, 
  generateOTP, 
  storeOTP, 
  verifyOTP, 
  checkVerificationStatus 
} from '@/lib/email-verification'
import { track, EVENTS } from '@/lib/analytics'
import { Mail, CheckCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

type Step = 'email' | 'otp' | 'success' | 'already-verified'

export default function VerifyPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/home')
        return
      }
      setUser(currentUser)
      
      // Check if already verified
      const status = await checkVerificationStatus(currentUser.uid)
      if (status.isVerified) {
        setStep('already-verified')
        setEmail(status.email || '')
      }
    })
    return () => unsubscribe()
  }, [router])
  
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setError('')
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!isValidMUJEmail(trimmedEmail)) {
      setError('Please enter a valid MUJ email (@muj.manipal.edu)')
      return
    }
    
    setLoading(true)
    track(EVENTS.VERIFICATION_STARTED, { email: trimmedEmail })
    
    try {
      const newOtp = generateOTP()
      await storeOTP(user.uid, trimmedEmail, newOtp)
      setGeneratedOtp(newOtp) // For demo, show OTP (remove in production)
      setStep('otp')
    } catch (err) {
      console.error(err)
      setError('Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setError('')
    setLoading(true)
    
    try {
      const result = await verifyOTP(user.uid, otp.trim())
      
      if (result.success) {
        track(EVENTS.VERIFICATION_COMPLETED)
        setStep('success')
      } else {
        track(EVENTS.VERIFICATION_FAILED, { error: result.error })
        setError(result.error || 'Verification failed')
      }
    } catch (err) {
      console.error(err)
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0f', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Loader2 className="animate-spin" size={32} color="#6366f1" />
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#e4e4e7',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Link href="/home" style={{ 
          color: '#818cf8', 
          textDecoration: 'none', 
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <ArrowLeft size={16} />
          Back to mujAnon
        </Link>
        
        {step === 'already-verified' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <ShieldCheck size={40} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Already Verified
            </h1>
            <p style={{ color: '#71717a', marginBottom: '24px' }}>
              Your email <strong style={{ color: '#fff' }}>{email}</strong> is verified.
            </p>
            <Link href="/home" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#6366f1',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Back to Chat
            </Link>
          </div>
        )}
        
        {step === 'email' && (
          <div style={{ marginTop: '48px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Mail size={32} color="#6366f1" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center' }}>
              Verify Your MUJ Email
            </h1>
            <p style={{ color: '#71717a', marginBottom: '32px', textAlign: 'center' }}>
              Verify to unlock the &quot;Verified Only&quot; matching filter
            </p>
            
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@muj.manipal.edu"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#12121a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  marginBottom: '16px'
                }}
              />
              
              {error && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
              )}
              
              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: loading || !email ? '#3f3f46' : '#6366f1',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          </div>
        )}
        
        {step === 'otp' && (
          <div style={{ marginTop: '48px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', textAlign: 'center' }}>
              Enter Verification Code
            </h1>
            <p style={{ color: '#71717a', marginBottom: '24px', textAlign: 'center' }}>
              We sent a 6-digit code to <strong style={{ color: '#fff' }}>{email}</strong>
            </p>
            
            {/* Demo notice - remove in production */}
            {generatedOtp && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <p style={{ color: '#eab308', fontSize: '12px' }}>
                  🧪 Demo Mode: Your code is <strong>{generatedOtp}</strong>
                </p>
                <p style={{ color: '#71717a', fontSize: '11px', marginTop: '4px' }}>
                  (Email sending not configured yet)
                </p>
              </div>
            )}
            
            <form onSubmit={handleOtpSubmit}>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#12121a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '8px',
                  outline: 'none',
                  marginBottom: '16px'
                }}
              />
              
              {error && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
              )}
              
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: loading || otp.length !== 6 ? '#3f3f46' : '#6366f1',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#71717a',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                Use a different email
              </button>
            </form>
          </div>
        )}
        
        {step === 'success' && (
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <CheckCircle size={40} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Verified! 🎉
            </h1>
            <p style={{ color: '#71717a', marginBottom: '24px' }}>
              You can now use the &quot;Verified Only&quot; filter when matching.
            </p>
            <Link href="/home" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#6366f1',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 500
            }}>
              Start Chatting
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
