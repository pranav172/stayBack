'use client'

import { useEffect, useState } from 'react'
import { isMockConfig } from '@/lib/firebase'
import { AlertTriangle } from 'lucide-react'

export function DebugBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show if we're running with the mock config (missing env vars)
    if (isMockConfig) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '90%',
      fontSize: '14px'
    }}>
      <AlertTriangle size={20} />
      <div>
        <strong>Setup Required:</strong> Firebase environment variables are missing. App is using a mock database and <b>will not connect</b> to real users.
        <br/>
        <span style={{ fontSize: '12px', opacity: 0.9 }}>Add variables to Vercel/Netlify dashboard and redeploy.</span>
      </div>
    </div>
  )
}
