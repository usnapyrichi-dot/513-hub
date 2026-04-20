-- =============================================
-- 513 HUB — Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'social_manager', 'creative_copy', 'creative_art', 'editor_designer', 'client')) DEFAULT 'editor_designer',
  avatar_url TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'admin'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_guidelines JSONB,
  google_drive_folder_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CAR MODELS
-- ============================================
CREATE TABLE car_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  year INTEGER,
  key_technologies TEXT[] DEFAULT '{}',
  tech_specs JSONB,
  reference_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTENT PIECES
-- ============================================
CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  car_model_id UUID REFERENCES car_models(id) ON DELETE SET NULL,
  piece_number INTEGER,
  content_type TEXT NOT NULL CHECK (content_type IN ('reel', 'carousel_animated', 'carousel_static')),
  platforms TEXT[] DEFAULT '{"instagram"}',
  publish_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN (
    'planning', 'briefed', 'ideation', 'idea_approved', 
    'pre_production', 'production', 'internal_review', 
    'client_review', 'client_approved', 'client_changes', 
    'rework', 'scheduled', 'published'
  )),
  title TEXT,
  description TEXT,
  visual_description TEXT,
  copy_out TEXT,
  assigned_to UUID[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  briefing_id UUID,
  month_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BRIEFINGS
-- ============================================
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  objective TEXT,
  target_audience TEXT,
  key_messages TEXT[] DEFAULT '{}',
  ref_links JSONB DEFAULT '[]',
  ephemerides TEXT[] DEFAULT '{}',
  client_restrictions TEXT,
  ai_suggestions JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- IDEAS
-- ============================================
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  title TEXT,
  concept TEXT,
  visual_direction TEXT,
  copy_draft TEXT,
  moodboard_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'approved', 'rejected')),
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ASSETS
-- ============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('image', 'video', 'design_file')),
  mime_type TEXT,
  file_size_bytes BIGINT,
  dimensions JSONB,
  duration_seconds FLOAT,
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  google_drive_file_id TEXT,
  ai_generation_source TEXT,
  ai_prompt TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PRODUCTION TASKS
-- ============================================
CREATE TABLE production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  task_type TEXT CHECK (task_type IN ('video_edit', 'graphic_design', 'format_adaptation')),
  description TEXT,
  specs JSONB,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  review_type TEXT CHECK (review_type IN ('internal', 'client')),
  status TEXT CHECK (status IN ('approved', 'changes_requested', 'rejected')),
  round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COMMENTS
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id),
  comment_text TEXT,
  comment_type TEXT CHECK (comment_type IN ('design', 'copy', 'concept', 'minor')),
  annotation_data JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PRESENTATIONS
-- ============================================
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month_year TEXT,
  google_slides_id TEXT,
  google_slides_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'approved')),
  generated_at TIMESTAMPTZ,
  shared_with TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AI PROMPTS
-- ============================================
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  prompt_type TEXT CHECK (prompt_type IN ('copy', 'image_prompt', 'video_prompt', 'briefing')),
  provider TEXT CHECK (provider IN ('gemini', 'higgsfield')),
  prompt TEXT NOT NULL,
  system_instruction TEXT,
  result_text TEXT,
  parameters JSONB,
  is_favorite BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all authenticated users to read/write
-- (In production, refine these per role)
CREATE POLICY "Authenticated users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users full access to clients" ON clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to car_models" ON car_models FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to content_pieces" ON content_pieces FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to briefings" ON briefings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to ideas" ON ideas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to assets" ON assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to production_tasks" ON production_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to reviews" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to comments" ON comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to presentations" ON presentations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to ai_prompts" ON ai_prompts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_content_pieces_client ON content_pieces(client_id);
CREATE INDEX idx_content_pieces_status ON content_pieces(status);
CREATE INDEX idx_content_pieces_month ON content_pieces(month_year);
CREATE INDEX idx_content_pieces_type ON content_pieces(content_type);
CREATE INDEX idx_assets_piece ON assets(content_piece_id);
CREATE INDEX idx_briefings_piece ON briefings(content_piece_id);
CREATE INDEX idx_ideas_piece ON ideas(content_piece_id);
CREATE INDEX idx_comments_piece ON comments(content_piece_id);
CREATE INDEX idx_production_tasks_piece ON production_tasks(content_piece_id);
CREATE INDEX idx_ai_prompts_piece ON ai_prompts(content_piece_id);
CREATE INDEX idx_ai_prompts_favorite ON ai_prompts(is_favorite) WHERE is_favorite = true;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_pieces_updated_at
  BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
