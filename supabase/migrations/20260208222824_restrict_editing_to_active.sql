-- 1. Drop the overly permissive policies
drop policy if exists "Users can update own entries" on "public"."entries";
drop policy if exists "Users can delete own entries" on "public"."entries";

-- 2. Create STRICT Update Policy (Active Relationship Only)
create policy "Users can update own active entries"
on "public"."entries" for update
using (
  auth.uid() = user_id -- I wrote it
  AND 
  exists ( -- AND it belongs to a relationship that is currently active
    select 1 from "public"."relationships" r
    where r.id = relationship_id
    and r.status = 'active'
  )
);

-- 3. Create STRICT Delete Policy (Active Relationship Only)
-- We apply this to deletes too, so you can't remove history either.
create policy "Users can delete own active entries"
on "public"."entries" for delete
using (
  auth.uid() = user_id
  AND 
  exists (
    select 1 from "public"."relationships" r
    where r.id = relationship_id
    and r.status = 'active'
  )
);
