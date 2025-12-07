import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-secondary text-white flex flex-col items-center justify-center p-6">
            <Link 
                href="/home" 
                className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2"
            >
                <ArrowLeft size={16} /> Back
            </Link>

            <div className="text-center max-w-xs">
                {/* Animated emoji */}
                <div className="text-5xl mb-4 animate-bounce">🫡</div>
                
                <h1 className="text-xl font-bold animate-pulse">Just a Builder</h1>
                
                <p className="text-white/50 text-sm mt-3 leading-relaxed">
                    Made this for the homies stuck on campus. 
                    <br />
                    <span className="text-white/30">No one should be bored alone.</span>
                </p>
                
                <a 
                    href="mailto:rloveumom@gmail.com"
                    className="mt-6 inline-flex items-center gap-2 text-xs text-white/40 hover:text-primary transition-all hover:scale-105"
                >
                    <Mail size={12} /> say hi
                </a>
            </div>
        </div>
    )
}
