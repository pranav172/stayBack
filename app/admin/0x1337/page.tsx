import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, MessageSquare, UserCheck, Activity } from 'lucide-react'

// Secret admin page - only accessible if you know the URL
// URL: /admin/0x1337 (obscure enough)

async function getStats(supabase: any) {
    // Total registered users
    const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    // Total chats created
    const { count: totalChats } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })

    // Total messages sent
    const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

    // Active users in queue
    const { count: activeInQueue } = await supabase
        .from('active_users')
        .select('*', { count: 'exact', head: true })

    // Recent users (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday)

    // Recent messages (last 24h)
    const { count: recentMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday)

    return {
        totalUsers: totalUsers || 0,
        totalChats: totalChats || 0,
        totalMessages: totalMessages || 0,
        activeInQueue: activeInQueue || 0,
        recentUsers: recentUsers || 0,
        recentMessages: recentMessages || 0,
    }
}

export default async function AdminDashboard() {
    const supabase = await createClient()
    
    // Optional: Add admin check here if you want
    // const { data: { user } } = await supabase.auth.getUser()
    // if (user?.email !== 'rloveumom@gmail.com') redirect('/home')

    const stats = await getStats(supabase)

    const statCards = [
        { 
            icon: Users, 
            label: 'Total Users', 
            value: stats.totalUsers,
            subtext: `+${stats.recentUsers} today`,
            color: 'text-blue-400'
        },
        { 
            icon: MessageSquare, 
            label: 'Total Messages', 
            value: stats.totalMessages,
            subtext: `+${stats.recentMessages} today`,
            color: 'text-green-400'
        },
        { 
            icon: Activity, 
            label: 'Total Chats', 
            value: stats.totalChats,
            subtext: 'All time',
            color: 'text-purple-400'
        },
        { 
            icon: UserCheck, 
            label: 'In Queue Now', 
            value: stats.activeInQueue,
            subtext: 'Waiting to match',
            color: 'text-primary'
        },
    ]

    return (
        <div className="min-h-screen bg-secondary text-white p-6">
            {/* Header */}
            <header className="mb-8">
                <Link href="/home" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>
                <div className="mt-6 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
                </div>
                <p className="text-white/50 text-sm mt-1">Real-time analytics • Refresh for latest</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
                {statCards.map((stat, index) => (
                    <div 
                        key={index}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
                    >
                        <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                        <p className="text-3xl font-black">{stat.value}</p>
                        <p className="text-sm text-white/70 font-medium">{stat.label}</p>
                        <p className="text-xs text-white/40 mt-1">{stat.subtext}</p>
                    </div>
                ))}
            </div>

            {/* Quick Info */}
            <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-4 max-w-4xl">
                <h2 className="text-sm font-bold text-white/70 mb-2">📊 Quick Notes</h2>
                <ul className="text-xs text-white/50 space-y-1">
                    <li>• Refresh page to get latest stats</li>
                    <li>• "In Queue" = users waiting for a match right now</li>
                    <li>• View full data in Supabase Dashboard → Table Editor</li>
                </ul>
            </div>

            {/* Secret URL reminder */}
            <div className="mt-8 text-center">
                <p className="text-white/20 text-xs">
                    🔒 Secret URL: /admin/0x1337
                </p>
            </div>
        </div>
    )
}
