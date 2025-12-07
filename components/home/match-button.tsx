'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function MatchButton() {
    const [status, setStatus] = useState<'idle' | 'searching' | 'matched'>('idle')
    const [loading, setLoading] = useState(false)
    const [onlineCount, setOnlineCount] = useState(0)
    const supabase = createClient()
    const router = useRouter()
    
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const presenceRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        // Cleanup old chats on mount
        fetch('/api/cleanup', { method: 'POST' }).catch(console.error)

        // Track online users
        const channel = supabase.channel('online_users')
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                setOnlineCount(Object.keys(state).length)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online: true })
                }
            })
        presenceRef.current = channel

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current)
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (presenceRef.current) supabase.removeChannel(presenceRef.current)
        }
    }, [])

    const handleTap = async () => {
        if (loading) return

        // STOP / CANCEL
        if (status === 'searching') {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await supabase.from('active_users').delete().eq('user_id', user.id)
                }
                if (channelRef.current) {
                    await supabase.removeChannel(channelRef.current)
                    channelRef.current = null
                }
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
                setStatus('idle')
            } catch (error) {
                console.error('Error canceling:', error)
            } finally {
                setLoading(false)
            }
            return
        }

        // START MATCHING
        setLoading(true)
        await fetch('/api/cleanup', { method: 'POST' })
        
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/')
                return
            }

            const { data, error } = await supabase.rpc('find_match', { my_id: user.id })
            
            if (error) {
                console.error(error)
                alert('Error finding match: ' + error.message)
                setLoading(false)
                return
            }

            if (data && data.length > 0 && data[0].status === 'matched') {
                setStatus('matched')
                router.push(`/chat/${data[0].match_chat_id}`)
                return
            } 
            
            setStatus('searching')
            setLoading(false)

            // Realtime Listener
            const channel = supabase.channel(`user_chats_${user.id}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'chats' }, 
                    (payload) => {
                        const newChat = payload.new as any
                        if (newChat.user1_id === user.id || newChat.user2_id === user.id) {
                            setStatus('matched')
                            if (intervalRef.current) clearInterval(intervalRef.current)
                            supabase.removeChannel(channel)
                            router.push(`/chat/${newChat.id}`)
                        }
                    }
                )
                .subscribe()
            channelRef.current = channel

            // Polling Fallback
            intervalRef.current = setInterval(async () => {
                const { data: chats } = await supabase
                    .from('chats')
                    .select('id')
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                    .order('created_at', { ascending: false })
                    .limit(1)
                
                if (chats && chats.length > 0) {
                    setStatus('matched')
                    if (intervalRef.current) clearInterval(intervalRef.current)
                    if (channelRef.current) supabase.removeChannel(channelRef.current)
                    router.push(`/chat/${chats[0].id}`)
                }
            }, 2000)

        } catch (e) {
            console.error(e)
            setLoading(false)
        }
    }

    const isAlone = onlineCount <= 1

    return (
        <div className="flex flex-col items-center gap-8 z-10">
            <button 
                onClick={handleTap}
                disabled={loading || status === 'matched'}
                className="group relative"
            >
                <div className={`absolute inset-0 bg-primary/30 rounded-full blur-[60px] transition-all duration-700 ${status === 'searching' ? 'scale-150 animate-pulse' : 'scale-75 opacity-50 group-hover:scale-100 group-hover:opacity-100'}`} />
                
                <div className={`w-64 h-64 rounded-full border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 shadow-2xl ${status === 'searching' ? 'bg-black/40 border-primary/50 shadow-[0_0_50px_rgba(255,45,85,0.3)]' : 'bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95'}`}>
                    
                    {status === 'searching' && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-primary/30 animate-[ping_3s_linear_infinite]" />
                            <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_3s_linear_infinite_1s]" />
                        </>
                    )}

                    {loading ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    ) : status === 'searching' ? (
                        <>
                            <div className="w-4 h-4 rounded-sm bg-red-500 mb-4 animate-pulse relative z-10" />
                            <span className="text-xl font-bold text-white tracking-widest uppercase relative z-10">Stop</span>
                            <span className="text-xs text-white/50 mt-2 font-medium relative z-10">Searching...</span>
                        </>
                    ) : status === 'matched' ? (
                        <span className="text-xl font-bold text-green-400 tracking-widest uppercase animate-bounce">Matched!</span>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-2xl rotate-12 mb-6 group-hover:rotate-[24deg] transition-transform duration-500 shadow-lg" />
                            <span className="text-2xl font-black text-white tracking-widest italic">TAP TO TALK</span>
                            <span className="text-xs text-white/50 mt-2 font-medium">1-on-1 • Anonymous</span>
                        </>
                    )}
                </div>
            </button>
            
            {status === 'searching' && (
                <p className="text-white/50 text-sm animate-pulse">
                    {isAlone ? "You're the only one online. Waiting for someone..." : "Looking for a partner..."}
                </p>
            )}

            {status === 'idle' && isAlone && (
                <p className="text-white/40 text-xs text-center max-w-xs">
                    No one else is online right now. Be the first to start a session!
                </p>
            )}
        </div>
    )
}
