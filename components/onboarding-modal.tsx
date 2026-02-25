'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    emoji: '💬',
    title: 'Welcome to mujAnon',
    body: 'Anonymous chat for MUJians. No names. No profiles. Just real conversations with fellow students.',
  },
  {
    emoji: '🎭',
    title: 'Choose Your Vibe',
    body: 'Platonics to make friends, Study to find a buddy, or Random to match with anyone. Plus a mood selector so we match you with someone who gets you.',
  },
  {
    emoji: '🕯️',
    title: 'Not Just 1-on-1',
    body: 'Check out Group Rooms (4-person chats) and the Confession Wall for the full MUJian community experience.',
  },
  {
    emoji: '🤍',
    title: 'Be Kind. Be Real.',
    body: "Everyone here is a student, just like you. Be respectful. Chats auto-delete in 24h. You're safe to be yourself.",
  },
]

const STORAGE_KEY = 'mujanon_onboarded'

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(slide + 1)
    else dismiss()
  }

  if (!visible) return null

  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)', borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '32px 28px', maxWidth: '360px', width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        position: 'relative', textAlign: 'center',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', display: 'flex' }}
        >
          <X size={18} />
        </button>

        {/* Emoji */}
        <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>
          {current.emoji}
        </div>

        {/* Content */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
          {current.body}
        </p>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px' }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? '20px' : '6px', height: '6px',
              borderRadius: '3px',
              backgroundColor: i === slide ? '#f59e0b' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={next}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            border: 'none', color: '#000', fontWeight: 700, fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: '0 4px 20px rgba(245,158,11,0.3)'
          }}
        >
          {isLast ? "Let's go! 🚀" : <>Next <ChevronRight size={16} /></>}
        </button>

        {!isLast && (
          <button onClick={dismiss} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#52525b', fontSize: '13px', cursor: 'pointer' }}>
            Skip tutorial
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
