-- 1. Add the date column
alter table "public"."entries" 
add column "entry_date" date default CURRENT_DATE;

-- 2. Create an index for faster history lookups
create index idx_entries_relationship_date 
on "public"."entries" ("relationship_id", "entry_date");

-- 3. Backfill: Set 'entry_date' for existing rows based on when they were created
update "public"."entries" 
set "entry_date" = "created_at"::date 
where "entry_date" is null;

-- 4. Safety: Ensure no future nulls
alter table "public"."entries" 
alter column "entry_date" set not null;
