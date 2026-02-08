'use client'

import { ChevronRight } from 'lucide-react'

export type ChatMode = 'platonics' | 'study' | 'random'

interface ModeOption {
  id: ChatMode
  emoji: string
  title: string
  description: string
}

const MODES: ModeOption[] = [
  {
    id: 'platonics',
    emoji: '🤝',
    title: 'Platonics First',
    description: 'Make friends. No pressure.',
  },
  {
    id: 'study',
    emoji: '📚',
    title: 'Study Mode',
    description: 'Find a study buddy from your course.',
  },
  {
    id: 'random',
    emoji: '🎲',
    title: 'Random',
    description: 'Just vibes. Match with anyone.',
  }
]

interface ModeSelectionProps {
  selectedMode: ChatMode
  onModeSelect: (mode: ChatMode) => void
  onContinue: () => void
}

export default function ModeSelection({ selectedMode, onModeSelect, onContinue }: ModeSelectionProps) {
  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Choose Your Vibe</h2>
        <p style={{ color: '#71717a', fontSize: '14px' }}>How do you want to connect today?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id
          return (
            <button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '12px', 
                border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.08)', 
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {mode.emoji}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, color: isSelected ? '#fff' : '#a1a1aa', marginBottom: '2px' }}>
                  {mode.title}
                </h3>
                <p style={{ fontSize: '14px', color: isSelected ? '#a1a1aa' : '#52525b' }}>
                  {mode.description}
                </p>
              </div>

              {isSelected && (
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={onContinue}
        style={{ 
          width: '100%', 
          padding: '16px 24px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          color: '#fff',
          fontWeight: 600,
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
        }}
      >
        Continue
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
