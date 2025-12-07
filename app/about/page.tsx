import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

const vibeCheck = [
    {
        emoji: '🎧',
        value: 'Lofi + Raftaar',
        label: 'Coding playlist'
    },
    {
        emoji: '🍜',
        value: 'Maggi Expert',
        label: '2 AM snack game strong'
    },
    {
        emoji: '🎬',
        value: '3 Idiots',
        label: 'Movie that hits different'
    },
    {
        emoji: '💡',
        value: 'Builder',
        label: 'Not a 9-5 corpo slave'
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
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-full text-4xl shadow-2xl shadow-primary/30">
                        🫡
                    </div>
                </div>

                {/* Name & Title */}
                <h1 className="text-2xl font-black tracking-tight">4th Year Builder</h1>
                <p className="text-white/50 text-sm mt-1">passionate • jobless • loves building stuff 🛠️</p>

                {/* Bio Card */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3">
                    <p className="text-white/80 text-sm leading-relaxed">
                        Not here for placements, here for the <span className="text-primary font-medium">experience</span>. 
                        Building random apps at 3 AM because corporate 9-5 feels like a prison.
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">
                        Made <span className="text-primary font-medium">Stayback</span> for all the homies stuck 
                        on campus during vacations. No one should be bored alone. 
                    </p>
                    <p className="text-white/60 text-xs italic">
                        "Juniors ko help karna &gt; LinkedIn flex" 🤝
                    </p>
                </div>

                {/* Vibe Check Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                    {vibeCheck.map((item, index) => (
                        <div 
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] hover:scale-[1.02] transition-all"
                        >
                            <span className="text-2xl">{item.emoji}</span>
                            <p className="text-sm font-bold mt-1 text-white/90">{item.value}</p>
                            <p className="text-[10px] text-white/40">{item.label}</p>
                        </div>
                    ))}
                </div>

                {/* Message to Juniors */}
                <div className="mt-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-4 text-left">
                    <p className="text-xs text-white/70 leading-relaxed">
                        <span className="text-primary font-bold">To my juniors:</span> College is short. 
                        Build stuff. Break stuff. Meet people. Don't just chase placements — 
                        chase experiences. The memories you make &gt; the package you get. 💯
                    </p>
                </div>

                {/* Contact */}
                <div className="mt-6">
                    <p className="text-xs text-white/40 mb-2">Ideas? Feedback? Collab?</p>
                    <a 
                        href="mailto:rloveumom@gmail.com"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10"
                    >
                        <Mail size={14} />
                        rloveumom@gmail.com
                    </a>
                </div>

                {/* Footer */}
                <div className="mt-8">
                    <p className="text-white/15 text-[10px]">
                        © 2024 Stayback • Made with ❤️ by someone who gets it
                    </p>
                </div>
            </div>
        </div>
    )
}
