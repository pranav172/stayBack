'use client'

import { X } from 'lucide-react'

const AVAILABLE_TAGS = [
  'Engineering', 'Law', 'Business', 'Arts',
  'Gaming', 'Music', 'Anime', 'Sports',
  'Tech', 'Movies', 'Books', 'Photography',
  'Travel', 'Food', 'Fitness', 'Memes'
]

interface InterestTagsProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export default function InterestTags({ selectedTags, onTagsChange }: InterestTagsProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 3) {
      onTagsChange([...selectedTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag))
  }

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Your Interests</h2>
        <p style={{ color: '#71717a', fontSize: '14px' }}>Pick up to 3 to find better matches</p>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
          {selectedTags.map(tag => (
            <div 
              key={tag}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: 0,
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {AVAILABLE_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag)
          const isDisabled = selectedTags.length >= 3 && !isSelected
          
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              disabled={isDisabled}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                color: isSelected ? '#a5b4fc' : isDisabled ? '#3f3f46' : '#71717a',
                fontSize: '14px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Counter */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span style={{ fontSize: '12px', color: selectedTags.length >= 3 ? '#818cf8' : '#52525b' }}>
          {selectedTags.length}/3 selected
        </span>
      </div>
    </div>
  )
}
