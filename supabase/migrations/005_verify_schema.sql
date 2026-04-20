-- =============================================
-- 513 HUB — Schema Verification & Fixes
-- Run this in Supabase SQL Editor to ensure
-- all columns and tables are present.
-- Safe to run multiple times (IF NOT EXISTS).
-- =============================================

-- content_pieces: ensure all columns exist
ALTER TABLE content_pieces
  ADD COLUMN IF NOT EXISTS piece_number INTEGER,
  ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{instagram}',
  ADD COLUMN IF NOT EXISTS publish_date DATE,
  ADD COLUMN IF NOT EXISTS visual_description TEXT,
  ADD COLUMN IF NOT EXISTS copy_out TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS briefing_id UUID,
  ADD COLUMN IF NOT EXISTS month_year TEXT;

-- clients: ensure brand_guidelines column exists
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS brand_guidelines JSONB;

-- content_pieces: status check constraint may need updating
-- (safe no-op if already correct)
ALTER TABLE content_pieces
  DROP CONSTRAINT IF EXISTS content_pieces_status_check;

ALTER TABLE content_pieces
  ADD CONSTRAINT content_pieces_status_check CHECK (status IN (
    'planning', 'briefed', 'ideation', 'idea_approved',
    'pre_production', 'production', 'internal_review',
    'client_review', 'client_approved', 'client_changes',
    'rework', 'scheduled', 'published'
  ));

-- Verify final table list
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
