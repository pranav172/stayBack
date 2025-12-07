import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnlineCount } from '@/components/online-count'
import { MatchButton } from '@/components/home/match-button'
import Link from 'next/link'
import { Info, Sparkles } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-secondary text-white flex flex-col p-4 md:p-8 relative overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold tracking-tight">Stayback</h1>
            <div className="flex items-center gap-3">
                <OnlineCount />
            </div>
        </header>

        {/* Main Action */}
        <main className="flex-1 flex flex-col items-center justify-center space-y-8 z-10">
            
            <MatchButton />

            <div className="text-center space-y-2 max-w-xs">
                <p className="text-white/50 text-sm">Matching is anonymous.</p>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <p className="text-xs text-white/70 italic">
                        &quot;Ask: What&apos;s the wildest rumor you&apos;ve heard about Block A?&quot;
                    </p>
                </div>
            </div>

        </main>

        {/* Footer Links */}
        <footer className="flex justify-center gap-6 py-4">
            <Link 
                href="/coming-soon" 
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
                <Sparkles size={12} />
                Coming Soon
            </Link>
            <Link 
                href="/about" 
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
                <Info size={12} />
                About
            </Link>
        </footer>
    </div>
  )
}
