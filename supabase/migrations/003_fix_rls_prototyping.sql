-- DEPRECATED in v1.5, superseded by 012_v15_rls.sql
-- Run this ONLY if you encounter RLS errors when creating Car Models or Content Pieces without being logged in.
CREATE POLICY "Anon can do all on car_models" ON car_models FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can do all on content_pieces" ON content_pieces FOR ALL TO anon USING (true) WITH CHECK (true);
