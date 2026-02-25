'use client'

import { Suspense, useEffect, useState } from 'react'
import { MatchButton } from '@/components/home/match-button'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { Share2, ChevronRight } from 'lucide-react'

// ── Feature Tour ────────────────────────────────────────────────────────────
interface TourStep {
  title: string
  emoji: string
  description: string
}
const TOUR_STEPS: TourStep[] = [
  {
    emoji: '💬',
    title: '1-on-1 Anonymous Chat',
    description: 'Match instantly with other MUJians. No names, no profiles — just vibes. Chats auto-delete in 24h.',
  },
  {
    emoji: '🕯️',
    title: 'Confession Wall',
    description: 'Share what\'s on your mind anonymously. Swipe to explore confessions from your fellow students.',
  },
  {
    emoji: '👥',
    title: 'Group Rooms',
    description: 'Jump into anonymous group chats with up to 4 people. Rooms last 30 minutes and then disappear.',
  },
  {
    emoji: '🔒',
    title: 'Always Anonymous',
    description: 'No accounts, no email, no data stored about you. Your identity is never revealed to anyone.',
  },
]

function FeatureTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step === TOUR_STEPS.length - 1
  const s = TOUR_STEPS[step]
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px', margin: '0 8px',
        backgroundColor: '#13131f', borderRadius: '24px 24px 0 0',
        border: '1px solid rgba(255,255,255,0.1)', padding: '28px 24px 36px',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? '20px' : '6px', height: '6px', borderRadius: '3px',
              backgroundColor: i === step ? '#f59e0b' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>{s.emoji}</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f4f4f5', marginBottom: '10px' }}>{s.title}</h2>
          <p style={{ fontSize: '15px', color: '#71717a', lineHeight: 1.6 }}>{s.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717a', fontSize: '14px', cursor: 'pointer',
          }}>
            Skip
          </button>
          <button onClick={() => isLast ? onClose() : setStep(s => s + 1)} style={{
            flex: 2, padding: '12px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            color: '#000', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            {isLast ? '🚀 Let\'s go!' : <>Next <ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
      <style jsx global>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  href, emoji, title, subtitle, gradient, badge
}: {
  href: string; emoji: string; title: string; subtitle: string
  gradient: string; badge?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={href} style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        padding: '16px', borderRadius: '16px',
        background: hovered ? gradient : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'transparent' : 'rgba(255,255,255,0.09)'}`,
        transition: 'all 0.2s', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: hovered ? '#fff' : '#e4e4e7' }}>{title}</span>
            {badge && (
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                backgroundColor: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
              }}>{badge}</span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: hovered ? 'rgba(255,255,255,0.7)' : '#71717a', margin: '3px 0 0' }}>{subtitle}</p>
        </div>
        <ChevronRight size={16} color={hovered ? 'rgba(255,255,255,0.6)' : '#3f3f52'} />
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [showTour, setShowTour] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
    // Show tour for first-time visitors — only on client
    const seen = localStorage.getItem('mujanon_tour_seen')
    if (!seen) {
      setTimeout(() => setShowTour(true), 800)
    }
  }, [])

  const closeTour = () => {
    localStorage.setItem('mujanon_tour_seen', '1')
    setShowTour(false)
  }

  const handleShare = async () => {
    const data = { title: 'mujAnon', text: 'Anonymous chat for MUJians. No names, no judgments.', url: window.location.origin }
    if (navigator.share) {
      try { await navigator.share(data) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.origin)
      const t = document.createElement('div')
      t.textContent = '🔗 Link copied!'
      Object.assign(t.style, {
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        padding: '10px 20px', backgroundColor: '#f59e0b', color: '#000',
        borderRadius: '20px', fontWeight: 700, fontSize: '14px', zIndex: '9999',
      })
      document.body.appendChild(t)
      setTimeout(() => t.remove(), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', height: '100dvh',
      backgroundColor: '#0a0a12', position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Tour — only renders after hydration to prevent SSR mismatch */}
      {mounted && showTour && <FeatureTour onClose={closeTour} />}

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
              💬
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px' }}>
              <span style={{ color: '#a1a1aa' }}>muj</span>
              <span style={{ color: '#f59e0b' }}>Anon</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => { if (mounted) setShowTour(true) }} style={{
              padding: '5px 10px', borderRadius: '16px', fontSize: '11px',
              backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#71717a', cursor: 'pointer',
            }}>
              ? Tour
            </button>
            <button onClick={handleShare} style={{
              padding: '6px 10px', borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              color: '#71717a', fontSize: '12px',
            }}>
              <Share2 size={12} />
            </button>
            <ThemeToggle />
            <span style={{ fontSize: '10px', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)', padding: '4px 8px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              Beta
            </span>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', gap: '24px' }}>
          <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Heading */}
            <h1 style={{ fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '8px' }}>
              <span style={{ color: '#e4e4e7' }}>Chat with </span>
              <span style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>MUJians</span>
            </h1>
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '20px' }}>
              Anonymous. Instant. No judgments.
            </p>

            {/* Match button */}
            <Suspense fallback={<div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '24px', height: '24px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
              <MatchButton />
            </Suspense>
          </div>

          {/* Feature Cards */}
          <div style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '11px', color: '#3f3f52', marginBottom: '2px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Explore</p>
            <FeatureCard
              href="/confessions"
              emoji="🕯️"
              title="Confession Wall"
              subtitle="Swipe through anonymous confessions"
              gradient="linear-gradient(135deg, rgba(236,72,153,0.4), rgba(168,85,247,0.2))"
              badge="New"
            />
            <FeatureCard
              href="/groups"
              emoji="👥"
              title="Group Rooms"
              subtitle="Anonymous group chats · up to 4 people"
              gradient="linear-gradient(135deg, rgba(99,102,241,0.4), rgba(59,130,246,0.2))"
              badge="New"
            />
          </div>
        </main>

        {/* Footer */}
        <footer style={{ padding: '10px 20px', textAlign: 'center', flexShrink: 0, display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
          <p style={{ fontSize: '11px', color: '#3f3f52' }}>MUJ · Be respectful</p>
          <span style={{ color: '#3f3f52', fontSize: '11px' }}>·</span>
          <Link href="/privacy" style={{ fontSize: '11px', color: '#3f3f52', textDecoration: 'none' }}>Privacy</Link>
          <span style={{ color: '#3f3f52', fontSize: '11px' }}>·</span>
          <Link href="/terms" style={{ fontSize: '11px', color: '#3f3f52', textDecoration: 'none' }}>Terms</Link>
        </footer>
      </div>

      <style>{`
        .feature-card-inner:hover {
          background: var(--hover-bg) !important;
          border-color: transparent !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}
