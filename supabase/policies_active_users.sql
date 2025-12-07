-- Allow users to DELETE their own entry from active_users (Cancel Search)
create policy "Allow delete own active_user"
on public.active_users
for delete
using (auth.uid() = user_id);

-- Check if we need insert (usually handled by RPC, but safe to add)
create policy "Allow insert own active_user"
on public.active_users
for insert
with check (auth.uid() = user_id);

-- Allow reading (to see if you are in queue?)
create policy "Allow select own active_user"
on public.active_users
for select
using (auth.uid() = user_id);
