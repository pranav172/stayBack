'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { database, auth } from '@/lib/firebase'
import { ref, push, set, onValue, remove, serverTimestamp } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import { Send, Instagram, ArrowLeft, Users, Check, X, Ghost, Flag, SkipForward, Clock, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { moderateMessage, getWarningMessage, CHAT_LIMITS, formatTimeRemaining } from '@/lib/moderation'
import ReportModal from './report-modal'
import FeedbackModal from './feedback-modal'

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: number
}

export default function ChatInterface({ chatId, currentUserId }: { chatId: string, currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [partnerOnline, setPartnerOnline] = useState(true)
  const [onlineCount, setOnlineCount] = useState(0)
  const [showSocialInput, setShowSocialInput] = useState<'insta' | 'snap' | null>(null)
  const [socialUsername, setSocialUsername] = useState('')
  const [shared, setShared] = useState<{ insta: boolean, snap: boolean }>({ insta: false, snap: false })
  const [userId, setUserId] = useState<string | null>(currentUserId)
  const [chatEnded, setChatEnded] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState(0)
  
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now())
  const [timeRemaining, setTimeRemaining] = useState(CHAT_LIMITS.SESSION_DURATION_MS)
  const [messageCount, setMessageCount] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [lastPartnerMessageTime, setLastPartnerMessageTime] = useState<number>(Date.now())
  const [showInactivityNudge, setShowInactivityNudge] = useState(false)
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false)
  const [sessionExtended, setSessionExtended] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const sessionId = useRef<string>('')
  const partnerSessionRef = useRef<string | null>(null)

  useEffect(() => {
    let sid = sessionStorage.getItem('stayback_session_id')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('stayback_session_id', sid)
    }
    sessionId.current = sid
  }, [])

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime
      const remaining = CHAT_LIMITS.SESSION_DURATION_MS - elapsed
      setTimeRemaining(remaining)
      if (remaining <= 0) {
        setChatEnded(true)
        setShowFeedbackModal(true)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [sessionStartTime])

  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastPartnerMessageTime
      if (timeSinceLastMessage >= CHAT_LIMITS.INACTIVITY_OFFER_MS && messages.length > 0) {
        setShowInactivityNudge(true)
      } else if (timeSinceLastMessage >= CHAT_LIMITS.INACTIVITY_NUDGE_MS && messages.length === 0) {
        setShowInactivityNudge(true)
      }
    }, 10000)
    return () => clearInterval(checkInactivity)
  }, [lastPartnerMessageTime, messages.length])

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid)
    })

    const messagesRef = ref(database, `messages/${chatId}`)
    const unsubMessages = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const messageList: Message[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp)
        setMessages(messageList)
        setMessageCount(messageList.filter(m => m.senderId === userId).length)
        
        const partnerMessages = messageList.filter(m => m.senderId !== userId)
        if (partnerMessages.length > 0) {
          const lastPartnerMsg = partnerMessages[partnerMessages.length - 1]
          setLastPartnerMessageTime(lastPartnerMsg.timestamp)
          setShowInactivityNudge(false)
        }
      }
    })

    const chatRef = ref(database, `chats/${chatId}`)
    const unsubChat = onValue(chatRef, async (snapshot) => {
      if (snapshot.exists()) {
        const chat = snapshot.val()
        if (chat.user1 === currentUserId) {
          setPartnerId(chat.user2)
        } else {
          setPartnerId(chat.user1)
        }
        if (!chat.isActive) {
          setChatEnded(true)
          setPartnerOnline(false)
          setShowFeedbackModal(true)
          return
        }
        const mySession = sessionId.current
        if (chat.session1 === mySession) {
          partnerSessionRef.current = chat.session2
        } else if (chat.session2 === mySession) {
          partnerSessionRef.current = chat.session1
        }
        if (partnerSessionRef.current) {
          const partnerConnRef = ref(database, `connections/${partnerSessionRef.current}`)
          onValue(partnerConnRef, (connSnap) => {
            setPartnerOnline(connSnap.exists())
          })
        }
      } else {
        setChatEnded(true)
        setPartnerOnline(false)
      }
    })

    const connectionsRef = ref(database, 'connections')
    const unsubConnections = onValue(connectionsRef, (snapshot) => {
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0
      setOnlineCount(count)
    })

    setTimeout(() => scrollToBottom('auto'), 100)

    return () => {
      unsubAuth()
      unsubMessages()
      unsubChat()
      unsubConnections()
    }
  }, [chatId, currentUserId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => setShowWarning(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showWarning])

  const handleSend = async () => {
    if (!inputText.trim() || !userId || chatEnded) return
    const now = Date.now()
    if (now - lastMessageTime < CHAT_LIMITS.MESSAGE_RATE_LIMIT_MS) {
      setWarningMessage('Slow down! Wait a moment before sending.')
      setShowWarning(true)
      return
    }
    if (messageCount >= CHAT_LIMITS.MAX_MESSAGES_PER_SESSION) {
      setWarningMessage('Message limit reached for this session.')
      setShowWarning(true)
      return
    }
    const moderationResult = moderateMessage(inputText)
    if (!moderationResult.isClean) {
      if (moderationResult.shouldWarn) {
        setWarningMessage(getWarningMessage(moderationResult.reason))
        setShowWarning(true)
      }
      return
    }
    setLastMessageTime(now)
    const textPayload = inputText
    setInputText('')
    const messageRef = push(ref(database, `messages/${chatId}`))
    await set(messageRef, {
      senderId: userId,
      text: textPayload,
      timestamp: Date.now()
    })
  }

  const handleShareSocial = async (platform: 'insta' | 'snap') => {
    if (!socialUsername.trim() || !userId) return
    const emoji = platform === 'insta' ? '📸' : '👻'
    const name = platform === 'insta' ? 'Instagram' : 'Snapchat'
    const message = `${emoji} My ${name}: @${socialUsername.replace('@', '')}`
    setShowSocialInput(null)
    setSocialUsername('')
    setShared(prev => ({ ...prev, [platform]: true }))
    const messageRef = push(ref(database, `messages/${chatId}`))
    await set(messageRef, {
      senderId: userId,
      text: message,
      timestamp: Date.now()
    })
  }

  const handleStop = async () => {
    if (chatId) {
      await set(ref(database, `chats/${chatId}/isActive`), false)
    }
    router.push('/')
  }

  const handleNext = useCallback(async () => {
    if (nextButtonDisabled) return
    setNextButtonDisabled(true)
    setTimeout(() => setNextButtonDisabled(false), CHAT_LIMITS.NEXT_BUTTON_COOLDOWN_MS)
    if (chatId) {
      await set(ref(database, `chats/${chatId}/isActive`), false)
    }
    router.push('/?autoMatch=true')
  }, [chatId, nextButtonDisabled, router])

  const handleExtendSession = () => {
    if (sessionExtended) return
    setSessionStartTime(Date.now() - (CHAT_LIMITS.SESSION_DURATION_MS - 5 * 60 * 1000))
    setSessionExtended(true)
  }

  const handleFindNew = () => {
    router.push('/?autoMatch=true')
  }

  const isTimeWarning = timeRemaining <= CHAT_LIMITS.WARNING_THRESHOLD_MS && timeRemaining > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0f', overflow: 'hidden' }}>
      
      {/* Header */}
      <header style={{ 
        flexShrink: 0, 
        height: '56px', 
        padding: '0 16px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: 'rgba(18, 18, 26, 0.9)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleStop}
            style={{ 
              padding: '8px', 
              borderRadius: '50%', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            backgroundColor: partnerOnline ? '#10b981' : '#ef4444',
            boxShadow: partnerOnline ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
          }} />
          <span style={{ fontWeight: 500, color: '#ffffff' }}>
            {partnerOnline ? 'MUJian Online' : 'Disconnected'}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '12px', 
            padding: '6px 12px', 
            borderRadius: '20px',
            backgroundColor: isTimeWarning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
            color: isTimeWarning ? '#ef4444' : '#71717a'
          }}>
            <Clock size={12} />
            <span style={{ fontFamily: 'monospace' }}>{formatTimeRemaining(timeRemaining)}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '12px', 
            padding: '6px 12px', 
            borderRadius: '20px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#71717a'
          }}>
            <Users size={12} />
            <span>{onlineCount}</span>
          </div>
          
          {!shared.insta && !chatEnded && (
            <button 
              onClick={() => setShowSocialInput(showSocialInput === 'insta' ? null : 'insta')}
              style={{ 
                padding: '8px', 
                borderRadius: '50%', 
                background: showSocialInput === 'insta' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.05)', 
                border: 'none', 
                cursor: 'pointer',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Instagram size={18} />
            </button>
          )}
          
          {!shared.snap && !chatEnded && (
            <button 
              onClick={() => setShowSocialInput(showSocialInput === 'snap' ? null : 'snap')}
              style={{ 
                padding: '8px', 
                borderRadius: '50%', 
                background: showSocialInput === 'snap' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)', 
                border: 'none', 
                cursor: 'pointer',
                color: '#eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ghost size={18} />
            </button>
          )}
          
          <button 
            onClick={() => setShowReportModal(true)}
            style={{ 
              padding: '8px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              cursor: 'pointer',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Flag size={16} />
          </button>
          
          <button 
            onClick={handleNext}
            disabled={nextButtonDisabled}
            style={{ 
              padding: '6px 12px', 
              borderRadius: '20px', 
              background: nextButtonDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.2)', 
              border: 'none', 
              cursor: nextButtonDisabled ? 'not-allowed' : 'pointer',
              color: nextButtonDisabled ? '#52525b' : '#818cf8',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: nextButtonDisabled ? 0.5 : 1
            }}
          >
            <SkipForward size={14} />
            Next
          </button>
        </div>
      </header>

      {/* Warning Banner */}
      {showWarning && (
        <div style={{ 
          flexShrink: 0, 
          backgroundColor: 'rgba(234, 179, 8, 0.1)', 
          borderBottom: '1px solid rgba(234, 179, 8, 0.2)', 
          padding: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          color: '#eab308', 
          fontSize: '14px' 
        }}>
          <AlertTriangle size={16} />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Time Warning */}
      {isTimeWarning && !chatEnded && (
        <div style={{ 
          flexShrink: 0, 
          backgroundColor: 'rgba(249, 115, 22, 0.1)', 
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)', 
          padding: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          color: '#f97316', 
          fontSize: '14px' 
        }}>
          <Clock size={16} />
          <span>{formatTimeRemaining(timeRemaining)} remaining!</span>
          {!sessionExtended && (
            <button 
              onClick={handleExtendSession}
              style={{ 
                marginLeft: '8px', 
                padding: '4px 12px', 
                backgroundColor: '#6366f1', 
                color: '#fff', 
                fontSize: '12px', 
                borderRadius: '20px', 
                border: 'none', 
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              +5 mins
            </button>
          )}
        </div>
      )}

      {/* Social Input */}
      {showSocialInput && (
        <div style={{ 
          flexShrink: 0, 
          padding: '12px', 
          borderBottom: '1px solid rgba(255,255,255,0.08)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          backgroundColor: showSocialInput === 'insta' ? 'rgba(236, 72, 153, 0.05)' : 'rgba(234, 179, 8, 0.05)'
        }}>
          {showSocialInput === 'insta' ? (
            <Instagram size={18} color="#ec4899" />
          ) : (
            <Ghost size={18} color="#eab308" />
          )}
          <input
            type="text"
            value={socialUsername}
            onChange={(e) => setSocialUsername(e.target.value)}
            placeholder={`Your ${showSocialInput === 'insta' ? 'Instagram' : 'Snapchat'} username`}
            onKeyDown={(e) => e.key === 'Enter' && handleShareSocial(showSocialInput)}
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              color: '#fff',
              outline: 'none'
            }}
          />
          <button 
            onClick={() => handleShareSocial(showSocialInput)}
            disabled={!socialUsername.trim()}
            style={{ 
              padding: '8px', 
              borderRadius: '8px', 
              backgroundColor: showSocialInput === 'insta' ? '#ec4899' : '#eab308', 
              border: 'none', 
              cursor: socialUsername.trim() ? 'pointer' : 'not-allowed',
              color: '#fff',
              opacity: socialUsername.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Check size={16} />
          </button>
          <button 
            onClick={() => setShowSocialInput(null)}
            style={{ 
              padding: '8px', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              cursor: 'pointer',
              color: '#71717a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Partner Left */}
      {(!partnerOnline || chatEnded) && !showFeedbackModal && (
        <div style={{ 
          flexShrink: 0, 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)', 
          padding: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          color: '#ef4444', 
          fontSize: '14px' 
        }}>
          <span>MUJian disconnected</span>
          <button 
            onClick={handleNext} 
            style={{ 
              marginLeft: '8px', 
              padding: '4px 12px', 
              backgroundColor: '#6366f1', 
              color: '#fff', 
              fontSize: '12px', 
              borderRadius: '20px', 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Find New
          </button>
        </div>
      )}

      {/* Inactivity Nudge */}
      {showInactivityNudge && partnerOnline && !chatEnded && (
        <div style={{ 
          flexShrink: 0, 
          backgroundColor: 'rgba(99, 102, 241, 0.1)', 
          borderBottom: '1px solid rgba(99, 102, 241, 0.2)', 
          padding: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '8px', 
          color: '#818cf8', 
          fontSize: '14px' 
        }}>
          <span>{messages.length === 0 ? "Say hi 👋 to break the ice!" : "Conversation feels quiet. Try something fun!"}</span>
          <button 
            onClick={() => setShowInactivityNudge(false)} 
            style={{ 
              marginLeft: '8px', 
              padding: '4px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: '14px' }}>
            <p>Say hi to your fellow MUJian! 👋</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#3f3f46' }}>Be respectful. Chats can be reported.</p>
          </div>
        )}
        
        {!messages.length && <div style={{ flex: 1 }} />}

        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          {messages.map((msg) => {
            const isMe = msg.senderId === userId
            const isInsta = msg.text.includes('📸 My Instagram:')
            const isSnap = msg.text.includes('👻 My Snapchat:')
            const isSocial = isInsta || isSnap
            
            let bgStyle: React.CSSProperties = {}
            if (isSocial) {
              if (isInsta) {
                bgStyle = { background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff' }
              } else {
                bgStyle = { background: 'linear-gradient(135deg, #eab308, #f59e0b)', color: '#000' }
              }
            } else if (isMe) {
              bgStyle = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }
            } else {
              bgStyle = { backgroundColor: 'rgba(26, 26, 37, 0.8)', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.08)' }
            }
            
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                <div style={{ 
                  maxWidth: '80%', 
                  padding: '10px 16px', 
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', 
                  fontSize: '15px',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  ...bgStyle
                }}>
                  {msg.text}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ 
        flexShrink: 0, 
        backgroundColor: 'rgba(18, 18, 26, 0.9)', 
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)', 
        padding: '12px 16px 24px' 
      }}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', gap: '8px', alignItems: 'center', maxWidth: '640px', margin: '0 auto' }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={partnerOnline && !chatEnded ? "Type a message..." : "Chat ended..."}
            disabled={!partnerOnline || chatEnded}
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '24px', 
              padding: '12px 20px', 
              fontSize: '15px',
              color: '#fff',
              outline: 'none',
              opacity: (!partnerOnline || chatEnded) ? 0.5 : 1
            }}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || !partnerOnline || chatEnded}
            style={{ 
              padding: '12px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
              border: 'none', 
              cursor: (!inputText.trim() || !partnerOnline || chatEnded) ? 'not-allowed' : 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (!inputText.trim() || !partnerOnline || chatEnded) ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Send size={20} />
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: '#3f3f46' }}>
            {messageCount}/{CHAT_LIMITS.MAX_MESSAGES_PER_SESSION} messages
          </span>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        chatId={chatId}
        reporterId={userId || ''}
        reportedUserId={partnerId || ''}
        messages={messages}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        chatId={chatId}
        userId={userId || ''}
        onFindNew={handleFindNew}
      />
    </div>
  )
}
