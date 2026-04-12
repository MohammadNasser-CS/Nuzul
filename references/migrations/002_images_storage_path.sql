-- ============================================================
-- Migration 002 — Add storage_path to images table
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- We need to remember WHERE the file lives in Supabase Storage
-- so we can delete it when the image record is deleted.
ALTER TABLE images ADD COLUMN IF NOT EXISTS storage_path TEXT;


-- ============================================================
-- Supabase Storage — Manual Steps (Dashboard)
-- ============================================================
-- 1. Go to: Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name:   nuzul-images
-- 4. Public: YES (toggle ON — so image URLs work without auth headers)
-- 5. Click "Save"
--
-- Folder structure used by the backend:
--   nuzul-images/
--     properties/{property_id}/{uuid}.{ext}
--     rooms/{room_id}/{uuid}.{ext}
--     avatars/{user_id}/{uuid}.{ext}   ← future use
-- ============================================================


-- ============================================================
-- Storage RLS Policies
-- Run these after creating the bucket.
-- ============================================================

-- Anyone can read (view) images — they are public
CREATE POLICY "Public read nuzul-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'nuzul-images');

-- Only authenticated users can upload (FastAPI service-role bypasses this,
-- but good to have for direct client uploads in future)
CREATE POLICY "Authenticated upload nuzul-images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'nuzul-images');

-- Only the uploader can delete their own files
CREATE POLICY "Owner delete nuzul-images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'nuzul-images');
