-- ============================================================================
-- 513 HUB v1.5 — Migration 010c: widen v1.0 policies to include `anon`
-- ============================================================================
-- WHY THIS EXISTS
-- In migration 001 we created RLS policies on the 11 v1.0 tables using
-- `TO authenticated` (except `clients`, which used `TO anon, authenticated`).
-- During the v1.5 dev phase the login middleware is disabled, so the app
-- runs with the `anon` role → INSERT / UPDATE / DELETE fail with:
--   "new row violates row-level security policy for table X"
--
-- The 10 new v1.5 tables already use `TO anon, authenticated` (see
-- migration 010). This file brings the 11 old tables in line for the
-- remainder of Phase A. Migration 012 (block 11) will DROP all these
-- permissive policies and replace them with real, workspace-scoped RLS.
--
-- Safe to run multiple times (drop-if-exists + create). Purely additive —
-- does NOT touch any row.
-- ============================================================================

begin;

-- Helper: drop the old "Authenticated users full access to X" policies and
-- recreate them as "v15 temp full access on X" with anon + authenticated.
do $$
declare
  t text;
  tables text[] := array[
    'car_models','content_pieces','briefings','ideas','assets',
    'production_tasks','reviews','comments','presentations','ai_prompts'
  ];
begin
  -- Note: `clients` is intentionally left out — it already allows anon.
  -- `profiles` is also left out (it has its own select/update policies tied
  -- to auth.uid()). The 10 tables above are the ones that block writes today.
  foreach t in array tables loop
    execute format(
      'drop policy if exists "Authenticated users full access to %1$s" on %1$s;',
      t
    );
    execute format(
      'drop policy if exists "v15 temp full access on %1$s" on %1$s;',
      t
    );
    execute format(
      'create policy "v15 temp full access on %1$s" on %1$s for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────────────────────
-- There should now be one "v15 temp full access on ..." policy per table
-- for each of the 10 widened tables.
select count(*) as v15_temp_policies_on_v10_tables
from pg_policies
where schemaname = 'public'
  and policyname like 'v15 temp full access on %'
  and tablename in (
    'car_models','content_pieces','briefings','ideas','assets',
    'production_tasks','reviews','comments','presentations','ai_prompts'
  );

commit;

-- ============================================================================
-- EXPECTED RESULT OF THE FINAL SELECT
-- ----------------------------------------------------------------------------
--   v15_temp_policies_on_v10_tables | 10
-- ============================================================================
