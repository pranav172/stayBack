
import ChatInterface from '@/components/chat/chat-interface'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChatPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }

  // TODO: Verify if user is part of this chat via RLS or explicit check
  // const { data: chat } = await supabase.from('chats').select('*').eq('id', params.id).single()
  // if (!chat || (chat.user1_id !== user.id && chat.user2_id !== user.id)) redirect('/home')

  // Await params in Next.js 15
  const { id } = await params;

  return <ChatInterface chatId={id} currentUserId={user.id} />
}
