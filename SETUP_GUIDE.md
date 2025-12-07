# Stayback Launch Setup Guide

This guide will help you get your credentials and set up the database.

## 1. Supabase Setup (Database & Realtime)
**Supabase** is the backend that hosts your database and handles the live online counter. The "SQL Editor" is part of their website.

### Step A: Create Project
1. Go to [supabase.com](https://supabase.com) and click **"Start your project"**.
2. Sign in with GitHub.
3. Click **"New Project"**.
4. Fill in the details:
   - **Name**: Stayback
   - **Database Password**: (Make one up and save it, though we won't need it for this app immediately)
   - **Region**: Choose `Mumbai` (for lowest latency in India) or `Singapore`.
5. Click **"Create new project"**. It will take ~2 minutes to set up.

### Step B: Get Keys
1. Once your project is ready, look at the left sidebar.
2. Go to **Settings** (Gear icon) ⚙️ > **API**.
3. You will see:
   - **Project URL**: (e.g., `https://xyzcsv.supabase.co`) -> This is your `NEXT_PUBLIC_SUPABASE_URL`.
   - **Project API keys** (anon/public): click 'reveal' -> This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy these into your `.env.local` file.

### Step C: Run SQL Schema
1. In the Supabase Dashboard left sidebar, click on the **SQL Editor** icon (looks like a terminal `>_`).
2. Click **"New query"** (top left).
3. Open the `supabase/schema.sql` file in your VS Code.
4. **Copy all the code** from that file.
5. **Paste it** into the Supabase SQL Editor box on the website.
6. Click the big green **RUN** button (bottom right of the editor).
7. You should see "Success" in the results area. Your database is now ready!

## 2. Groq Setup (AI Features)
**Groq** provides the super-fast AI for icebreakers.

1. Go to [console.groq.com](https://console.groq.com).
2. Login with Google/GitHub.
3. In the left menu, go to **"API Keys"**.
4. Click **"Create API Key"**.
5. Give it a name like "Stayback".
6. Copy the key (starts with `gsk_...`).
7. Paste this as `GROQ_API_KEY` in your `.env.local` file.

## 3. Verify
After setting these up and running the app with `npm run dev`:
- The **Online Counter** should show "1 online" (you).
- **Tap to Talk** should show "Searching..." (it won't find anyone else since you are alone, but it proves the DB connection works).
