'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Instagram, LogOut, Sparkles, X, AlertCircle, ArrowLeft, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { IceBreakers } from './icebreakers'

interface Message {
  id: string
  chat_id: string
  sender_id: string
  text: string
  created_at: string
}

export default function ChatInterface({ chatId, currentUserId }: { chatId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [partnerOnline, setPartnerOnline] = useState(true)
  const [showAi, setShowAi] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    // Initial Load
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
      
      if (data) {
          setMessages(data as Message[])
          setTimeout(() => scrollToBottom('auto'), 100)
      }
    }
    fetchMessages()

    // Message Subscription
    const msgChannel = supabase.channel(`chat_messages_${chatId}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `chat_id=eq.${chatId}` 
      }, (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev
            if (prev.some(m => m.id.startsWith('temp-') && m.text === newMessage.text && m.sender_id === newMessage.sender_id)) {
                return prev.map(m => 
                    m.id.startsWith('temp-') && m.text === newMessage.text && m.sender_id === newMessage.sender_id 
                    ? newMessage 
                    : m
                )
            }
            return [...prev, newMessage]
        })
      })
      .subscribe()

    // Partner Presence
    const presenceChannel = supabase.channel(`presence_chat_${chatId}`, {
        config: { presence: { key: currentUserId } }
    })
    
    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState()
            const onlineUsers = Object.keys(state)
            setPartnerOnline(onlineUsers.length >= 1)
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
            if (key !== currentUserId) {
                setPartnerOnline(false)
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ online_at: new Date().toISOString() })
            }
        })

    // Global Online Count
    const globalChannel = supabase.channel('online_users')
    globalChannel
        .on('presence', { event: 'sync' }, () => {
            setOnlineCount(Object.keys(globalChannel.presenceState()).length)
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await globalChannel.track({ user_id: currentUserId })
            }
        })

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(globalChannel)
    }
  }, [chatId, supabase, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputText.trim()) return

    const textPayload = inputText
    setInputText('')
    setShowAi(false)
    
    const tempId = 'temp-' + Date.now()
    const optimisticMsg: Message = {
        id: tempId,
        chat_id: chatId,
        sender_id: currentUserId,
        text: textPayload,
        created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])
    scrollToBottom()

    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        text: textPayload
      })

    if (error) {
      console.error('Send error:', error)
    }
  }

  const handleLeave = async () => {
      await fetch('/api/cleanup', { method: 'POST' })
      router.push('/home')
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-secondary overflow-hidden relative">
      
      {/* Header */}
      <header className="flex-none h-16 px-4 md:px-8 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-md z-20">
         <div className="flex items-center gap-3">
            <button 
                onClick={handleLeave}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div className={`w-2.5 h-2.5 rounded-full ${partnerOnline ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
            <span className="font-bold text-white tracking-wide">
                {partnerOnline ? 'Anonymous' : 'Partner Left'}
            </span>
         </div>
         <div className="flex items-center gap-3">
            {/* Online Count */}
            <div className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full">
                <Users size={12} />
                <span>{onlineCount} online</span>
            </div>
            <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-pink-500 transition-colors">
                <Instagram size={20} />
            </button>
            <button onClick={handleLeave} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-red-500 transition-colors" title="Leave & Find New">
                <LogOut size={20} />
            </button>
         </div>
      </header>

      {/* Partner Left Banner */}
      {!partnerOnline && (
          <div className="flex-none bg-red-500/20 border-b border-red-500/30 p-3 flex items-center justify-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>Your partner has left the chat.</span>
              <button onClick={handleLeave} className="ml-2 px-3 py-1 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 transition-colors font-medium">
                  Find New Match
              </button>
          </div>
      )}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 flex flex-col pb-28">
         {messages.length === 0 && (
             <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-sm">
                 <p>Say hi! Don't be shy.</p>
                 <button onClick={() => setShowAi(true)} className="mt-4 text-primary hover:underline text-xs">
                    Need an icebreaker?
                 </button>
             </div>
         )}
         
         {!messages.length && <div className="flex-1" />}

         <div className="space-y-4 pt-4 max-w-3xl mx-auto w-full">
            {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-[15px] break-words leading-relaxed shadow-sm ${
                            isMe 
                            ? 'bg-primary text-white rounded-tr-sm shadow-[0_4px_15px_rgba(255,45,85,0.15)]' 
                            : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                )
            })}
            <div ref={messagesEndRef} />
         </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 p-4 px-4 md:px-8 z-30 pb-6">
        
        {/* AI Panel */}
        {showAi && (
            <div className="absolute bottom-full left-2 right-2 md:left-4 md:right-4 p-4 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl mb-2 max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">✨ AI Assistant</span>
                    <button onClick={() => setShowAi(false)} className="text-white/50 hover:text-white p-1">
                        <X size={16} />
                    </button>
                </div>
                <IceBreakers onSelect={(text) => {
                    setInputText(text)
                    setShowAi(false)
                }} />
            </div>
        )}

        <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3 items-center max-w-3xl mx-auto"
        >
            <button
                type="button"
                onClick={() => setShowAi(!showAi)}
                disabled={!partnerOnline}
                className={`p-3 rounded-full transition-all ${showAi ? 'bg-primary text-white rotate-12' : 'bg-white/10 text-primary hover:bg-white/20'} disabled:opacity-50`}
            >
                <Sparkles size={20} />
            </button>

            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={partnerOnline ? "Type a message..." : "Partner left..."}
                disabled={!partnerOnline}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20 disabled:opacity-50"
            />
            
            <button 
                type="submit"
                disabled={!inputText.trim() || !partnerOnline}
                className="p-3 bg-primary rounded-full text-white disabled:opacity-50 disabled:scale-95 transition-all hover:bg-pink-600 active:scale-95 shadow-lg shadow-primary/20"
            >
                <Send size={20} />
            </button>
        </form>
      </div>
    </div>
  )
}
