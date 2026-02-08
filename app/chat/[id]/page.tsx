'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { database, auth } from '@/lib/firebase'
import { ref, get } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import ChatInterface from '@/components/chat/chat-interface'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/')
        return
      }
      
      setUserId(user.uid)
      
      // Check if user is part of this chat
      const chatSnapshot = await get(ref(database, `chats/${chatId}`))
      if (chatSnapshot.exists()) {
        const chat = chatSnapshot.val()
        if (chat.user1 === user.uid || chat.user2 === user.uid) {
          setAuthorized(true)
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
      
      setLoading(false)
    })

    return () => unsubAuth()
  }, [chatId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized || !userId) {
    return null
  }

  return <ChatInterface chatId={chatId} currentUserId={userId} />
}
