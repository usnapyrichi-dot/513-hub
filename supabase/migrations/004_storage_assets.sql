-- DEPRECATED in v1.5, superseded by 013_v15_private_bucket.sql
-- =============================================
-- 513 HUB — Storage: Assets Bucket
-- Run this in your Supabase SQL Editor
-- =============================================

-- Create public storage bucket for media assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  104857600, -- 100 MB limit per file
  ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp','image/avif',
    'video/mp4','video/quicktime','video/webm','video/x-msvideo',
    'application/octet-stream','application/zip',
    'image/vnd.adobe.photoshop','image/x-xcf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Storage RLS Policies
-- =============================================

-- Anyone can view assets (public bucket)
CREATE POLICY "Public read access on assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

-- Authenticated users can upload
CREATE POLICY "Authenticated upload on assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets');

-- Authenticated users can update
CREATE POLICY "Authenticated update on assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'assets');

-- Authenticated users can delete
CREATE POLICY "Authenticated delete on assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assets');

-- =============================================
-- Prototyping: Allow anon access (remove in production)
-- =============================================
CREATE POLICY "Anon upload on assets"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'assets');

CREATE POLICY "Anon delete on assets"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'assets');

CREATE POLICY "Anon update on assets"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'assets');
