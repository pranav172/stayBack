'use client'

import { useState, useEffect } from 'react'
import { checkDeviceBan, formatBanTime, DeviceBanStatus } from '@/lib/fingerprint'
import { ShieldX, Clock } from 'lucide-react'

interface BannedScreenProps {
  banStatus: DeviceBanStatus
}

function BannedScreen({ banStatus }: BannedScreenProps) {
  const [remainingTime, setRemainingTime] = useState(banStatus.remainingMs || 0)

  useEffect(() => {
    if (remainingTime <= 0) return
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        const newValue = prev - 1000
        if (newValue <= 0) {
          // Refresh page when ban expires
          window.location.reload()
          return 0
        }
        return newValue
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingTime])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <ShieldX size={40} style={{ color: '#ef4444' }} />
      </div>

      <h1 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#fff',
        marginBottom: '12px'
      }}>
        Account Suspended
      </h1>

      <p style={{
        color: '#71717a',
        fontSize: '16px',
        maxWidth: '320px',
        marginBottom: '24px',
        lineHeight: 1.6
      }}>
        {banStatus.reason || 'Your access has been temporarily suspended due to violation of community guidelines.'}
      </p>

      {remainingTime > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Clock size={18} style={{ color: '#ef4444' }} />
          <span style={{ color: '#a1a1aa', fontSize: '14px' }}>
            Access restored in: <strong style={{ color: '#fff' }}>{formatBanTime(remainingTime)}</strong>
          </span>
        </div>
      )}

      <p style={{
        color: '#3f3f46',
        fontSize: '12px',
        marginTop: '32px'
      }}>
        If you believe this is a mistake, contact support.
      </p>
    </div>
  )
}

interface DeviceBanCheckProps {
  children: React.ReactNode
}

export default function DeviceBanCheck({ children }: DeviceBanCheckProps) {
  const [banStatus, setBanStatus] = useState<DeviceBanStatus | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const status = await checkDeviceBan()
        setBanStatus(status)
      } catch (error) {
        console.error('Ban check failed:', error)
        setBanStatus({ isBanned: false })
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [])

  // Show loading state briefly
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #6366f1',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  // Show banned screen if device is banned
  if (banStatus?.isBanned) {
    return <BannedScreen banStatus={banStatus} />
  }

  // Device is not banned, render children
  return <>{children}</>
}
