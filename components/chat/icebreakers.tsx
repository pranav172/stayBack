'use client'

import { useState, useEffect } from 'react'
import { generateIcebreakers, generateRoast } from '@/app/actions/groq'
import { Flame } from 'lucide-react'

export function IceBreakers({ onSelect }: { onSelect: (text: string) => void }) {
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateIcebreakers().then(res => {
        setOptions(res)
        setLoading(false)
    })
  }, [])

  const handleRoast = async () => {
    setLoading(true)
    const roast = await generateRoast()
    onSelect(`🔥 Roast: ${roast}`)
    setLoading(false)
  }

  if (loading && options.length === 0) return <div className="text-xs text-white/30 text-center p-2">Loading icebreakers...</div>

  return (
    <div className="flex flex-col gap-2 p-2">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {options.map((opt, i) => (
                <button 
                    key={i} 
                    onClick={() => onSelect(opt)}
                    className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/80 transition-colors flex-shrink-0"
                >
                    {opt}
                </button>
            ))}
        </div>
        <button 
            onClick={handleRoast}
            className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold py-2 rounded-xl border border-red-500/20 transition-colors w-full"
        >
            <Flame size={12} /> ROAST ME
        </button>
    </div>
  )
}
