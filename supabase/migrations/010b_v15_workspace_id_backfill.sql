-- ============================================================================
-- 513 HUB v1.5 — Migration 010 (part 2): workspace_id + backfill
-- ============================================================================
-- This is the most delicate migration of Phase A. It:
--   1. Verifies the admin user exists (pre-flight)
--   2. Creates the default workspace + workspace_settings + owner membership
--   3. Adds nullable `workspace_id` to 11 existing v1.0 tables
--   4. Backfills every row with the default workspace id
--   5. Converts `workspace_id` to NOT NULL on all 11 tables
--   6. Verifies zero rows remain with NULL workspace_id
--
-- All wrapped in a single BEGIN/COMMIT. If any step fails, ROLLBACK is
-- automatic and the DB returns to its pre-migration state.
--
-- Block 3 of v1.5 Phase A plan.
-- ============================================================================
--
-- ╔════════════════════════════════════════════════════════════════════════╗
-- ║  BEFORE RUNNING — PASTE YOUR ADMIN UUID IN THE LINE BELOW              ║
-- ║                                                                        ║
-- ║  1. Run the pre-flight query in a separate editor tab:                 ║
-- ║       select u.id, u.email, p.role                                     ║
-- ║       from auth.users u                                                ║
-- ║       left join profiles p on p.id = u.id;                             ║
-- ║                                                                        ║
-- ║  2. Copy the `id` column (your admin UUID) and paste it below,         ║
-- ║     replacing PASTE_ADMIN_UUID_HERE (keep the single quotes + ::uuid). ║
-- ║                                                                        ║
-- ║  3. If you leave the placeholder, the migration will fail on purpose   ║
-- ║     with a clear error message — safe by design.                       ║
-- ╚════════════════════════════════════════════════════════════════════════╝

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 1: Pre-flight + create default workspace + owner
-- ────────────────────────────────────────────────────────────────────────────

do $preflight$
declare
  v_admin_id     uuid := 'a1fcab96-9321-4f21-8d1d-51906ba04e7e'::uuid;  -- ◄── EDIT THIS LINE
  v_ws_id        uuid;
  v_user_count   int;
  v_ws_count     int;
begin
  -- Pre-flight 1: the placeholder must have been replaced.
  if v_admin_id is null then
    raise exception 'Pre-flight FAILED: admin_id is null. Did you edit the UUID line?';
  end if;

  -- Pre-flight 2: admin user must exist in auth.users.
  if not exists (select 1 from auth.users where id = v_admin_id) then
    raise exception 'Pre-flight FAILED: auth.users has no row with id %', v_admin_id;
  end if;

  -- Pre-flight 3: (Removed) Allow multiple users.
  -- We just bypass the count check since Prod has 5 users.

  -- Pre-flight 4: Adapt to existing workspaces smoothly
  select count(*) into v_ws_count from workspaces;
  if v_ws_count > 0 then
    raise notice 'Pre-flight OK. Workspaces exist (%). Using the first one as default.', v_ws_count;
    select id into v_ws_id from workspaces order by created_at asc limit 1;
    
    -- Ensure settings exist
    if not exists (select 1 from workspace_settings where workspace_id = v_ws_id) then
      insert into workspace_settings (workspace_id, agency_name, tagline)
      values (v_ws_id, '513 HUB', 'Social Media Agency');
    end if;

    -- Ensure admin is member (if no owner exists, make them owner, else member)
    if not exists (select 1 from workspace_members where workspace_id = v_ws_id and user_id = v_admin_id) then
      if exists (select 1 from workspace_members where workspace_id = v_ws_id and role = 'owner') then
        insert into workspace_members (workspace_id, user_id, role) values (v_ws_id, v_admin_id, 'member');
      else
        insert into workspace_members (workspace_id, user_id, role) values (v_ws_id, v_admin_id, 'owner');
      end if;
    end if;
  else
    raise notice 'Pre-flight OK. Admin: %. Creating default workspace...', v_admin_id;

    -- Create the default workspace.
    insert into workspaces (name, slug)
    values ('513 HUB', '513-hub')
    returning id into v_ws_id;

    -- Create its settings with the values currently hardcoded in the app.
    insert into workspace_settings (workspace_id, agency_name, tagline)
    values (v_ws_id, '513 HUB', 'Social Media Agency');

    -- Add the admin as owner of this workspace.
    insert into workspace_members (workspace_id, user_id, role)
    values (v_ws_id, v_admin_id, 'owner');

    raise notice 'Workspace created: %. Owner: %.', v_ws_id, v_admin_id;
  end if;
end $preflight$;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add workspace_id column (nullable) to the 11 v1.0 tables
-- ────────────────────────────────────────────────────────────────────────────
-- We add as nullable first so we can backfill safely. Converted to NOT NULL
-- at the end of this migration, once every row has a value.

alter table clients          add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table car_models       add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table content_pieces   add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table briefings        add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table ideas            add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table assets           add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table production_tasks add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table reviews          add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table comments         add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table presentations    add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table ai_prompts       add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 3: Backfill every existing row with the default workspace id
-- ────────────────────────────────────────────────────────────────────────────

do $backfill$
declare
  v_ws_id    uuid;
begin
  select id into v_ws_id from workspaces order by created_at asc limit 1;

  update clients          set workspace_id = v_ws_id where workspace_id is null;
  update car_models       set workspace_id = v_ws_id where workspace_id is null;
  update content_pieces   set workspace_id = v_ws_id where workspace_id is null;
  update briefings        set workspace_id = v_ws_id where workspace_id is null;
  update ideas            set workspace_id = v_ws_id where workspace_id is null;
  update assets           set workspace_id = v_ws_id where workspace_id is null;
  update production_tasks set workspace_id = v_ws_id where workspace_id is null;
  update reviews          set workspace_id = v_ws_id where workspace_id is null;
  update comments         set workspace_id = v_ws_id where workspace_id is null;
  update presentations    set workspace_id = v_ws_id where workspace_id is null;
  update ai_prompts       set workspace_id = v_ws_id where workspace_id is null;

  raise notice 'Backfill completed against workspace %', v_ws_id;
end $backfill$;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 4: Verify zero NULL rows remain
-- ────────────────────────────────────────────────────────────────────────────
-- If any row is still NULL the migration aborts here, leaving the whole
-- transaction to roll back (nothing committed).

do $verify$
declare
  v_null_total int := 0;
  v_tbl        text;
  v_tbls       text[] := array[
    'clients','car_models','content_pieces','briefings','ideas',
    'assets','production_tasks','reviews','comments','presentations','ai_prompts'
  ];
  v_row_count  int;
begin
  foreach v_tbl in array v_tbls loop
    execute format('select count(*) from %I where workspace_id is null', v_tbl)
      into v_row_count;
    if v_row_count > 0 then
      v_null_total := v_null_total + v_row_count;
      raise warning 'Table % still has % NULL workspace_id rows', v_tbl, v_row_count;
    end if;
  end loop;

  if v_null_total > 0 then
    raise exception 'Verification FAILED: % total rows with NULL workspace_id. Rolling back.', v_null_total;
  end if;

  raise notice 'Verification OK: zero NULL workspace_id rows across all 11 tables.';
end $verify$;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 5: Convert workspace_id to NOT NULL on all 11 tables
-- ────────────────────────────────────────────────────────────────────────────

alter table clients          alter column workspace_id set not null;
alter table car_models       alter column workspace_id set not null;
alter table content_pieces   alter column workspace_id set not null;
alter table briefings        alter column workspace_id set not null;
alter table ideas            alter column workspace_id set not null;
alter table assets           alter column workspace_id set not null;
alter table production_tasks alter column workspace_id set not null;
alter table reviews          alter column workspace_id set not null;
alter table comments         alter column workspace_id set not null;
alter table presentations    alter column workspace_id set not null;
alter table ai_prompts       alter column workspace_id set not null;

-- ────────────────────────────────────────────────────────────────────────────
-- STEP 6: Final sanity query (single SELECT so Supabase SQL Editor shows it)
-- ────────────────────────────────────────────────────────────────────────────

select
  (select count(*) from workspaces)          as workspaces_total,
  (select count(*) from workspace_members
    where role = 'owner')                    as owners_total,
  (select count(*) from information_schema.columns
     where table_schema = 'public'
       and column_name  = 'workspace_id'
       and is_nullable  = 'NO')              as tables_with_not_null_ws_id,
  (select count(*) from clients
     where workspace_id is null)             as clients_null_ws_id,
  (select count(*) from content_pieces
     where workspace_id is null)             as pieces_null_ws_id;

commit;

-- ============================================================================
-- EXPECTED RESULT OF THE FINAL SELECT
-- ----------------------------------------------------------------------------
--   workspaces_total           | 1
--   owners_total               | 1
--   tables_with_not_null_ws_id | 18   -- 11 existing (this migration)
--                                      -- + 7 new (already NOT NULL from
--                                      --   migration 010 part 1)
--   clients_null_ws_id         | 0
--   pieces_null_ws_id          | 0
-- ==============================================================