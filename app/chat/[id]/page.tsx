'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, get } from 'firebase/database'
import { useConnection } from '@/components/connection-provider'
import ChatInterface from '@/components/chat/chat-interface'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.id as string
  const { userId } = useConnection()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!userId) return // Wait for auth from ConnectionProvider

    const checkAuth = async () => {
      // Check if user is part of this chat
      const chatSnapshot = await get(ref(database, `chats/${chatId}`))
      if (chatSnapshot.exists()) {
        const chat = chatSnapshot.val()
        if (chat.user1 === userId || chat.user2 === userId) {
          setAuthorized(true)
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
      setLoading(false)
    }

    checkAuth()
  }, [chatId, router, userId])

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <ChatInterface chatId={chatId} currentUserId={userId} />
}
