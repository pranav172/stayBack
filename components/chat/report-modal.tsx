'use client'

import { useState, useEffect } from 'react'
import { X, Flag, AlertTriangle, Loader2 } from 'lucide-react'
import { REPORT_REASONS, ReportReason } from '@/lib/moderation'
import { database } from '@/lib/firebase'
import { ref, push, set, serverTimestamp } from 'firebase/database'
import { getDeviceFingerprint } from '@/lib/fingerprint'

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: number
}

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  chatId: string
  reporterId: string
  reportedUserId: string
  messages: Message[]
}

export default function ReportModal({
  isOpen,
  onClose,
  chatId,
  reporterId,
  reportedUserId,
  messages
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reporterDeviceId, setReporterDeviceId] = useState<string | null>(null)

  // Get device fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then(setReporterDeviceId).catch(console.error)
  }, [])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedReason) return
    setSubmitting(true)

    try {
      const contextMessages = messages.slice(-10).map(m => ({
        senderId: m.senderId,
        text: m.text,
        timestamp: m.timestamp
      }))

      const reportRef = push(ref(database, 'reports'))
      await set(reportRef, {
        reporterId,
        reportedUserId,
        chatId,
        reason: selectedReason,
        additionalInfo: additionalInfo.trim() || null,
        messages: contextMessages,
        timestamp: serverTimestamp(),
        status: 'pending',
        // Include device ID for ban enforcement
        reporterDeviceId: reporterDeviceId || null
      })

      setSubmitted(true)
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setSelectedReason(null)
        setAdditionalInfo('')
      }, 2000)
    } catch (error) {
      console.error('Failed to submit report:', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 50, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '16px' 
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(4px)' 
        }}
      />

      {/* Modal */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '400px', 
        backgroundColor: '#12121a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '16px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
            <Flag size={20} />
            <span style={{ fontWeight: 600 }}>Report User</span>
          </div>
          <button
            onClick={onClose}
            style={{ 
              padding: '8px', 
              borderRadius: '50%', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 16px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Report Submitted</h3>
            <p style={{ color: '#71717a', fontSize: '14px' }}>We&apos;ll review this and take action if needed.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Warning */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                padding: '12px', 
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.2)',
                borderRadius: '8px'
              }}>
                <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '14px', color: 'rgba(234, 179, 8, 0.8)' }}>
                  Reports are reviewed. False reports may result in action against your account.
                </p>
              </div>

              {/* Reasons */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>What happened?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        border: selectedReason === reason.id ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: selectedReason === reason.id ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                        color: selectedReason === reason.id ? '#fff' : '#a1a1aa',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{reason.icon}</span>
                      <span style={{ fontWeight: 500 }}>{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional info */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: 500, color: '#a1a1aa', marginBottom: '8px', display: 'block' }}>Additional details (optional)</label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any other context..."
                  maxLength={500}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none'
                  }}
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#a1a1aa',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: (!selectedReason || submitting) ? 'not-allowed' : 'pointer',
                  opacity: (!selectedReason || submitting) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
