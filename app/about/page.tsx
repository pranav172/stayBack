import Link from 'next/link'
import { ArrowLeft, Instagram, Mail } from 'lucide-react'

const funStats = [
    {
        emoji: '☕',
        value: '∞',
        label: 'Coffees consumed'
    },
    {
        emoji: '🌙',
        value: '4 AM',
        label: 'Sleep is a myth'
    },
    {
        emoji: '📚',
        value: 'BTech',
        label: 'The real side project'
    },
    {
        emoji: '💀',
        value: '99%',
        label: 'Side projects failed'
    }
]

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-secondary text-white flex flex-col items-center justify-center p-6">
            {/* Back Button */}
            <Link 
                href="/home" 
                className="absolute top-6 left-6 inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} />
                Back
            </Link>

            {/* Main Content */}
            <div className="max-w-md w-full text-center">
                {/* Avatar */}
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-full text-4xl shadow-2xl shadow-primary/30 animate-pulse">
                        🥷
                    </div>
                </div>

                {/* Name & Title */}
                <h1 className="text-2xl font-black tracking-tight">Anonymous Dev</h1>
                <p className="text-white/50 text-sm mt-1">professional overthinker & builder 🛠️</p>

                {/* Bio Card */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                    <p className="text-white/80 text-sm leading-relaxed">
                        College + Vacation + "Kuch interesting karte hain yaar" = Stayback 🎯
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed mt-3">
                        Recipe: 3 AM idea + coffee overdose + "ye definitely kaam karega" delusion
                    </p>
                    <p className="text-white/60 text-xs mt-3 italic">
                        Graveyard of 99 failed side projects, but hey, this one shipped! 🚀
                    </p>
                </div>

                {/* Fun Stats Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                    {funStats.map((stat, index) => (
                        <div 
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] hover:scale-[1.02] transition-all"
                        >
                            <span className="text-2xl">{stat.emoji}</span>
                            <p className="text-lg font-bold mt-1">{stat.value}</p>
                            <p className="text-[10px] text-white/40">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="mt-8 bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs text-primary font-medium mb-3">
                        ✨ Wanna collab or just vibe? Hit me up:
                    </p>
                    <div className="flex justify-center gap-4">
                        <a 
                            href="https://instagram.com/i_felt.it" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-pink-400 transition-colors bg-white/5 px-3 py-2 rounded-full"
                        >
                            <Instagram size={14} />
                            @i_felt.it
                        </a>
                        <a 
                            href="mailto:rloveumom@gmail.com"
                            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-blue-400 transition-colors bg-white/5 px-3 py-2 rounded-full"
                        >
                            <Mail size={14} />
                            Email
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 space-y-1">
                    <p className="text-white/20 text-[10px]">
                        Built with ❤️, caffeine, and questionable life choices
                    </p>
                    <p className="text-white/10 text-[10px]">
                        © 2024 Stayback
                    </p>
                </div>
            </div>
        </div>
    )
}
