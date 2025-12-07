
import { LoginForm } from '@/components/auth/login-form'
import { OnlineCount } from '@/components/online-count'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-secondary">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-[128px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/30 rounded-full blur-[128px] opacity-60 pointer-events-none" />

      {/* Header / Online Count */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <OnlineCount />
      </div>

      <main className="z-10 w-full max-w-md flex flex-col items-center text-center space-y-8">
        
        {/* Logo / Icon */}
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(255,45,85,0.3)] mb-4">
          <div className="text-4xl">💭</div> {/* Placeholder for speech bubble */}
        </div>

        {/* Hero Text */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-xl">
            Stayback
          </h1>
          <p className="text-xl text-white/60 font-medium">
            Your college. No names. Real talks.
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 gap-3 w-full px-4">
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm text-left">
            <h3 className="text-pink-500 font-bold mb-1">ZERO OUTSIDERS</h3>
            <p className="text-sm text-white/50">Only verified college emails allowed.</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm text-left">
             <h3 className="text-purple-400 font-bold mb-1">DISAPPEARS FOREVER</h3>
             <p className="text-sm text-white/50">Chats delete instantly when you leave.</p>
          </div>
        </div>

        {/* Login Form Placeholder */}
        <LoginForm />

      </main>

      <footer className="absolute bottom-6 text-xs text-white/20">
        Launch ready • December 2025
      </footer>
    </div>
  );
}
