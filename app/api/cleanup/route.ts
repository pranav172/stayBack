import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all chats where user is participant
    // This is aggressive but ensures fresh start each time
    const { error } = await supabase
        .from('chats')
        .delete()
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    if (error) {
        console.error('Cleanup error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also remove from active_users queue if present
    await supabase.from('active_users').delete().eq('user_id', user.id)

    return NextResponse.json({ success: true })
}
