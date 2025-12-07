import Link from 'next/link'
import { ArrowLeft, Sparkles, Users, Heart, Shield, Zap, Rocket } from 'lucide-react'

const upcomingFeatures = [
    {
        icon: '👥',
        title: 'Group Chats',
        description: 'Anonymous group rooms with your hostel wing',
        eta: 'Jan 2025'
    },
    {
        icon: '💘',
        title: 'Crush Mode',
        description: 'Confess anonymously. Match only if mutual!',
        eta: 'Jan 2025'
    },
    {
        icon: '🛡️',
        title: 'AI Moderation',
        description: 'Auto-detect toxic messages & ban trolls',
        eta: 'Feb 2025'
    },
    {
        icon: '⚡',
        title: 'Speed Dating',
        description: '5-minute timer chats. Quick vibes only',
        eta: 'Feb 2025'
    },
    {
        icon: '🤖',
        title: 'AI Wingman',
        description: 'Let AI help you rizz up strangers',
        eta: 'Mar 2025'
    }
]

export default function ComingSoonPage() {
    return (
        <div className="min-h-screen bg-secondary text-white flex flex-col items-center justify-center p-6">
            {/* Back Button - Absolute positioned */}
            <Link 
                href="/home" 
                className="absolute top-6 left-6 inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} />
                Back
            </Link>

            {/* Main Content - Centered */}
            <div className="max-w-md w-full text-center">
                {/* Header with fun animation */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4 animate-bounce">
                        <Rocket className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Coming Soon</h1>
                    <p className="text-white/50 mt-2">What's cooking in the lab 🧪</p>
                </div>

                {/* Features List */}
                <div className="space-y-4 text-left">
                    {upcomingFeatures.map((feature, index) => (
                        <div 
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] hover:scale-[1.02] transition-all cursor-default"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{feature.icon}</span>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-sm">{feature.title}</h3>
                                        <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{feature.eta}</span>
                                    </div>
                                    <p className="text-white/50 text-xs mt-0.5">{feature.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Fun Footer */}
                <div className="mt-10 space-y-2">
                    <p className="text-white/30 text-xs">
                        Got ideas? We're all ears 👂
                    </p>
                    <p className="text-white/20 text-[10px]">
                        (DM us on Insta or something)
                    </p>
                </div>
            </div>
        </div>
    )
}
