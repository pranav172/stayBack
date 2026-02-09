'use client'

import { MatchButton } from '@/components/home/match-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Suspense } from 'react'

export default function LandingPage() {
  return (
    <div style={{ 
      minHeight: '100vh',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-primary) 100%)',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 50% at 20% 20%, rgba(99, 102, 241, 0.08), transparent), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139, 92, 246, 0.05), transparent)'
        }} />
      </div>
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Header - compact */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              💬
            </div>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>
              <span style={{ color: 'var(--text-primary)', opacity: 0.9 }}>muj</span>
              <span style={{ color: '#818cf8' }}>Anon</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ThemeToggle />
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              border: '1px solid var(--border-color)', 
              padding: '4px 10px', 
              borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.03)'
            }}>
              Beta
            </span>
          </div>
        </header>

        {/* Main - fills remaining space */}
        <main style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '0 16px',
          overflow: 'auto'
        }}>
          <div style={{ 
            maxWidth: '400px', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center', 
            gap: '20px'
          }}>
            
            {/* Title - more compact */}
            <div>
              <h1 style={{ 
                fontSize: 'clamp(28px, 6vw, 40px)', 
                fontWeight: 700, 
                lineHeight: 1.1,
                marginBottom: '8px'
              }}>
                <span style={{ color: '#fff' }}>Chat with </span>
                <span style={{ 
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>MUJians</span>
              </h1>
              <p style={{ color: '#71717a', fontSize: '15px' }}>
                Anonymous. Instant. No judgments.
              </p>
            </div>

            {/* Match Button */}
            <Suspense fallback={
              <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  border: '2px solid #6366f1', 
                  borderTopColor: 'transparent', 
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            }>
              <MatchButton />
            </Suspense>

            {/* Features - compact row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
              {['🔒 Anonymous', '⚡ Instant', '💨 Auto-delete', '🛡️ Moderated'].map((feature) => (
                <span 
                  key={feature}
                  style={{ 
                    padding: '5px 10px', 
                    fontSize: '12px', 
                    color: '#52525b', 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    borderRadius: '14px', 
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </main>

        {/* Footer - compact */}
        <footer style={{ padding: '10px', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: '11px', color: '#3f3f46' }}>
            Manipal University Jaipur • Be respectful
          </p>
        </footer>
      </div>
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
