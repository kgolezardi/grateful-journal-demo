-- 1. Add user_id column to entries
-- We reference the hidden "auth.users" table.
-- "default auth.uid()" means "If a user is logged in, use their ID automatically."
alter table "public"."entries" 
add column "user_id" uuid references auth.users not null default auth.uid();

-- 2. Enable Security (RLS)
alter table "public"."entries" enable row level security;

-- 3. Create strict policies
-- Policy: Users can only see their own entries
create policy "Users can view own entries" 
on "public"."entries" for select 
using (auth.uid() = user_id);

-- Policy: Users can only insert their own entries
create policy "Users can insert own entries" 
on "public"."entries" for insert 
with check (auth.uid() = user_id);

-- Policy: Users can only delete their own entries
create policy "Users can delete own entries" 
on "public"."entries" for delete 
using (auth.uid() = user_id);
