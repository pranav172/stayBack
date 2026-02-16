'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, query, orderByChild, limitToLast, remove } from 'firebase/database'
import { Users, MessageCircle, Flag, Activity, Clock } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  activeConnections: number
  staleConnections: number
  queueLength: number
  activeChats: number
  pendingReports: number
}

interface ConnectionInfo {
  id: string
  userId: string
  connectedAt: number
  lastSeen: number
  isStale: boolean
}

interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  chatId: string
  reason: string
  additionalInfo?: string
  timestamp: number
  status: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeConnections: 0,
    staleConnections: 0,
    queueLength: 0,
    activeChats: 0,
    pendingReports: 0
  })
  const [connections, setConnections] = useState<ConnectionInfo[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen to connections count with stale detection
    const connectionsRef = ref(database, 'connections')
    const unsubConnections = onValue(connectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const now = Date.now()
        const STALE_THRESHOLD = 30000 // 30 seconds
        
        const connectionList: ConnectionInfo[] = Object.entries(data).map(([id, conn]: [string, unknown]) => {
          const c = conn as { odUserId?: string; connectedAt?: number; lastSeen?: number }
          const lastSeen = c.lastSeen || c.connectedAt || now
          return {
            id,
            userId: c.odUserId || 'unknown',
            connectedAt: c.connectedAt || now,
            lastSeen,
            isStale: now - lastSeen > STALE_THRESHOLD
          }
        })
        
        const staleCount = connectionList.filter(c => c.isStale).length
        
        setConnections(connectionList)
        setStats(prev => ({
          ...prev,
          activeConnections: connectionList.length,
          staleConnections: staleCount
        }))
      } else {
        setConnections([])
        setStats(prev => ({ ...prev, activeConnections: 0, staleConnections: 0 }))
      }
    })

    // Listen to queue count
    const queueRef = ref(database, 'queue')
    const unsubQueue = onValue(queueRef, (snapshot) => {
      setStats(prev => ({
        ...prev,
        queueLength: snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      }))
    })

    // Listen to active chats
    const chatsRef = ref(database, 'chats')
    const unsubChats = onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const chats = snapshot.val()
        const activeCount = Object.values(chats as Record<string, { isActive: boolean }>).filter((c) => c.isActive).length
        setStats(prev => ({ ...prev, activeChats: activeCount }))
      } else {
        setStats(prev => ({ ...prev, activeChats: 0 }))
      }
    })

    // Listen to reports
    const reportsRef = query(ref(database, 'reports'), orderByChild('timestamp'), limitToLast(10))
    const unsubReports = onValue(reportsRef, (snapshot) => {
      if (snapshot.exists()) {
        const reports: Report[] = []
        snapshot.forEach((child) => {
          reports.push({ id: child.key!, ...child.val() })
        })
        // Reverse to show newest first
        reports.reverse()
        setRecentReports(reports)
        
        // Count pending
        const pendingCount = reports.filter(r => r.status === 'pending').length
        setStats(prev => ({ ...prev, pendingReports: pendingCount }))
      }
      setLoading(false)
    })

    return () => {
      unsubConnections()
      unsubQueue()
      unsubChats()
      unsubReports()
    }
  }, [])

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  // Cleanup all connections (for fixing stale count)
  const cleanupAllConnections = async () => {
    if (confirm('This will remove ALL connections. Users will need to refresh. Continue?')) {
      const connectionsRef = ref(database, 'connections')
      await remove(connectionsRef)
      alert('All connections cleared. Online count should be 0.')
    }
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'harassment': return '😠'
      case 'inappropriate': return '🔞'
      case 'spam': return '🤖'
      case 'threats': return '⚠️'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #f59e0b',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard
          icon={<Users size={24} />}
          label="Online Users"
          value={stats.activeConnections}
          color="#10b981"
        />
        <StatCard
          icon={<Clock size={24} />}
          label="In Queue"
          value={stats.queueLength}
          color="#eab308"
        />
        <StatCard
          icon={<MessageCircle size={24} />}
          label="Active Chats"
          value={stats.activeChats}
          color="#6366f1"
        />
        <StatCard
          icon={<Flag size={24} />}
          label="Pending Reports"
          value={stats.pendingReports}
          color="#ef4444"
          highlight={stats.pendingReports > 0}
        />
        {stats.staleConnections > 0 && (
          <StatCard
            icon={<Activity size={24} />}
            label="Stale Connections"
            value={stats.staleConnections}
            color="#f97316"
            highlight={true}
          />
        )}
      </div>

      {/* Recent Reports */}
      <div style={{
        backgroundColor: '#12121a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flag size={20} style={{ color: '#ef4444' }} />
            Recent Reports
          </h2>
          <Link href="/admin/reports" style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontSize: '14px',
            textDecoration: 'none'
          }}>
            View All
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Activity size={48} style={{ color: '#3f3f46', marginBottom: '16px' }} />
            <p style={{ color: '#71717a' }}>No reports yet</p>
          </div>
        ) : (
          <div>
            {recentReports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: report.status === 'pending' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{getReasonIcon(report.reason)}</span>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>
                      {report.reason.charAt(0).toUpperCase() + report.reason.slice(1)}
                    </p>
                    <p style={{ color: '#71717a', fontSize: '12px' }}>
                      {formatTime(report.timestamp)} • Chat: {report.chatId.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    backgroundColor: report.status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: report.status === 'pending' ? '#ef4444' : '#10b981'
                  }}>
                    {report.status}
                  </span>
                  <Link
                    href={`/admin/reports?id=${report.id}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#a1a1aa',
                      fontSize: '12px',
                      textDecoration: 'none'
                    }}
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, highlight = false }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  highlight?: boolean
}) {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: highlight ? 'rgba(239, 68, 68, 0.1)' : '#12121a',
      border: `1px solid ${highlight ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ color: '#71717a', fontSize: '14px' }}>{label}</span>
      </div>
      <p style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{value}</p>
    </div>
  )
}
