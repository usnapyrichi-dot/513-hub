-- ============================================================================
-- 017_v16_thumbnails_bucket.sql
-- Crea un bucket público para miniaturas de productos/modelos
-- ============================================================================

begin;

-- Bucket público para thumbnails (imágenes de producto/modelo en el cliente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (sin auth)
CREATE POLICY "Public read thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

-- Solo usuarios autenticados pueden subir
CREATE POLICY "Authenticated upload thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

-- Solo usuarios autenticados pueden actualizar
CREATE POLICY "Authenticated update thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'thumbnails');

-- Solo usuarios autenticados pueden borrar
CREATE POLICY "Authenticated delete thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'thumbnails');

commit;
