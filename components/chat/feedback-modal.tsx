'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'
import { database } from '@/lib/firebase'
import { ref, push, set, serverTimestamp } from 'firebase/database'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  chatId: string
  userId: string
  onFindNew: () => void
}

type FeedbackType = 'positive' | 'neutral' | 'negative'

const FEEDBACK_OPTIONS = [
  { type: 'positive' as FeedbackType, emoji: '😊', label: 'Great chat!' },
  { type: 'neutral' as FeedbackType, emoji: '😐', label: 'It was okay' },
  { type: 'negative' as FeedbackType, emoji: '😕', label: 'Not great' },
]

export default function FeedbackModal({
  isOpen,
  onClose,
  chatId,
  userId,
  onFindNew
}: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleFeedback = async (type: FeedbackType) => {
    setSubmitting(true)
    try {
      const feedbackRef = push(ref(database, `feedback/${chatId}`))
      await set(feedbackRef, {
        odUserId: userId,
        type,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setSubmitting(false)
      onFindNew()
    }
  }

  const handleSkip = () => {
    onFindNew()
  }

  const handleGoHome = () => {
    onClose()
    router.push('/')
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
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        backdropFilter: 'blur(4px)' 
      }} />

      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
        {/* Glow */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
          borderRadius: '24px',
          filter: 'blur(20px)'
        }} />
        
        <div style={{ 
          position: 'relative', 
          backgroundColor: '#12121a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 16px', 
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              💬
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Chat Ended</h2>
            <p style={{ color: '#71717a', fontSize: '14px' }}>How was this interaction?</p>
          </div>

          {/* Feedback */}
          <div style={{ padding: '0 24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleFeedback(option.type)}
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{option.emoji}</span>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleSkip}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '16px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
              }}
            >
              {submitting ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <Zap size={20} />
                  Find Someone New
                </>
              )}
            </button>
            
            <button
              onClick={handleGoHome}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#a1a1aa',
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
