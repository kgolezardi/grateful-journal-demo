-- 1. Drop the buggy policy
drop policy if exists "Users can view connected profiles" on "public"."profiles";

-- 2. Create the Corrected Policy (Explicit Scoping)
create policy "Users can view connected profiles"
on "public"."profiles" for select
using (
  -- I can always see my own profile
  auth.uid() = profiles.id 
  
  OR 
  
  -- I can see the profile of ANYone I have a relationship row with
  exists (
    select 1 from "public"."relationships" r
    where 
      (r.user_a = auth.uid() and r.user_b = profiles.id) 
      or
      (r.user_b = auth.uid() and r.user_a = profiles.id) 
  )
);
