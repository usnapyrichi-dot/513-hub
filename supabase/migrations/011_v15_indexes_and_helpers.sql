-- ============================================================================
-- 513 HUB v1.5 — Migration 011: performance indexes + RLS helper functions
-- ============================================================================
-- Purely additive. Does NOT alter tables, data, or activate real RLS.
--
-- Block 4 of v1.5 Phase A plan.
--
-- Part A: ≥ 30 btree indexes (idempotent via IF NOT EXISTS).
--         Every new workspace_id column gets indexed, plus high-traffic
--         filter columns on the new v1.5 tables.
--
-- Part B: 4 helper functions (SQL-language, STABLE, SECURITY DEFINER).
--         These are consumed later by migration 012 (block 11) to express
--         RLS policies without duplicating membership logic in every table.
--
-- Rollback note: helper functions use CREATE OR REPLACE, so re-running is
-- safe. Indexes use IF NOT EXISTS. Migration is therefore fully idempotent.
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- PART A — Performance indexes
-- ────────────────────────────────────────────────────────────────────────────

-- workspace_id on the 11 existing v1.0 tables (now NOT NULL after 010b).
create index if not exists idx_clients_workspace          on clients(workspace_id);
create index if not exists idx_car_models_workspace       on car_models(workspace_id);
create index if not exists idx_content_pieces_workspace   on content_pieces(workspace_id);
create index if not exists idx_briefings_workspace        on briefings(workspace_id);
create index if not exists idx_ideas_workspace            on ideas(workspace_id);
create index if not exists idx_assets_workspace           on assets(workspace_id);
create index if not exists idx_production_tasks_workspace on production_tasks(workspace_id);
create index if not exists idx_reviews_workspace          on reviews(workspace_id);
create index if not exists idx_comments_workspace         on comments(workspace_id);
create index if not exists idx_presentations_workspace    on presentations(workspace_id);
create index if not exists idx_ai_prompts_workspace       on ai_prompts(workspace_id);

-- workspace_id on the new v1.5 tables that reference workspaces.
create index if not exists idx_workspace_settings_workspace on workspace_settings(workspace_id);
create index if not exists idx_workspace_members_workspace  on workspace_members(workspace_id);
create index if not exists idx_workspace_members_user       on workspace_members(user_id);
create index if not exists idx_client_contacts_workspace    on client_contacts(workspace_id);
create index if not exists idx_client_contacts_user         on client_contacts(user_id);
create index if not exists idx_client_contacts_client       on client_contacts(client_id);
create index if not exists idx_client_gems_workspace        on client_gems(workspace_id);
create index if not exists idx_client_gems_client           on client_gems(client_id);
create index if not exists idx_portal_invites_workspace     on portal_invites(workspace_id);
create index if not exists idx_portal_invites_batch         on portal_invites(batch_id);
create index if not exists idx_portal_invites_contact       on portal_invites(client_contact_id);
create index if not exists idx_portal_invites_status        on portal_invites(status);
create index if not exists idx_review_batches_workspace     on review_batches(workspace_id);
create index if not exists idx_review_batches_client        on review_batches(client_id);
create index if not exists idx_review_batches_status        on review_batches(status);
create index if not exists idx_review_batch_items_batch     on review_batch_items(batch_id);
create index if not exists idx_review_batch_items_piece     on review_batch_items(content_piece_id);
create index if not exists idx_batch_comments_batch         on batch_comments(batch_id);
create index if not exists idx_batch_comments_item          on batch_comments(batch_item_id);
create index if not exists idx_activity_events_workspace    on activity_events(workspace_id);
create index if not exists idx_activity_events_created      on activity_events(created_at desc);
create index if not exists idx_activity_events_client       on activity_events(client_id);
create index if not exists idx_activity_events_piece        on activity_events(content_piece_id);
create index if not exists idx_activity_events_batch        on activity_events(batch_id);

-- ────────────────────────────────────────────────────────────────────────────
-- PART B — Helper functions for RLS
-- ────────────────────────────────────────────────────────────────────────────
-- Design notes:
--   * All helpers are STABLE (result does not change within a single query).
--   * SECURITY DEFINER so they bypass RLS on workspace_members while checking
--     membership. Without this, the policy that uses them would recursively
--     query workspace_members and hit its own policy.
--   * search_path is locked to pg_catalog, public to prevent search_path
--     injection attacks via unqualified function names.

-- ---------- is_workspace_member(ws) -----------------------------------------
-- True if the authenticated user belongs to workspace `ws` with ANY role
-- (including client_viewer).
create or replace function is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
  );
$function$;

-- ---------- is_team_member(ws) ---------------------------------------------
-- True if the authenticated user belongs to workspace `ws` with a TEAM role
-- (anything except client_viewer). This is the check for "can see/edit
-- everything in this workspace".
create or replace function is_team_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from workspace_members
    where workspace_id = ws
      and user_id = auth.uid()
      and role <> 'client_viewer'
  );
$function$;

-- ---------- can_view_batch(b) ----------------------------------------------
-- True if the authenticated user is either (a) a TEAM member of the batch's
-- workspace, or (b) a client contact whose accepted invitation points to
-- this batch.
create or replace function can_view_batch(b uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select
    -- Team path
    exists (
      select 1
      from review_batches rb
      where rb.id = b
        and is_team_member(rb.workspace_id)
    )
    or
    -- Client contact path via accepted portal invitation
    exists (
      select 1
      from portal_invites pi
      join client_contacts cc on cc.id = pi.client_contact_id
      where pi.batch_id = b
        and pi.status = 'accepted'
        and cc.user_id = auth.uid()
    );
$function$;

-- ---------- can_view_piece(p) ----------------------------------------------
-- True if the authenticated user can view content piece `p`. A piece is
-- visible if either:
--   * the user is a team member of the piece's workspace, OR
--   * the piece is part of at least one batch the user can view.
create or replace function can_view_piece(p uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select
    exists (
      select 1
      from content_pieces cp
      where cp.id = p
        and is_team_member(cp.workspace_id)
    )
    or
    exists (
      select 1
      from review_batch_items rbi
      where rbi.content_piece_id = p
        and can_view_batch(rbi.batch_id)
    );
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- PART C — Verification
-- ────────────────────────────────────────────────────────────────────────────

select
  (select count(*) from pg_indexes
    where schemaname = 'public'
      and indexname like 'idx_%')               as total_idx_indexes,
  (select count(*) from pg_proc
    where proname in (
      'is_workspace_member','is_team_member',
      'can_view_batch','can_view_piece'
    ))                                           as helper_fns_count;

commit;

-- ============================================================================
-- EXPECTED RESULT OF THE FINAL SELECT
-- ----------------------------------------------------------------------------
--   total_idx_indexes | ≥ 30   (we add 34 here, plus any idx_% from
--                               migrations 001 and 006, for a total > 40)
--   helper_fns_count  | 4      (exactly our 4 new helper functions)
-- ============================================================================
