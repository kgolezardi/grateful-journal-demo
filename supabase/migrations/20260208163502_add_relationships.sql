-- 1. Create Profiles (Clean: No email column)
create table "public"."profiles" (
    "id" uuid references auth.users on delete cascade not null primary key,
    "display_name" text,
    "target_partner_email" text, 
    "created_at" timestamp with time zone default now()
);

-- 2. Create Relationships
create table "public"."relationships" (
    "id" uuid default gen_random_uuid() primary key,
    "user_a" uuid references "public"."profiles"("id") not null,
    "user_b" uuid references "public"."profiles"("id") not null,
    "status" text check (status in ('active', 'ended')) default 'active',
    "created_at" timestamp with time zone default now(),
    "ended_at" timestamp with time zone
);

-- 3. Update Entries
alter table "public"."entries" 
add column "relationship_id" uuid references "public"."relationships"("id");

-- 4. Enable Security
alter table "public"."profiles" enable row level security;
alter table "public"."relationships" enable row level security;

-- 5. RLS Policies

-- PROFILES
create policy "Users can view own profile" on "public"."profiles" 
for select using (auth.uid() = id);

create policy "Users can update own profile" on "public"."profiles" 
for update using (auth.uid() = id);

-- RELATIONSHIPS
create policy "Users can view own relationships" on "public"."relationships" 
for select using (auth.uid() = user_a or auth.uid() = user_b);

-- ENTRIES (View history of all relationships I was in)
create policy "Partners can view shared entries" 
on "public"."entries" for select 
using (
    auth.uid() = user_id -- I wrote it
    or 
    exists ( -- OR it belongs to a relationship I was part of
        select 1 from "public"."relationships" r
        where r.id = relationship_id
        and (r.user_a = auth.uid() or r.user_b = auth.uid())
    )
);

-- 6. AUTOMATION LOGIC: The "Auto-Match" Engine

-- A. Handle New User
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- B. Match Engine (The "Smart" Trigger)
create or replace function public.check_for_match()
returns trigger as $$
declare
  my_email text;
  partner_id uuid;
  partner_target text;
begin
  -- 0. GUARD CLAUSE: Prevent recursion
  -- If we just cleared the email (set to null), stop here.
  if new.target_partner_email is null then
    return new;
  end if;

  -- 1. Get MY email from the source of truth (auth.users)
  -- We can do this because this function is 'security definer' (runs as admin)
  select email into my_email from auth.users where id = new.id;

  -- 2. Find the PARTNER'S ID using the email I typed
  select id into partner_id from auth.users where email = new.target_partner_email;

  -- 3. If partner exists, check THEIR profile
  if partner_id is not null then
    select target_partner_email into partner_target
    from public.profiles
    where id = partner_id;

    -- 4. The Match Logic: If they are targeting ME
    if partner_target = my_email then
       -- Create Relationship
       insert into public.relationships (user_a, user_b, status)
       values (new.id, partner_id, 'active');

       -- Cleanup: Clear both targets to reset state
       -- The Guard Clause at step 0 prevents this from looping!
       update public.profiles set target_partner_email = null where id = new.id;
       update public.profiles set target_partner_email = null where id = partner_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_target_email_update
  after update of target_partner_email on public.profiles
  for each row
  execute procedure public.check_for_match();
