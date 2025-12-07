# Stayback 💬

> **Your college. No names. Real talks.**

One-tap anonymous chat for college students stuck on campus during vacations. Match with random strangers from your college, chat anonymously, and disappear forever.

![Stayback](public/icon.png)

## ✨ Features

- 🎓 **College-Only**: Verified `.edu` email authentication
- 🎭 **Fully Anonymous**: No names, no profiles, just vibes
- ⚡ **Instant Matching**: Tap to talk, match in seconds
- 💨 **Ephemeral Chats**: Messages disappear when you leave
- 🤖 **AI Icebreakers**: Groq-powered conversation starters
- 🔥 **Roast Button**: Let AI roast your chat partner
- 📱 **PWA Ready**: Install as an app on your phone

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **AI**: Groq API (Llama 3)
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Groq API key (optional, for AI features)

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/YOUR_USERNAME/stayback.git
   cd stayback
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

3. **Database Setup**
   Run the SQL files in `supabase/` folder in order:
   - `schema.sql` - Creates tables and matching function
   - `fix_rls.sql` - Sets up Row Level Security
   - `policy_delete_chats.sql` - Cleanup policies

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
stayback/
├── app/
│   ├── page.tsx          # Landing page
│   ├── home/             # Dashboard with matching
│   ├── chat/[id]/        # Chat interface
│   ├── about/            # About the developer
│   ├── coming-soon/      # Upcoming features
│   └── admin/0x1337/     # Secret analytics (shhh)
├── components/
│   ├── auth/             # Login components
│   ├── chat/             # Chat UI & icebreakers
│   └── home/             # Match button
├── lib/supabase/         # Supabase client config
└── supabase/             # SQL schema & policies
```

## 🔒 Security

- Magic link authentication (no passwords)
- Row Level Security on all tables
- Email domain validation for college-only access
- Ephemeral chats (auto-delete on leave)

## 📈 Roadmap

- [ ] Group anonymous chats
- [ ] Crush mode (mutual confessions)
- [ ] AI moderation
- [ ] Speed dating (timed chats)

## 🤝 Contributing

PRs welcome! This is a side project built during vacation.

## 📧 Contact

Got ideas or found bugs? Email: rloveumom@gmail.com

---

Built with ❤️ and caffeine by an anonymous college dev
