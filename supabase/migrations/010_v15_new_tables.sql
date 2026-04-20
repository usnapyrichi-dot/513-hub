-- ============================================================================
-- 513 HUB v1.5 — Migration 010 (part 1): new tables + new enums
-- ============================================================================
-- Adds the 10 new tables and 4 enums that support multi-tenancy, batches,
-- client portal and activity log. PURELY ADDITIVE — does not touch any
-- existing v1.0 table. Safe to run on staging and (later) on production.
--
-- Block 2 of v1.5 Phase A plan.
--
-- What this migration DOES:
--   * Enables uuid-ossp + pgcrypto extensions (idempotent)
--   * Creates 4 new enum types
--   * Creates 10 new tables
--   * Enables RLS on all new tables with temporary USING(true) policies
--     (same pattern as v1.0 — real RLS comes in migration 012 / block 11)
--   * Creates 1 partial unique index (one owner per workspace)
--
-- What this migration does NOT do (by design):
--   * Add workspace_id to existing tables  → block 3 (migration 010b)
--   * Create helper functions for RLS     → block 4 (migration 011)
--   * Replace USING(true) with real RLS   → block 11 (migration 012)
--
-- Rollback strategy: every CREATE statement uses IF NOT EXISTS so re-running
-- is safe. To fully undo, drop tables in reverse dependency order and then
-- drop the 4 enum types. See end of file for the exact rollback block
-- (commented out).
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────────────
-- 2. NEW ENUMS
-- ────────────────────────────────────────────────────────────────────────────

-- Role of a member inside a workspace. Replaces the loose `role` text
-- column on profiles for authorization purposes (profiles.role stays
-- untouched for v1.0 compatibility).
do $$ begin
  create type workspace_role as enum (
    'owner',            -- workspace owner (exactly one per workspace)
    'admin',            -- full access except deleting the workspace
    'social_manager',   -- piece + client management
    'creative_copy',    -- copy creation
    'creative_art',     -- visual / design creation
    'editor_designer',  -- editing / assembly
    'client_viewer'     -- external client — access to shared batches only
  );
exception when duplicate_object then null; end $$;

-- Status of a review batch.
do $$ begin
  create type batch_status as enum (
    'draft',               -- team is still assembling the batch
    'sent',                -- link has been sent to the client
    'in_review',           -- client has opened the portal at least once
    'changes_requested',
    'approved',
    'partially_approved',
    'archived'
  );
exception when duplicate_object then null; end $$;

-- Status of a portal magic-link invitation.
do $$ begin
  create type invite_status as enum (
    'pending',
    'accepted',
    'expired',
    'revoked'
  );
exception when duplicate_object then null; end $$;

-- Event type for the activity log.
do $$ begin
  create type activity_event_type as enum (
    'piece.created', 'piece.status_changed', 'piece.updated', 'piece.deleted',
    'briefing.created', 'briefing.updated',
    'asset.uploaded', 'asset.deleted',
    'comment.created', 'comment.resolved',
    'batch.created', 'batch.sent', 'batch.opened',
    'batch.approved', 'batch.rejected', 'batch.commented',
    'member.invited', 'member.joined', 'member.removed'
  );
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. WORKSPACES + MEMBERSHIP
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists workspaces (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_settings (
  workspace_id       uuid primary key references workspaces(id) on delete cascade,
  agency_name        text,
  tagline            text,
  logo_url           text,
  timezone           text  not null default 'Europe/Madrid',
  notification_prefs jsonb not null default '{"notif_status": true, "notif_review": true}'::jsonb,
  branding           jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now()
);

create table if not exists workspace_members (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         workspace_role not null,
  invited_by   uuid references auth.users(id),
  joined_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Exactly one 'owner' per workspace.
create unique index if not exists uniq_one_owner_per_workspace
  on workspace_members (workspace_id)
  where role = 'owner';

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CLIENT CONTACTS + GEMS + PORTAL INVITES
-- ────────────────────────────────────────────────────────────────────────────

-- Client-side contacts (may or may not yet have an auth.users row).
create table if not exists client_contacts (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete set null, -- null until invite accepted
  email        text not null,
  full_name    text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (client_id, email)
);

-- Gems per client, shared across the whole workspace (not per user).
create table if not exists client_gems (
  id                  uuid primary key default uuid_generate_v4(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  client_id           uuid not null references clients(id) on delete cascade,
  name                text not null default 'Default',
  system_instruction  text not null,
  model               text not null default 'gemini-2.5-flash',
  is_active           boolean not null default true,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (client_id, name)
);

-- Magic-link invitations to the client portal.
-- batch_id FK is added at the end of section 5 (after review_batches exists).
create table if not exists portal_invites (
  id                 uuid primary key default uuid_generate_v4(),
  workspace_id       uuid not null references workspaces(id) on delete cascade,
  batch_id           uuid not null,
  client_contact_id  uuid not null references client_contacts(id) on delete cascade,
  token_hash         text not null unique,
  status             invite_status not null default 'pending',
  expires_at         timestamptz not null,
  accepted_at        timestamptz,
  created_by         uuid references auth.users(id),
  created_at         timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. REVIEW BATCHES
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists review_batches (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  title        text not null,
  description  text,
  status       batch_status not null default 'draft',
  sent_at      timestamptz,
  due_date     date,
  approved_at  timestamptz,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Now we can wire portal_invites.batch_id to review_batches.
do $$ begin
  alter table portal_invites
    add constraint portal_invites_batch_fk
    foreign key (batch_id) references review_batches(id) on delete cascade;
exception when duplicate_object then null; end $$;

create table if not exists review_batch_items (
  id                uuid primary key default uuid_generate_v4(),
  batch_id          uuid not null references review_batches(id) on delete cascade,
  content_piece_id  uuid not null references content_pieces(id) on delete cascade,
  order_index       int  not null default 0,
  item_status       batch_status not null default 'sent',
  client_decision   text check (
    client_decision in ('approved','rejected','changes_requested')
    or client_decision is null
  ),
  client_feedback   text,
  decided_at        timestamptz,
  unique (batch_id, content_piece_id)
);

-- Client comments at batch/item level (separate from the piece-level `comments` table).
create table if not exists batch_comments (
  id                uuid primary key default uuid_generate_v4(),
  batch_id          uuid not null references review_batches(id) on delete cascade,
  batch_item_id     uuid references review_batch_items(id) on delete cascade,
  author_user_id    uuid references auth.users(id),
  author_contact_id uuid references client_contacts(id),
  comment_text      text not null,
  created_at        timestamptz not null default now(),
  check (author_user_id is not null or author_contact_id is not null)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ACTIVITY LOG
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists activity_events (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  event_type        activity_event_type not null,
  actor_user_id     uuid references auth.users(id),
  actor_contact_id  uuid references client_contacts(id),
  client_id         uuid references clients(id) on delete set null,
  content_piece_id  uuid references content_pieces(id) on delete set null,
  batch_id          uuid references review_batches(id) on delete set null,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. RLS: enable + temporary USING(true) policies on the 10 new tables
-- ────────────────────────────────────────────────────────────────────────────
-- Same permissive pattern as v1.0. These will be replaced by proper policies
-- in migration 012 (block 11). We enable RLS now so the tables behave like
-- the rest of the schema from day 1.
--
-- Policies created here are idempotent: we drop-if-exists first.

alter table workspaces          enable row level security;
alter table workspace_settings  enable row level security;
alter table workspace_members   enable row level security;
alter table client_contacts     enable row level security;
alter table client_gems         enable row level security;
alter table portal_invites      enable row level security;
alter table review_batches      enable row level security;
alter table review_batch_items  enable row level security;
alter table batch_comments      enable row level security;
alter table activity_events     enable row level security;

-- Helper: tiny DO block to DROP + CREATE each policy atomically.
do $$
declare
  t text;
  tables text[] := array[
    'workspaces','workspace_settings','workspace_members',
    'client_contacts','client_gems','portal_invites',
    'review_batches','review_batch_items','batch_comments',
    'activity_events'
  ];
begin
  foreach t in array tables loop
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
-- 8. VERIFICATION
-- ────────────────────────────────────────────────────────────────────────────

-- Sanity query (does not affect anything). If this returns less than
-- 10 tables or less than 4 enums, something went wrong.
select 'migration 010 applied. tables created: ' || count(*)::text as result
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'workspaces','workspace_settings','workspace_members',
    'client_contacts','client_gems','portal_invites',
    'review_batches','review_batch_items','batch_comments',
    'activity_events'
  );

commit;

-- ============================================================================
-- ROLLBACK (commented out — only uncomment manually if you really need to
-- undo this migration on staging). Never run this on production.
-- ============================================================================
--
-- begin;
--   drop table if exists activity_events     cascade;
--   drop table if exists batch_comments      cascade;
--   drop table if exists review_batch_items  cascade;
--   drop table if exists review_batches      cascade;
--   drop table if exists portal_invites      cascade;
--   drop table if exists client_gems         cascade;
--   drop table if exists client_contacts     cascade;
--   drop table if exists workspace_members   cascade;
--   drop table if exists workspace_settings  cascade;
--   drop table if exists workspaces          cascade;
--   drop type  if exists activity_event_type;
--   drop type  if exists invite_status;
--   drop type  if exists batch_status;
--   drop type  if exists workspace_role;
-- commit;
