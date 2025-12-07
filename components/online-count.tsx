'use client'

import { useOnlineCount } from '@/hooks/use-online-count'

export function OnlineCount() {
  const count = useOnlineCount()
  
  // Fake "baseline" for launch feel if 0, or just show real.
  // User spec: "683 people online right now". 
  // Let's emulate that "Launch" feel with a minimum number if we want, or just real.
  // I'll stick to real logic + a random base if empty for "MVP demo" effect, 
  // but strictly I should just show real. 
  // However, for zero users it looks dead. I'll add a mock offset for the "Design" feel
  // only if 0, or just let it be accurate.
  // I will just display the count.
  
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
        <span className="text-xs font-medium text-white/90">
             {count > 0 ? count : '...'} online
        </span>
    </div>
  )
}
