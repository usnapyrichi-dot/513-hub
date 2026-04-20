-- =============================================
-- 513 HUB — Performance indexes
-- Safe to run multiple times (IF NOT EXISTS)
-- =============================================

-- content_pieces
CREATE INDEX IF NOT EXISTS idx_content_pieces_client     ON content_pieces(client_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_status     ON content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_month      ON content_pieces(month_year);
CREATE INDEX IF NOT EXISTS idx_content_pieces_type       ON content_pieces(content_type);
CREATE INDEX IF NOT EXISTS idx_content_pieces_publish    ON content_pieces(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_pieces_created    ON content_pieces(created_at DESC);

-- assets
CREATE INDEX IF NOT EXISTS idx_assets_piece              ON assets(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_assets_final              ON assets(is_final) WHERE is_final = true;
CREATE INDEX IF NOT EXISTS idx_assets_type               ON assets(file_type);

-- briefings
CREATE INDEX IF NOT EXISTS idx_briefings_piece           ON briefings(content_piece_id);

-- ideas
CREATE INDEX IF NOT EXISTS idx_ideas_piece               ON ideas(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status              ON ideas(status);

-- comments
CREATE INDEX IF NOT EXISTS idx_comments_piece            ON comments(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_comments_resolved         ON comments(resolved) WHERE resolved = false;

-- ai_prompts
CREATE INDEX IF NOT EXISTS idx_ai_prompts_piece          ON ai_prompts(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_favorite       ON ai_prompts(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_ai_prompts_type           ON ai_prompts(prompt_type);

-- production_tasks
CREATE INDEX IF NOT EXISTS idx_production_tasks_piece    ON production_tasks(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_production_tasks_status   ON production_tasks(status);

SELECT 'Indexes created successfully' AS result;
