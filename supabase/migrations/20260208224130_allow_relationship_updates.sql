drop policy if exists "Users can update own active relationships" on "public"."relationships";

create policy "Users can update own active relationships"
on "public"."relationships"
for update
using (
  -- PRE-UPDATE CHECK:
  -- You can only touch rows that are currently active
  status = 'active'
  AND
  (auth.uid() = user_a OR auth.uid() = user_b)
)
with check (
  -- POST-UPDATE CHECK:
  -- You are allowed to set the status to 'ended'
  -- (We don't enforce 'active' here, or you couldn't break up!)
  status in ('active', 'ended')
);
