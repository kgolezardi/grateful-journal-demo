-- Allow users to update their own entries
create policy "Users can update own entries"
on "public"."entries"
for update
using (auth.uid() = user_id);