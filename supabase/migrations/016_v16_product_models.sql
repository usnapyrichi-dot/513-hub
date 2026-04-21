-- ============================================================================
-- 016_v16_product_models.sql
-- Evolver la tabla car_models para soportar múltiples tipos de productos
-- ============================================================================

begin;

alter table car_models
  add column if not exists product_type text default 'vehicle' check (product_type in ('vehicle', 'other')),
  add column if not exists thumbnail_url text,
  add column if not exists drive_folder_url text,
  add column if not exists features jsonb default '[]'::jsonb;

commit;
