const fs = require('fs');
const text = fs.readFileSync('C:/Users/ricru/Desktop/WORKSPACE AI/CLAUDE CODE EXPERIMENTOS/SOCIAL MEDIA AGENCY/513-HUB-V1-AUDIT.md', 'utf8');
const regex = /### 4\.5 Políticas RLS — team vs client_viewer[\s\S]*?```sql([\s\S]*?)```/;
const match = text.match(regex);
if (match) {
  let sql = match[1];
  let injected = `begin;

-- =========================================================
-- DROPS DE POLICÍAS TEMPORALES ANTIGUAS Y PROTOTIPADO
-- =========================================================
do \\$\\$
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
end \\$\\$;
`;
  sql = sql.replace('begin;', injected);
  fs.writeFileSync('C:/Users/ricru/Desktop/WORKSPACE AI/CLAUDE CODE EXPERIMENTOS/SOCIAL MEDIA AGENCY/513-hub v2.0/supabase/migrations/012_v15_rls.sql', sql.trim());
  console.log('012 written successfully');
} else {
  console.log('Not found');
}
