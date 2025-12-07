'use client'

import { useState } from 'react'
import { login } from '@/app/actions'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)
    
    const result = await login(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result?.success) {
      setMessage({ type: 'success', text: 'Magic link sent! Check your inbox (and spam).' })
    }
    
    setLoading(false)
  }

  return (
    <div className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <form action={handleSubmit} className="space-y-4 relative z-10">
        <h2 className="text-lg font-semibold text-white">Enter your college email</h2>
        
        <input 
          type="email" 
          name="email"
          placeholder="@muj.manipal.edu" 
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          autoComplete="email"
          required 
        />

        <button 
          disabled={loading}
          className="w-full bg-primary hover:bg-pink-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_20px_rgba(255,45,85,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            'Get Magic Link'
          )}
        </button>

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-green-500/20 text-green-200 border border-green-500/30'}`}>
            {message.type === 'error' ? '🚫 ' : '✨ '}
            {message.text}
          </div>
        )}

      </form>
      
      {/* Decorative inner glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
    </div>
  )
}
