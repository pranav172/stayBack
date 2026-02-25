/**
 * Web Audio API sound utilities for mujAnon.
 * No external files — all sounds are synthesized programmatically.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext()
    } catch {
      return null
    }
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  gainValue = 0.3,
  type: OscillatorType = 'sine',
  startDelay = 0
) {
  const ctx = getCtx()
  if (!ctx) return
  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay)
    gainNode.gain.setValueAtTime(0, ctx.currentTime + startDelay)
    gainNode.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + startDelay + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration)
    oscillator.start(ctx.currentTime + startDelay)
    oscillator.stop(ctx.currentTime + startDelay + duration)
  } catch {
    // Silently fail if audio context is suspended
  }
}

/**
 * Soft "pop" notification when a new message arrives.
 * Only plays when the tab is not focused.
 */
export function playMessageSound() {
  if (document.visibilityState === 'visible') return
  playTone(880, 0.15, 0.2, 'sine')
  playTone(1100, 0.1, 0.15, 'sine', 0.1)
}

/**
 * Upbeat "ding" when a match is found.
 */
export function playMatchSound() {
  playTone(440, 0.1, 0.25, 'sine')
  playTone(554, 0.1, 0.25, 'sine', 0.1)
  playTone(659, 0.2, 0.25, 'sine', 0.2)
}

/**
 * Subtle click when sent (optional, callers decide).
 */
export function playSendSound() {
  playTone(440, 0.05, 0.1, 'triangle')
}

/**
 * Unlock AudioContext on first user gesture (required by browsers).
 */
export function unlockAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}
