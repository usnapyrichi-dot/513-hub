-- ============================================================================
-- 514_v15_fix_rls_recursion.sql
-- Fix: infinite recursion in workspace_members RLS policy.
--
-- The wm_select policy called is_workspace_member() which queries
-- workspace_members, causing infinite recursion. Replace with a direct
-- auth.uid() check that doesn't re-enter the table.
-- ============================================================================

begin;

-- 1. Fix workspace_members SELECT policy (the root cause)
drop policy if exists wm_select on workspace_members;

-- A user can see any row in workspace_members IF their own user_id is in
-- that same workspace. We avoid recursion by checking ONLY their own row
-- using a direct equality filter — no helper function involved.
create policy wm_select on workspace_members
  for select using (
    user_id = auth.uid()
    or
    workspace_id in (
      select workspace_id
      from workspace_members
      where user_id = auth.uid()
        and workspace_id = workspace_members.workspace_id  -- self-join anchor
    )
  );

-- Actually the simplest safe version: a user sees only their OWN membership rows.
-- That's all getCurrentWorkspace() needs. Drop the above and use this:
drop policy if exists wm_select on workspace_members;

create policy wm_select on workspace_members
  for select using (user_id = auth.uid());

-- 2. Fix workspaces SELECT policy (also uses is_workspace_member which causes
--    recursion because ws_select → is_workspace_member → workspace_members →
--    wm_select → is_workspace_member → ...)
drop policy if exists ws_select on workspaces;

create policy ws_select on workspaces
  for select using (
    id in (
      select workspace_id
      from workspace_members
      where user_id = auth.uid()
    )
  );

-- 3. Fix workspace_settings SELECT policy (same chain)
drop policy if exists wss_select on workspace_settings;

create policy wss_select on workspace_settings
  for select using (
    workspace_id in (
      select workspace_id
      from workspace_members
      where user_id = auth.uid()
    )
  );

commit;
