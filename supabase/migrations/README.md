# Supabase Migrations - 513 HUB

Este directorio contiene todas las migraciones SQL que construyen el esquema de la base de datos para 513 HUB.

## Orden de Ejecución (v1.5)

Para montar un entorno de staging o producción desde cero, ejecuta estos archivos **exclusivamente y en orden**:

1. `001_initial_schema.sql` (Esquema principal, tablas base de v1.0)
2. `005_verify_schema.sql` (Semilleros/Seeds de status, y reglas restrictivas base)
3. `006_performance_indexes.sql` (Mejoras de rendimiento para v1.0)
4. `010_v15_new_tables.sql` (Añade las 6 nuevas tablas de v1.5 incluyendo workspaces y teams)
5. `010b_v15_workspace_id_backfill.sql` (Asienta y puebla el tenant id `workspace_id`)
6. `010c_v15_widen_v10_policies.sql` (Parche de seguridad para que el Admin UI siga funcionando pre-RLS absoluto)
7. `011_v15_indexes_and_helpers.sql` (Índices topológicos de la DB relacionales y Funciones `security definer` cruciales para RLS)
8. `012_v15_rls.sql` (Ejecución del RLS robusto: revoca acceso anon y sella la base de datos con multi-tenant paramétrico)
9. `013_v15_private_bucket.sql` (Revoca permisos públicos del Storage bucket "assets" y aplica barrera de privacidad)

> **Nota:** Todos los archivos SQL fueron diseñados para ser iterativos y de ejecución idempotent (usando `if not exists` y `create or replace`). Sin embargo, el orden debe respetarse.

---

## Archivos Obsoletos (DEPRECATED)

Los siguientes archivos fueron utilizados durante el prototipado en las primeras etapas del desarrollo y ya NO aplican para v1.5:

- `003_fix_rls_prototyping.sql` — Reemplazado permanentemente por `012_v15_rls.sql`.
- `004_storage_assets.sql` — Modificado y asegurado posteriormente por `013_v15_private_bucket.sql`.
