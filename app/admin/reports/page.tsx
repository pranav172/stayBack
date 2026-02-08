'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { database } from '@/lib/firebase'
import { ref, onValue, query, orderByChild, update, get } from 'firebase/database'
import { Flag, ArrowLeft, AlertTriangle, Clock, Ban, MessageCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Message {
  senderId: string
  text: string
  timestamp: number
}

interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  chatId: string
  reason: string
  additionalInfo?: string
  messages?: Message[]
  timestamp: number
  status: string
  deviceId?: string
}

function ReportsPageInner() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending')
  const searchParams = useSearchParams()

  useEffect(() => {
    const reportsRef = query(ref(database, 'reports'), orderByChild('timestamp'))
    const unsubReports = onValue(reportsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allReports: Report[] = []
        snapshot.forEach((child) => {
          allReports.push({ id: child.key!, ...child.val() })
        })
        // Reverse to show newest first
        allReports.reverse()
        setReports(allReports)
      }
      setLoading(false)
    })

    // Check URL for specific report
    const reportId = searchParams.get('id')
    if (reportId) {
      setExpandedReport(reportId)
    }

    return () => unsubReports()
  }, [searchParams])

  const handleAction = async (reportId: string, action: 'dismiss' | 'warn' | 'ban_1h' | 'ban_24h' | 'ban_7d' | 'ban_permanent') => {
    setActionLoading(reportId)
    
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) return

      // Update report status
      await update(ref(database, `reports/${reportId}`), {
        status: action === 'dismiss' ? 'dismissed' : 'actioned',
        actionTaken: action,
        actionAt: Date.now()
      })

      // If banning, update the device ban
      if (action !== 'dismiss' && action !== 'warn') {
        const banDurations: Record<string, number> = {
          'ban_1h': 60 * 60 * 1000,
          'ban_24h': 24 * 60 * 60 * 1000,
          'ban_7d': 7 * 24 * 60 * 60 * 1000,
          'ban_permanent': 100 * 365 * 24 * 60 * 60 * 1000 // 100 years
        }
        
        const duration = banDurations[action]
        const bannedUntil = Date.now() + duration

        // Try to find device ID from report or user's devices
        if (report.deviceId) {
          await update(ref(database, `devices/${report.deviceId}`), {
            bannedUntil,
            banReason: `Banned for: ${report.reason}`,
            bannedAt: Date.now()
          })
        }

        // Also add to bans collection for tracking
        await update(ref(database, `bans/${report.reportedUserId}`), {
          odUserId: report.reportedUserId,
          deviceId: report.deviceId || null,
          bannedUntil,
          reason: report.reason,
          reportId,
          bannedAt: Date.now()
        })
      }

      setExpandedReport(null)
    } catch (error) {
      console.error('Action failed:', error)
      alert('Failed to perform action')
    } finally {
      setActionLoading(null)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      harassment: '😠 Harassment',
      inappropriate: '🔞 Inappropriate',
      spam: '🤖 Spam / Bot',
      threats: '⚠️ Threats',
      other: '❓ Other'
    }
    return labels[reason] || reason
  }

  const filteredReports = reports.filter(r => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'reviewed') return r.status !== 'pending'
    return true
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #6366f1',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/admin" style={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Back
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>
          Reports
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['pending', 'reviewed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: filter === f ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
              border: filter === f ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: filter === f ? '#818cf8' : '#71717a',
              fontSize: '14px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {f} {f === 'pending' && `(${reports.filter(r => r.status === 'pending').length})`}
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#12121a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <Flag size={48} style={{ color: '#3f3f46', marginBottom: '16px' }} />
          <p style={{ color: '#71717a' }}>No {filter !== 'all' ? filter : ''} reports</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReports.map((report) => (
            <div
              key={report.id}
              style={{
                backgroundColor: '#12121a',
                border: `1px solid ${report.status === 'pending' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {/* Report Header */}
              <button
                onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {report.reason === 'harassment' && '😠'}
                    {report.reason === 'inappropriate' && '🔞'}
                    {report.reason === 'spam' && '🤖'}
                    {report.reason === 'threats' && '⚠️'}
                    {report.reason === 'other' && '❓'}
                  </span>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>
                      {getReasonLabel(report.reason)}
                    </p>
                    <p style={{ color: '#52525b', fontSize: '12px' }}>
                      {formatTime(report.timestamp)}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                  {expandedReport === report.id ? <ChevronUp size={20} style={{ color: '#71717a' }} /> : <ChevronDown size={20} style={{ color: '#71717a' }} />}
                </div>
              </button>

              {/* Expanded Details */}
              {expandedReport === report.id && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
                  {/* Additional Info */}
                  {report.additionalInfo && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}>Additional Details:</p>
                      <p style={{ color: '#a1a1aa', fontSize: '14px', fontStyle: 'italic' }}>"{report.additionalInfo}"</p>
                    </div>
                  )}

                  {/* Chat Context */}
                  {report.messages && report.messages.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageCircle size={14} /> Chat Context:
                      </p>
                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {report.messages.map((msg, i) => (
                          <div
                            key={i}
                            style={{
                              marginBottom: '8px',
                              padding: '8px',
                              borderRadius: '6px',
                              backgroundColor: msg.senderId === report.reportedUserId ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            <p style={{ color: msg.senderId === report.reportedUserId ? '#ef4444' : '#a1a1aa', fontSize: '13px' }}>
                              {msg.senderId === report.reportedUserId ? '🚩 Reported User' : '👤 Reporter'}:
                            </p>
                            <p style={{ color: '#fff', fontSize: '14px' }}>{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IDs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <p style={{ color: '#52525b', fontSize: '11px' }}>Reporter ID:</p>
                      <p style={{ color: '#71717a', fontSize: '12px', fontFamily: 'monospace' }}>{report.reporterId}</p>
                    </div>
                    <div>
                      <p style={{ color: '#52525b', fontSize: '11px' }}>Reported User ID:</p>
                      <p style={{ color: '#71717a', fontSize: '12px', fontFamily: 'monospace' }}>{report.reportedUserId}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <ActionButton
                        onClick={() => handleAction(report.id, 'dismiss')}
                        loading={actionLoading === report.id}
                        color="#52525b"
                        label="Dismiss"
                      />
                      <ActionButton
                        onClick={() => handleAction(report.id, 'warn')}
                        loading={actionLoading === report.id}
                        color="#eab308"
                        label="⚠️ Warn"
                      />
                      <ActionButton
                        onClick={() => handleAction(report.id, 'ban_1h')}
                        loading={actionLoading === report.id}
                        color="#f97316"
                        label="🚫 Ban 1h"
                      />
                      <ActionButton
                        onClick={() => handleAction(report.id, 'ban_24h')}
                        loading={actionLoading === report.id}
                        color="#ef4444"
                        label="🚫 Ban 24h"
                      />
                      <ActionButton
                        onClick={() => handleAction(report.id, 'ban_7d')}
                        loading={actionLoading === report.id}
                        color="#dc2626"
                        label="🚫 Ban 7d"
                      />
                      <ActionButton
                        onClick={() => handleAction(report.id, 'ban_permanent')}
                        loading={actionLoading === report.id}
                        color="#991b1b"
                        label="☠️ Permanent"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionButton({ onClick, loading, color, label }: {
  onClick: () => void
  loading: boolean
  color: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        backgroundColor: `${color}20`,
        border: `1px solid ${color}50`,
        color: color,
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1
      }}
    >
      {label}
    </button>
  )
}

// Wrapper with Suspense for Next.js SSR compatibility
export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
      </div>
    }>
      <ReportsPageInner />
    </Suspense>
  )
}
