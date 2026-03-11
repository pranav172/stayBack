# mujAnon Setup Guide

## 1. Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Enable **Realtime Database** (Start in test mode, then apply `database.rules.json`)
3. Enable **Anonymous Authentication** (Authentication → Sign-in method → Anonymous)
4. Copy your config from Project Settings → General → Your apps

### Environment Variables

Create `.env.local` with:

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

## 2. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. You should see 1 user online (yourself).

## 3. Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in Vercel dashboard
4. Deploy

## 4. Cloud Functions (Optional)

Requires Firebase **Blaze** (pay-as-you-go) plan.

```bash
cd functions
npm install
firebase deploy --only functions
```

Handles: confession cleanup (48h TTL), group room cleanup (30min TTL), chat cleanup (24h TTL).

Without functions, no automatic cleanup occurs — expired data stays in Firebase until manually deleted.
