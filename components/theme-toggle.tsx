'use client'

import { useTheme } from '@/lib/theme'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ]

  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      padding: '4px',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
    }}>
      {options.map((option) => {
        const Icon = option.icon
        const isActive = theme === option.value
        
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            title={option.label}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
