-- User provided schema + Matching Logic

-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- USERS (Profiles)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  college_domain text,
  gender text,
  staying_this_break boolean,
  insta_username text,
  banned_until timestamptz,
  created_at timestamptz default now()
);

-- QUEUE / ACTIVE USERS
create table public.active_users (
  user_id uuid references public.users(id) primary key,
  online_since timestamptz default now(),
  expires_at timestamptz default (now() + interval '10 minutes')
);

-- CHATS
create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.users(id),
  user2_id uuid references public.users(id),
  user1_revealed boolean default false,
  user2_revealed boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.chats(id),
  sender_id uuid references public.users(id),
  text text,
  created_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;
alter table public.active_users enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Policies (Simplified for Phase 0)
-- Users can read their own profile
create policy "Read own profile" on public.users for select using (auth.uid() = id);

-- Chats: Visible if you are user1 or user2
create policy "Read own chats" on public.chats for select using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages: Visible if you are in the chat
create policy "Read chat messages" on public.messages for select 
using (
  exists (
    select 1 from public.chats c 
    where c.id = messages.chat_id 
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);
create policy "Insert messages" on public.messages for insert with check (
  exists (
    select 1 from public.chats c 
    where c.id = messages.chat_id 
    and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    and c.is_active = true
  )
);


-- MATCHING FUNCTION (RPC)
create or replace function find_match(my_id uuid)
returns table (match_chat_id uuid, status text)
language plpgsql
security definer
as $$
declare
  potential_partner_id uuid;
  new_chat_id uuid;
begin
  -- 1. Try to find someone in active_users who is NOT me
  select user_id into potential_partner_id
  from active_users
  where user_id != my_id
  order by online_since asc
  limit 1
  for update skip locked; -- Concurrency safety

  if potential_partner_id is not null then
    -- Match found!
    
    -- Remove partner from queue
    delete from active_users where user_id = potential_partner_id;
    
    -- Remove myself from queue if I was there
    delete from active_users where user_id = my_id;
    
    -- Create Chat
    insert into chats (user1_id, user2_id)
    values (my_id, potential_partner_id)
    returning id into new_chat_id;
    
    return query select new_chat_id, 'matched';
    
  else
    -- No match found. Add myself to queue.
    insert into active_users (user_id) values (my_id)
    on conflict (user_id) do update set expires_at = (now() + interval '10 minutes');
    
    return query select null::uuid, 'waiting';
  end if;
end;
$$;
