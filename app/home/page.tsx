import { OnlineCount } from '@/components/online-count'
import { MatchButton } from '@/components/home/match-button'

export default async function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', padding: '16px', position: 'relative', overflow: 'hidden' }}>
        {/* Background Effects */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '33%', left: '25%', width: '256px', height: '256px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', filter: 'blur(100px)' }} />
            <div style={{ position: 'absolute', bottom: '33%', right: '25%', width: '256px', height: '256px', backgroundColor: 'rgba(251, 191, 36, 0.08)', borderRadius: '50%', filter: 'blur(100px)' }} />
        </div>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', zIndex: 10 }}>
            <h1 className="gradient-text" style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em' }}>mujAnon</h1>
            <OnlineCount />
        </header>

        {/* Main Action */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>Find Someone</h2>
                <p style={{ color: 'var(--text-muted)' }}>Anonymous 1-on-1 chat</p>
            </div>
            
            <MatchButton />
        </main>

        {/* Footer */}
        <footer style={{ textAlign: 'center', padding: '16px 0', zIndex: 10 }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', opacity: 0.5 }}>Chats disappear when you leave</p>
        </footer>
    </div>
  )
}
