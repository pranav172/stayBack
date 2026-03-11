/**
 * Anonymous Vibe Names
 *
 * Generates a deterministic, session-stable anonymous name from a uid seed.
 * Same user always gets the same name — consistent identity without revealing who they are.
 *
 * Industry pattern: hash-based pseudonym generation (used by Omegle, Discord for bots, etc.)
 * 80 adj × 80 nouns = 6,400 unique names — far exceeds concurrent user scale.
 */

const ADJECTIVES = [
  'Sleepy', 'Chaotic', 'Silent', 'Bold', 'Curious', 'Witty', 'Calm', 'Fuzzy',
  'Sharp', 'Lucky', 'Sneaky', 'Gentle', 'Wild', 'Clever', 'Dizzy', 'Lazy',
  'Brave', 'Grumpy', 'Jolly', 'Moody', 'Funky', 'Quirky', 'Chill', 'Hyper',
  'Shy', 'Sassy', 'Nerdy', 'Spicy', 'Cosmic', 'Midnight', 'Stormy', 'Sunny',
  'Frosty', 'Gloomy', 'Bouncy', 'Crispy', 'Dusty', 'Fluffy', 'Glitchy', 'Hollow',
  'Irked', 'Jumpy', 'Kinetic', 'Lanky', 'Mystic', 'Nocturnal', 'Oddly', 'Peppy',
  'Rowdy', 'Snarky', 'Tiny', 'Unruly', 'Vivid', 'Wobbly', 'Zesty', 'Abstract',
  'Burning', 'Cozy', 'Drifting', 'Electric', 'Foggy', 'Gleaming', 'Haunted',
  'Icy', 'Jamming', 'Kooky', 'Lurking', 'Mellow', 'Neon', 'Orbital', 'Phantom',
  'Quaint', 'Reckless', 'Static', 'Turbulent', 'Upbeat', 'Velvet', 'Wandering', 'Xenon',
]

const NOUNS = [
  'Otter', 'Engineer', 'Panther', 'Coder', 'Mango', 'Falcon', 'Noodle', 'Pixel',
  'Gecko', 'Wizard', 'Orbit', 'Byte', 'Panda', 'Spark', 'Comet', 'Penguin',
  'Raccoon', 'Llama', 'Glitch', 'Signal', 'Biscuit', 'Tadpole', 'Vortex', 'Nomad',
  'Phoenix', 'Raven', 'Cipher', 'Drifter', 'Echo', 'Firefox', 'Goblin', 'Haze',
  'Inkblot', 'Jester', 'Kestrel', 'Lemur', 'Mochi', 'Nova', 'Osprey', 'Prism',
  'Quasar', 'Ripple', 'Specter', 'Tangle', 'Umbra', 'Vertex', 'Wraith', 'Xenon',
  'Yak', 'Zephyr', 'Axon', 'Blaze', 'Crater', 'Dune', 'Ember', 'Flare',
  'Glider', 'Heron', 'Igloo', 'Jackal', 'Kelp', 'Lancer', 'Mirage', 'Nebula',
  'Oracle', 'Pulsar', 'Quill', 'Reef', 'Sable', 'Titan', 'Urchin', 'Vapor',
  'Walrus', 'Xenith', 'Yarrow', 'Zenith', 'Archer', 'Bastion', 'Condor', 'Drift',
]

/**
 * Fast non-cryptographic integer hash of a string.
 * Uses djb2 algorithm — simple, fast, good distribution.
 */
function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
    h = h >>> 0 // convert to unsigned 32-bit
  }
  return h
}

/**
 * Generate a deterministic vibe name from a user ID.
 * Same uid → same name every time.
 * Example outputs: "SleepyOtter", "ChaoticEngineer", "MidnightPanda"
 */
export function generateVibeName(uid: string): string {
  const h = hashString(uid)
  const adj = ADJECTIVES[h % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(h / ADJECTIVES.length) % NOUNS.length]
  return `${adj}${noun}`
}
