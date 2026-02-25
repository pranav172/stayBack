# mujAnon 💬 — Beta v2.0

> **Your college. No names. Real talks.**

Anonymous chat platform for MUJ (Manipal University Jaipur) students. Match with random strangers, confess anonymously on the wall, or jump into a group room — zero profiles, zero judgment.

---

## ✨ What's New in v2.0

- 🕯️ **Confession Wall** — Swipeable anonymous confessions with 48h TTL, hearts & comments
- 👥 **Group Rooms** — Up to 4 anonymous users, 30-min rooms
- 🔒 **Shadowban System** — Device-level shadowbanning for bad actors  
- 🛡️ **Content Moderation** — Server + client-side filtering
- 🔔 **Anonymous Reply** — Connect back to a confession author anonymously
- 📊 **Admin Dashboard** — Live analytics, moderation queue, confession management
- 📱 **PWA** — Install as a native-feeling app on iOS/Android
- ⚡ **Realtime** — Firebase RTDB WebSocket-based, no polling

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), TypeScript |
| **Realtime DB** | Firebase Realtime Database |
| **Auth** | Firebase Anonymous Auth |
| **Server Functions** | Firebase Cloud Functions (scheduled TTL cleanup) |
| **Hosting** | Vercel (frontend) + Firebase (RTDB + Functions) |
| **Moderation** | Client-side word filter + Cloud Function validation |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase project (Blaze plan required for Cloud Functions)
- Firebase CLI: `npm install -g firebase-tools`

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/mujanon.git
cd mujanon

# Install dependencies
npm install

# Copy env template
cp .env.local.example .env.local
# Fill in your Firebase config values
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Deploy Database Rules

```bash
firebase deploy --only database
```

### Run Development Server

```bash
npm run dev
```

---

## 📁 Project Structure

```
app/
├── page.tsx              # Landing page
├── chat/[id]/            # 1-on-1 anonymous chat
├── confessions/          # Swipeable confession wall
├── groups/               # Anonymous group rooms (4-max)
├── admin/analytics/      # Admin dashboard
├── privacy/              # Privacy policy
└── terms/                # Terms of service
components/
├── match-button.tsx      # Main matching CTA
├── connection-provider   # Firebase auth context
├── theme-toggle.tsx      # Light/dark/system toggle
└── chat/                 # Chat UI components
lib/
├── firebase.ts           # Firebase init
├── shadowban.ts          # Device-level ban checks
├── moderation.ts         # Content filtering
└── email-verification.ts # MUJ email gate
functions/src/index.ts    # Cloud Functions (cleanup + admin)
database.rules.json       # Firebase RTDB security rules
public/
├── manifest.json         # PWA manifest
└── sw.js                 # Service worker
```

---

## 🔒 Security Model

- **Anonymous Auth** — Firebase Anonymous Auth auto-signs in users; no email/password needed
- **Device Fingerprinting** — Shadowban persists across sessions via device ID in localStorage
- **Content Moderation** — Two layers: client-side regex filter + Cloud Function server validation
- **Rate Limiting** — Max 3 confessions/day per device, 60 messages/min per user
- **RTDB Rules** — Users can only read/write their own data; confessions are append-only for auth users
- **MUJ-only** — Email verification gate for `.muj.edu.in` addresses

---

## 🗑️ Auto-Cleanup (TTL)

Scheduled Cloud Functions handle all data expiry:

| Data | TTL | Cleanup Frequency |
|------|-----|-------------------|
| Confessions | 48 hours | Every 6 hours |
| Group Rooms + Messages | 30 minutes | Every 30 minutes |
| 1-on-1 Chats | 24 hours | Every 6 hours |
| Reports (resolved) | 7 days | Every 24 hours |

> **Note:** Functions deployment requires Firebase Blaze (pay-as-you-go) plan.

---

## 📱 PWA Installation

The app is installable as a PWA. On mobile:
- **Android**: "Add to Home Screen" in Chrome menu
- **iOS**: Share → "Add to Home Screen" in Safari

---

## 📈 Roadmap (v2.1+)

- [ ] Anonymous direct connect from Confession Wall (mutual opt-in)
- [ ] Push notifications for confession replies
- [ ] Razorpay integration for extended confession slots (₹49/day)
- [ ] MUJ year/branch filter on matching
- [ ] Confession leaderboard (most-hearted)

---

## 🐛 Known Limitations

- Firebase Functions need Blaze plan (upgrade at [console.firebase.google.com](https://console.firebase.google.com))
- No real-time push notifications yet (FCM VAPID key required)
- Supabase directory exists but is unused — legacy from v1.0, safe to delete

---

Built with ❤️ and caffeine · mujAnon Beta v2.0
