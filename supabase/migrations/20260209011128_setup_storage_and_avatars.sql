-- 1. Add avatar_url to profiles table
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "avatar_url" text;

-- 2. Create the 'avatars' bucket in Supabase Storage
-- We use ON CONFLICT to prevent errors if you re-run migrations
INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB limit (optional, good practice)
    ARRAY['image/jpeg', 'image/png', 'image/webp'] -- Restrict to images
)
ON CONFLICT ("id") DO NOTHING;

-- 4. Create Security Policies for the Avatar Bucket

-- Policy: Anyone can view avatars (Public Read)
CREATE POLICY "Public Access" 
ON "storage"."objects" FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload an avatar
CREATE POLICY "Authenticated users can upload" 
ON "storage"."objects" FOR INSERT 
WITH CHECK ( 
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated' 
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar" 
ON "storage"."objects" FOR UPDATE 
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid() = owner 
);

-- Policy: Users can delete their own avatar (Cleanup)
CREATE POLICY "Users can delete own avatar" 
ON "storage"."objects" FOR DELETE 
USING ( 
  bucket_id = 'avatars' 
  AND auth.uid() = owner 
);
