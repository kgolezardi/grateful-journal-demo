-- Add acknowledgment flags to relationships table
-- Default to FALSE so new matches start as "Unread"
alter table "public"."relationships"
add column "user_a_ack" boolean not null default false,
add column "user_b_ack" boolean not null default false;

-- (Optional) Backfill existing active relationships to TRUE
-- This prevents existing users from seeing the "Match" screen again
update "public"."relationships"
set user_a_ack = true, user_b_ack = true
where status = 'active';
