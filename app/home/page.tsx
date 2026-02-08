import { OnlineCount } from '@/components/online-count'
import { MatchButton } from '@/components/home/match-button'

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-secondary text-white flex flex-col p-4 md:p-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/15 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/15 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <header className="flex justify-between items-center mb-8 z-10">
            <h1 className="text-xl font-bold tracking-tight gradient-text">mujAnon</h1>
            <OnlineCount />
        </header>

        {/* Main Action */}
        <main className="flex-1 flex flex-col items-center justify-center z-10">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2">Find Someone</h2>
                <p className="text-white/50">Anonymous 1-on-1 chat</p>
            </div>
            
            <MatchButton />
        </main>

        {/* Footer */}
        <footer className="text-center py-4 z-10">
            <p className="text-xs text-white/20">Chats disappear when you leave</p>
        </footer>
    </div>
  )
}
