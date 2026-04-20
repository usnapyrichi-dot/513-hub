begin;

-- 1. Make the bucket private
update storage.buckets
set public = false
where id = 'assets';

-- 2. Drop existing anon/public policies from Bloque 4
drop policy if exists "Public read access on assets" on storage.objects;
drop policy if exists "Anon upload on assets" on storage.objects;
drop policy if exists "Anon delete on assets" on storage.objects;
drop policy if exists "Anon update on assets" on storage.objects;

-- 3. Ensure we have authenticated policies (Bloque 4 already had INSERT/UPDATE/DELETE)
-- For SELECT, we add a general authenticated reader rule. Next.js API route 
-- will gate the access behind workspace_id verification anyway.
drop policy if exists "Authenticated read on assets" on storage.objects;
create policy "Authenticated read on assets"
  on storage.objects for select to authenticated
  using (bucket_id = 'assets');

commit;
