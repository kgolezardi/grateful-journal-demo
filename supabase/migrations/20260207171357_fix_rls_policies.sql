-- 1. Ensure RLS is enabled (Safety check)
alter table "public"."entries" enable row level security;

-- 2. Drop potential "Ghost" policies from the prototype phase
-- We use "IF EXISTS" so this won't crash if the policy is already gone.
drop policy if exists "Public access" on "p ublic"."entries";
drop policy if exists "Enable read access for all users" on "public"."entries";
drop policy if exists "Enable insert for all users" on "public"."entries";
drop policy if exists "Enable update for all users" on "public"."entries";
drop policy if exists "Enable delete for all users" on "public"."entries";

-- (Also drop the strict ones temporarily to ensure we don't get "policy already exists" errors)
drop policy if exists "Users can view own entries" on "public"."entries";
drop policy if exists "Users can insert own entries" on "public"."entries";
drop policy if exists "Users can delete own entries" on "public"."entries";

-- 3. Re-Create the STRICT policies
create policy "Users can view own entries" 
on "public"."entries" for select 
using (auth.uid() = user_id);

create policy "Users can insert own entries" 
on "public"."entries" for insert 
with check (auth.uid() = user_id);

create policy "Users can delete own entries" 
on "public"."entries" for delete 
using (auth.uid() = user_id);
