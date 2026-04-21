-- ============================================================================
-- 015_v15_fix_wm_manage.sql
-- Fix: wm_manage policy causes infinite recursion via self-join on
-- workspace_members without SECURITY DEFINER protection.
--
-- Solution: create is_workspace_admin() as SECURITY DEFINER (bypasses RLS)
-- and use it instead of the raw self-join in wm_manage.
-- ============================================================================

begin;

-- 1. Create a safe SECURITY DEFINER helper that checks admin/owner role
--    without triggering RLS on workspace_members.
create or replace function is_workspace_admin(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$function$;

-- 2. Drop the recursive wm_manage policy.
drop policy if exists wm_manage on workspace_members;

-- 3. Recreate wm_manage using the SECURITY DEFINER function (no recursion).
create policy wm_manage on workspace_members
  for all
  using    (is_workspace_admin(workspace_id))
  with check (is_workspace_admin(workspace_id));

commit;
