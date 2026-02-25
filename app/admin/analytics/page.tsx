'use client'

import { useState, useEffect } from 'react'
import { database } from '@/lib/firebase'
import { ref, onValue, remove, query, orderByChild, limitToLast } from 'firebase/database'
import {
  Users, MessageCircle, Flag, Activity, Shield,
  Trash2, TrendingUp, Clock, BarChart3, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Confession {
  id: string
  text: string
  timestamp: number
  hearts: number
  expiresAt?: number
  comments?: Record<string, { text: string; timestamp: number }>
}

interface AdminStats {
  onlineUsers: number
  staleConnections: number
  queueLength: number
  activeChats: number
  pendingReports: number
  totalConfessions: number
  activeGroupRooms: number
  peakToday: number
}

function StatCard({
  icon, label, value, color, sub, highlight = false
}: {
  icon: React.ReactNode; label: string; value: number | string
  color: string; sub?: string; highlight?: boolean
}) {
  return (
    <div style={{
      padding: '20px', borderRadius: '14px',
      backgroundColor: highlight ? `${color}15` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${highlight ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ color: '#71717a', fontSize: '13px' }}>{label}</span>
      </div>
      <p style={{ fontSize: '30px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats>({
    onlineUsers: 0, staleConnections: 0, queueLength: 0,
    activeChats: 0, pendingReports: 0, totalConfessions: 0,
    activeGroupRooms: 0, peakToday: 0,
  })
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'confessions' | 'groups'>('overview')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    const TTL = 90_000

    const unsubConnections = onValue(ref(database, 'connections'), snap => {
      if (!snap.exists()) { setStats(p => ({ ...p, onlineUsers: 0, staleConnections: 0 })); return }
      const now = Date.now()
      const entries = Object.values(snap.val()) as { lastSeen?: number }[]
      const live = entries.filter(e => ((e.lastSeen ?? 0) as number) > now - TTL).length
      setStats(p => ({ ...p, onlineUsers: live, staleConnections: entries.length - live }))
    })

    const unsubQueue = onValue(ref(database, 'queue'), snap => {
      setStats(p => ({ ...p, queueLength: snap.exists() ? Object.keys(snap.val()).length : 0 }))
    })

    const unsubChats = onValue(ref(database, 'chats'), snap => {
      if (!snap.exists()) { setStats(p => ({ ...p, activeChats: 0 })); return }
      const active = Object.values(snap.val() as Record<string, { isActive?: boolean }>)
        .filter(c => c.isActive).length
      setStats(p => ({ ...p, activeChats: active }))
    })

    const unsubReports = onValue(query(ref(database, 'reports'), orderByChild('timestamp'), limitToLast(50)), snap => {
      if (!snap.exists()) { setStats(p => ({ ...p, pendingReports: 0 })); return }
      let pending = 0
      snap.forEach(c => { if (c.val().status === 'pending') pending++ })
      setStats(p => ({ ...p, pendingReports: pending }))
      setLoading(false)
    })

    const unsubConfessions = onValue(ref(database, 'confessions'), snap => {
      setLoading(false)
      if (!snap.exists()) { setConfessions([]); setStats(p => ({ ...p, totalConfessions: 0 })); return }
      const now = Date.now()
      const list: Confession[] = Object.entries(snap.val())
        .map(([id, v]) => ({ id, ...(v as Omit<Confession, 'id'>) }))
        .filter(c => !c.expiresAt || c.expiresAt > now)
        .sort((a, b) => b.timestamp - a.timestamp)
      setConfessions(list)
      setStats(p => ({ ...p, totalConfessions: list.length }))
    })

    const unsubGroups = onValue(ref(database, 'groupChats'), snap => {
      if (!snap.exists()) { setStats(p => ({ ...p, activeGroupRooms: 0 })); return }
      const now = Date.now()
      const active = Object.values(snap.val() as Record<string, { isActive?: boolean; createdAt?: number }>)
        .filter(r => r.isActive && r.createdAt && (now - r.createdAt < 30 * 60 * 1000)).length
      setStats(p => ({ ...p, activeGroupRooms: active }))
    })

    return () => { unsubConnections(); unsubQueue(); unsubChats(); unsubReports(); unsubConfessions(); unsubGroups() }
  }, [])

  const handleDeleteConfession = async (id: string) => {
    if (!confirm('Delete this confession permanently?')) return
    setDeleting(id)
    try { await remove(ref(database, `confessions/${id}`)) }
    catch (e) { alert('Failed to delete: ' + (e instanceof Error ? e.message : e)) }
    finally { setDeleting(null) }
  }

  const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  const TABS = [
    { key: 'overview', label: '📊 Overview', icon: <BarChart3 size={16} /> },
    { key: 'confessions', label: '🕯️ Confessions', icon: <MessageCircle size={16} /> },
    { key: 'groups', label: '👥 Groups', icon: <Users size={16} /> },
  ] as const

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080810' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(8,8,16,0.96)', backdropFilter: 'blur(12px)',
        padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin" style={{ color: '#52525b', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontSize: '13px' }}>
            ← Admin
          </Link>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#f59e0b" />
            Analytics & Moderation
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#52525b' }}>
            <RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Live · {lastRefresh.toLocaleTimeString()}
          </span>
          <Link href="/admin/reports" style={{
            padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            backgroundColor: stats.pendingReports > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${stats.pendingReports > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: stats.pendingReports > 0 ? '#ef4444' : '#71717a', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Flag size={14} />
            Reports {stats.pendingReports > 0 ? `(${stats.pendingReports})` : ''}
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              backgroundColor: activeTab === tab.key ? '#f59e0b' : 'transparent',
              color: activeTab === tab.key ? '#000' : '#71717a',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
              <StatCard icon={<Users size={20} />} label="Online Now" value={stats.onlineUsers} color="#10b981" sub="TTL-filtered, live" />
              <StatCard icon={<Clock size={20} />} label="In Queue" value={stats.queueLength} color="#f59e0b" />
              <StatCard icon={<MessageCircle size={20} />} label="Active Chats" value={stats.activeChats} color="#6366f1" />
              <StatCard icon={<MessageCircle size={20} />} label="Confessions" value={stats.totalConfessions} color="#ec4899" sub="Live (≤48h)" />
              <StatCard icon={<Users size={20} />} label="Group Rooms" value={stats.activeGroupRooms} color="#f97316" sub="Active ≤30min" />
              <StatCard icon={<Flag size={20} />} label="Pending Reports" value={stats.pendingReports} color="#ef4444" highlight={stats.pendingReports > 0} />
              <StatCard icon={<Activity size={20} />} label="Stale Connections" value={stats.staleConnections} color="#71717a" sub=">90s idle" highlight={stats.staleConnections > 2} />
            </div>

            {/* Quick actions */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e4e4e7', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="#f59e0b" /> Quick Actions
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <Link href="/admin/reports" style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', textDecoration: 'none', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag size={14} /> View Reports
                </Link>
                <button onClick={() => setActiveTab('confessions')} style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={14} /> Moderate Confessions
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── CONFESSIONS ── */}
        {activeTab === 'confessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e4e4e7', margin: 0 }}>
                🕯️ Confession Wall — {confessions.length} active
              </h2>
              <span style={{ fontSize: '12px', color: '#52525b' }}>Sorted newest first · Delete = permanent</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#52525b' }}>Loading...</div>
            ) : confessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px', color: '#52525b' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕯️</div>
                <p>No active confessions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {confessions.map(c => {
                  const commentCount = c.comments ? Object.keys(c.comments).length : 0
                  const expiresIn = c.expiresAt ? Math.max(0, c.expiresAt - Date.now()) : null
                  const expiresHours = expiresIn ? Math.floor(expiresIn / 3600000) : null
                  return (
                    <div key={c.id} style={{
                      backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)', padding: '16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <p style={{ color: '#e4e4e7', fontSize: '14px', lineHeight: 1.6, margin: 0, flex: 1 }}>
                          &ldquo;{c.text}&rdquo;
                        </p>
                        <button
                          onClick={() => handleDeleteConfession(c.id)}
                          disabled={deleting === c.id}
                          style={{
                            padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                            backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: '4px',
                            opacity: deleting === c.id ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={13} />
                          {deleting === c.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#52525b' }}>🕐 {timeAgo(c.timestamp)}</span>
                        <span style={{ fontSize: '11px', color: '#52525b' }}>❤️ {c.hearts || 0} hearts</span>
                        {commentCount > 0 && <span style={{ fontSize: '11px', color: '#52525b' }}>💬 {commentCount} comments</span>}
                        {expiresHours !== null && (
                          <span style={{ fontSize: '11px', color: expiresHours < 6 ? '#f97316' : '#52525b' }}>
                            ⏳ expires in {expiresHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── GROUPS ── */}
        {activeTab === 'groups' && (
          <div style={{ textAlign: 'center', padding: '64px', color: '#52525b' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
            <p style={{ fontSize: '16px', color: '#71717a' }}>{stats.activeGroupRooms} active group rooms right now.</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Group rooms auto-expire after 30min. No manual cleanup needed.</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
