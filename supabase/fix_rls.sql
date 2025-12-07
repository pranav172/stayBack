-- Drop existing policies to ensure clean slate
drop policy if exists "Read chat messages" on public.messages;
drop policy if exists "Insert messages" on public.messages;
drop policy if exists "Read own chats" on public.chats;

-- Re-create CHATS policy
-- Users can see chats they are part of
create policy "Read own chats"
on public.chats
for select
using (
  auth.uid() = user1_id or auth.uid() = user2_id
);

-- Re-create MESSAGES policies
-- 1. READ: Allow users to read messages from chats they belong to
create policy "Read chat messages"
on public.messages
for select
using (
  exists (
    select 1 from public.chats c
    where c.id = messages.chat_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- 2. INSERT: Allow users to insert messages into their active chats
create policy "Insert messages"
on public.messages
for insert
with check (
  exists (
    select 1 from public.chats c
    where c.id = messages.chat_id
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

-- Ensure Realtime is enabled for these tables (Supabase defaults, but good to be explicit if using custom SQL)
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chats;
