# Matriz de Testing RLS - v1.5 Multi-tenant

Esta matriz documenta los 18 casos de prueba manuales y automatizables que verifican el correcto aislamiento multitenant mediante las Row-Level Security (RLS) policies de la aplicación 513 HUB.

## Casos de Prueba

| # | Caso | Actor | Acción | Esperado | Verificación |
|---|---|---|---|---|---|
| 1 | Dashboard admin | Admin (workspace 513 HUB) | Abrir `/` | Ve sus clientes y piezas | Contar filas en UI |
| 2 | Dashboard sin acceso | `test-noaccess` | Abrir `/` | Ve 0 clientes, 0 piezas | Contar filas en UI |
| 3 | Dashboard otro workspace | `test-otherws` | Abrir `/` | Ve "Cliente Ajeno" y "Pieza Ajena" | Contar filas en UI |
| 4 | Aislamiento cruzado | `test-otherws` | Intentar abrir URL `/content/{id-de-pieza-del-admin}` | 404 o "sin permisos" | Inspección de respuesta |
| 5 | Insert content_piece | Admin | Crear pieza desde Kanban | Se crea con workspace_id correcto | SQL: filtrar por nueva pieza |
| 6 | Insert content_piece bloqueado | `test-noaccess` | Llamar server action `createContentPiece` | Error devuelto | Revisar server logs |
| 7 | Update briefing | Admin | Guardar briefing en pieza propia | OK | UI + SQL |
| 8 | Update briefing cruzado | `test-otherws` | Intentar upsertBriefing sobre pieza del admin | Error | Server logs |
| 9 | Insert comment | Admin | Añadir comment | OK | UI + SQL |
| 10 | Resolve comment | Admin | Marcar resolved | OK | UI + SQL |
| 11 | Delete content_piece | Admin | Borrar desde content-editor | OK | SQL: fila desaparece |
| 12 | Delete cruzado | `test-otherws` | Server action `deleteContentPiece(id-del-admin)` | Error o 0 filas afectadas | Server logs + SQL |
| 13 | Upload asset | Admin | Subir imagen en asset-gallery | OK, file aparece | Supabase Storage UI |
| 14 | Read asset ajeno | `test-otherws` | Abrir URL firmada de asset del admin | 403 al expirar / error si intenta firmar | Browser + Storage logs |
| 15 | Generate PDF propio | Admin | `/presentations` → generar | Descarga PDF | Fichero descargado |
| 16 | Generate PDF cruzado | `test-otherws` | `/api/generate-pdf` pasando `clientId` del admin | Error 403 o PDF vacío | Respuesta HTTP |
| 17 | AI prompt insert | Admin | AI Studio → guardar prompt | OK | SQL: fila con workspace_id |
| 18 | AI prompt lectura cruzada | `test-otherws` | AI Studio | Ve sus propios prompts (si los hay), NO los del admin | UI |

---

## Entidades de Prueba (Mocks en Staging)

Usuarios a crear:
- `test-noaccess@513hub.test` (sin ninguna membership)
- `test-otherws@513hub.test` (asignado a workspace "Otra Agencia")
- `test-client@513hub.test` (futuro client_viewer)

Workspace de prueba:
`Otra Agencia` (Slug: `otra-agencia`)
Cliente mock: `Cliente Ajeno`
Pieza mock: `Pieza Ajena`
