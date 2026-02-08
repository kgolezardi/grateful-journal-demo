-- Create the entries table
create table "public"."entries" (
    "id" bigint generated always as identity primary key,
    "content" text not null,
    "created_at" timestamp with time zone default now()
);

-- Enable Security
alter table "public"."entries" enable row level security;