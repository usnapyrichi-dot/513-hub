begin;

-- =========================================================
-- DROPS DE POLICÍAS TEMPORALES ANTIGUAS Y PROTOTIPADO
-- =========================================================
do $$
declare
  t text;
  tables text[] := array[
    'clients', 'car_models','content_pieces','briefings','ideas','assets',
    'production_tasks','reviews','comments','presentations','ai_prompts',
    'workspaces', 'workspace_settings', 'workspace_members', 'client_contacts',
    'client_gems', 'portal_invites', 'review_batches', 'review_batch_items',
    'batch_comments', 'activity_events'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "Authenticated users full access to %I" on %I;', t, t);
    execute format('drop policy if exists "v15 temp full access on %I" on %I;', t, t);
    execute format('drop policy if exists "Anon can do all on %I" on %I;', t, t);
  end loop;
end $$;


-- ─────────────────────────────────────────────────────────────
-- workspaces
-- ─────────────────────────────────────────────────────────────
alter table workspaces enable row level security;
drop policy if exists ws_select on workspaces;
drop policy if exists ws_update on workspaces;
drop policy if exists ws_insert on workspaces;

-- Cualquier miembro ve su workspace.
create policy ws_select on workspaces
  for select using (is_workspace_member(id));

-- Solo owner/admin actualizan.
create policy ws_update on workspaces
  for update using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- Cualquier usuario autenticado puede crear un workspace (onboarding).
-- El trigger después mete al creador como 'owner' en workspace_members.
create policy ws_insert on workspaces
  for insert with check (auth.uid() is not null);

-- ─────────────────────────────────────────────────────────────
-- workspace_settings
-- ─────────────────────────────────────────────────────────────
alter table workspace_settings enable row level security;
drop policy if exists wss_select on workspace_settings;
drop policy if exists wss_update on workspace_settings;

create policy wss_select on workspace_settings
  for select using (is_workspace_member(workspace_id));

create policy wss_update on workspace_settings
  for all using (is_team_member(workspace_id)) -- clients NO pueden ver settings
         with check (is_team_member(workspace_id));

-- ─────────────────────────────────────────────────────────────
-- workspace_members
-- ─────────────────────────────────────────────────────────────
alter table workspace_members enable row level security;
drop policy if exists wm_select on workspace_members;
drop policy if exists wm_manage on workspace_members;

-- Un miembro ve a sus compañeros del mismo workspace.
create policy wm_select on workspace_members
  for select using (is_workspace_member(workspace_id));

-- Solo admins/owners gestionan membership.
create policy wm_manage on workspace_members
  for all using (
    exists (
      select 1 from workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  ) with check (
    exists (
      select 1 from workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- clients (team: todo; client_viewer: solo su propio client)
-- ─────────────────────────────────────────────────────────────
alter table clients enable row level security;
drop policy if exists clients_team      on clients;
drop policy if exists clients_viewer_rd on clients;

create policy clients_team on clients
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy clients_viewer_rd on clients
  for select using (
    exists (
      select 1 from client_contacts cc
      where cc.client_id = clients.id
        and cc.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- car_models (team only)
-- ─────────────────────────────────────────────────────────────
alter table car_models enable row level security;
drop policy if exists cars_team on car_models;

create policy cars_team on car_models
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

-- ─────────────────────────────────────────────────────────────
-- content_pieces (team: todo; client_viewer: solo las piezas en un batch visible)
-- ─────────────────────────────────────────────────────────────
alter table content_pieces enable row level security;
drop policy if exists pieces_team      on content_pieces;
drop policy if exists pieces_viewer_rd on content_pieces;

create policy pieces_team on content_pieces
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy pieces_viewer_rd on content_pieces
  for select using (
    exists (
      select 1 from review_batch_items rbi
      where rbi.content_piece_id = content_pieces.id
        and can_view_batch(rbi.batch_id)
    )
  );

-- ─────────────────────────────────────────────────────────────
-- briefings (team: todo; client_viewer: read si la pieza está en batch visible)
-- ─────────────────────────────────────────────────────────────
alter table briefings enable row level security;
drop policy if exists briefings_team      on briefings;
drop policy if exists briefings_viewer_rd on briefings;

create policy briefings_team on briefings
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy briefings_viewer_rd on briefings
  for select using (can_view_piece(content_piece_id));

-- ─────────────────────────────────────────────────────────────
-- assets (team: todo; client_viewer: read si la pieza está en batch visible)
-- ─────────────────────────────────────────────────────────────
alter table assets enable row level security;
drop policy if exists assets_team      on assets;
drop policy if exists assets_viewer_rd on assets;

create policy assets_team on assets
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy assets_viewer_rd on assets
  for select using (can_view_piece(content_piece_id));

-- ─────────────────────────────────────────────────────────────
-- comments (team: full; client_viewer: read en piezas visibles + insert propios)
-- ─────────────────────────────────────────────────────────────
alter table comments enable row level security;
drop policy if exists comments_team         on comments;
drop policy if exists comments_viewer_rd    on comments;
drop policy if exists comments_viewer_write on comments;

create policy comments_team on comments
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy comments_viewer_rd on comments
  for select using (can_view_piece(content_piece_id));

-- El cliente puede crear comentarios (inserta via API; preferido) pero solo si la pieza es visible.
create policy comments_viewer_write on comments
  for insert with check (
    can_view_piece(content_piece_id)
    and author_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- reviews (solo team)
-- ─────────────────────────────────────────────────────────────
alter table reviews enable row level security;
drop policy if exists reviews_team on reviews;

create policy reviews_team on reviews
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

-- ─────────────────────────────────────────────────────────────
-- production_tasks, ideas, presentations, ai_prompts (solo team)
-- ─────────────────────────────────────────────────────────────
alter table production_tasks enable row level security;
drop policy if exists ptasks_team on production_tasks;
create policy ptasks_team on production_tasks
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

alter table ideas enable row level security;
drop policy if exists ideas_team on ideas;
create policy ideas_team on ideas
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

alter table presentations enable row level security;
drop policy if exists pres_team on presentations;
create policy pres_team on presentations
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

alter table ai_prompts enable row level security;
drop policy if exists aip_team on ai_prompts;
create policy aip_team on ai_prompts
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

-- ─────────────────────────────────────────────────────────────
-- client_gems (team only; compartidas en workspace)
-- ─────────────────────────────────────────────────────────────
alter table client_gems enable row level security;
drop policy if exists gems_team on client_gems;
create policy gems_team on client_gems
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

-- ─────────────────────────────────────────────────────────────
-- client_contacts (team full; contact ve su propia fila)
-- ─────────────────────────────────────────────────────────────
alter table client_contacts enable row level security;
drop policy if exists contacts_team      on client_contacts;
drop policy if exists contacts_self_read on client_contacts;

create policy contacts_team on client_contacts
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy contacts_self_read on client_contacts
  for select using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- review_batches (team full; client_viewer read en sus batches)
-- ─────────────────────────────────────────────────────────────
alter table review_batches enable row level security;
drop policy if exists batches_team      on review_batches;
drop policy if exists batches_viewer_rd on review_batches;

create policy batches_team on review_batches
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy batches_viewer_rd on review_batches
  for select using (can_view_batch(id));

-- ─────────────────────────────────────────────────────────────
-- review_batch_items (team full; client_viewer read + update decision)
-- ─────────────────────────────────────────────────────────────
alter table review_batch_items enable row level security;
drop policy if exists rbi_team         on review_batch_items;
drop policy if exists rbi_viewer_rd    on review_batch_items;
drop policy if exists rbi_viewer_decide on review_batch_items;

create policy rbi_team on review_batch_items
  for all using (
    exists (
      select 1 from review_batches rb
      where rb.id = batch_id
        and is_team_member(rb.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from review_batches rb
      where rb.id = batch_id
        and is_team_member(rb.workspace_id)
    )
  );

create policy rbi_viewer_rd on review_batch_items
  for select using (can_view_batch(batch_id));

-- El cliente puede actualizar solo client_decision/client_feedback/decided_at.
-- Esta policy autoriza el UPDATE; la restricción de columnas se hace en la API
-- (preferido) o via triggers. Para v1.5 se aplicará desde server actions.
create policy rbi_viewer_decide on review_batch_items
  for update using (can_view_batch(batch_id))
              with check (can_view_batch(batch_id));

-- ─────────────────────────────────────────────────────────────
-- batch_comments (team full; client_viewer read + insert propios)
-- ─────────────────────────────────────────────────────────────
alter table batch_comments enable row level security;
drop policy if exists bc_team         on batch_comments;
drop policy if exists bc_viewer_rd    on batch_comments;
drop policy if exists bc_viewer_write on batch_comments;

create policy bc_team on batch_comments
  for all using (
    exists (
      select 1 from review_batches rb
      where rb.id = batch_id
        and is_team_member(rb.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from review_batches rb
      where rb.id = batch_id
        and is_team_member(rb.workspace_id)
    )
  );

create policy bc_viewer_rd on batch_comments
  for select using (can_view_batch(batch_id));

create policy bc_viewer_write on batch_comments
  for insert with check (
    can_view_batch(batch_id)
    and author_user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- portal_invites (team full; viewer solo las suyas)
-- ─────────────────────────────────────────────────────────────
alter table portal_invites enable row level security;
drop policy if exists pi_team      on portal_invites;
drop policy if exists pi_viewer_rd on portal_invites;

create policy pi_team on portal_invites
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy pi_viewer_rd on portal_invites
  for select using (
    exists (
      select 1 from client_contacts cc
      where cc.id = client_contact_id
        and cc.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- activity_events (team full; client_viewer ve eventos ligados a sus batches/piezas)
-- ─────────────────────────────────────────────────────────────
alter table activity_events enable row level security;
drop policy if exists act_team      on activity_events;
drop policy if exists act_viewer_rd on activity_events;

create policy act_team on activity_events
  for all using (is_team_member(workspace_id))
         with check (is_team_member(workspace_id));

create policy act_viewer_rd on activity_events
  for select using (
    (batch_id is not null and can_view_batch(batch_id))
    or (content_piece_id is not null and can_view_piece(content_piece_id))
  );

-- ─────────────────────────────────────────────────────────────
-- ELIMINAR políticas anon de la migración 003 (crítico)
-- ─────────────────────────────────────────────────────────────
drop policy if exists "car_models_anon"        on car_models;
drop policy if exists "content_pieces_anon"    on content_pieces;
-- (Ajustar a los nombres reales que tengas en 003_fix_rls_prototyping.sql)

commit;