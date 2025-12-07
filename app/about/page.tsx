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
                <div className="text-5xl mb-4">🫡</div>
                <h1 className="text-xl font-bold">4th Year • Builder</h1>
                <p className="text-white/50 text-sm mt-2">
                    Made this for the homies stuck on campus. No one should be bored alone.
                </p>
                
                <a 
                    href="mailto:rloveumom@gmail.com"
                    className="mt-6 inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
                >
                    <Mail size={12} /> rloveumom@gmail.com
                </a>
            </div>
        </div>
    )
}
