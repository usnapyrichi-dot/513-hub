# 513 HUB — Changelog

> Historial completo de cambios implementados en sesiones de desarrollo.

---

## Sprint 1 — Kanban & Limpieza
- **Kanban refactorizado** en Server Component + Client Component
- **4 columnas** con estados correctos: Ideation / Production / Review / Published
- **Drag & drop nativo HTML5** con optimistic update + rollback
- Indicador de estado "Guardando..." con toast
- Eliminado `test.css` (41 KB basura)
- `next.config.ts → next.config.js` para compatibilidad SWC

## Sprint 2 — Content Studio completo
### 2-A Assets
- Dropzone real con drag & drop + click para subir
- Upload directo a **Supabase Storage** (bucket `assets`, 100 MB/archivo)
- Barra de progreso por archivo
- Grid de previsualización: imágenes, vídeos (play on hover), archivos diseño
- **Versionado automático** (v1, v2…) por nombre de archivo
- Marcar como FINAL (badge dorado), abrir en nueva pestaña, eliminar con confirmación

### 2-B Comments
- Tab "Chat" en sidebar derecho con badge rojo de pendientes
- 4 tipos: Diseño (azul) / Copy (morado) / Concepto (naranja) / Menor (gris)
- Resolución individual → sección "Resueltos" con tachado
- ⌘↵ para enviar rápido

### 2-C Briefings
- Tab "Briefing" en sidebar
- Campos: Objetivo, Audiencia, Key Messages (lista dinámica), Efemérides, Restricciones
- CRUD sobre tabla `briefings`

## Sprint 3 — AI Studio
- **Generador de Copy** con Gemini 2.5 Flash: Hook + Cuerpo + CTA + Hashtags, usando tono de marca
- **Generador de Video Prompts** para Higgsfield/Veo/Kling: Escena + Cámara + Iluminación + Prompt final en inglés
- **Biblioteca de prompts** con filtros por tipo y favoritos ⭐
- **Sistema de Gems por cliente**: panel colapsable en AI Studio para pegar system instructions; se guardan en localStorage por cliente; se inyectan como `system_instruction` en la API de Gemini
- maxOutputTokens subido a 8192 en todos los generadores

## Sprint 4 — UX Core
### 4-A New Piece Modal
- Botón "Nueva Pieza" en Content Master abre modal con: título, cliente, tipo, plataformas, fecha
- Crea en DB y redirige al Content Studio

### 4-B Brand Guidelines Editor
- Editor completo en `/clients/[id]`: Tono, Paleta de colores (picker), DO's y DON'Ts
- Se guarda en `clients.brand_guidelines` y el AI Studio lo usa automáticamente

### 4-C Calendar Mensual
- Grid mensual real con navegación mes a mes
- Piezas en sus fechas de publicación con color por estado
- Sección "Sin Fecha" al pie
- Leyenda de colores

## Sprint 5 — Nuevas páginas
### 5-A Presentations
- Generador de PDF mensual por cliente con ReportLab (Python)
- Portada negra con branding 513 HUB, estadísticas, detalle de piezas
- API route `/api/generate-pdf` con spawn Python
- Incluye description, copy_out, visual_description en el PDF

### 5-B Content Master con filtros
- Búsqueda por título/marca
- Filtros: cliente, estado (agrupado), tipo de formato
- Ordenación: más recientes / fecha publicación / por estado

### 5-C Settings
- Nombre de agencia y tagline (persiste en localStorage)
- Links a Google AI Studio y Supabase Dashboard
- Toggles de notificaciones

## Sprint 6 — Mejoras de Content Studio
### 6-A Tabs en editor
- 3 tabs: **Concepto** / **Copy Out** / **Descripción Visual**
- Cada tab guarda en su columna correspondiente (`description`, `copy_out`, `visual_description`)

### 6-B Quick-add en Kanban
- Botón "+" en cada columna abre formulario inline
- Crea pieza en el status de esa columna y redirige al detail

### 6-C Toast notifications
- Sistema global de toasts (success/error/info) via `ToastProvider`
- Integrado en: Kanban drag & drop, content editor saves, status changes

### 6-D Sidebar mejorado
- **Fecha de publicación** editable inline con `<input type="date">`
- **Plataformas** editables con toggle chips (Instagram/TikTok/LinkedIn/YouTube)
- Status stepper visual con todos los estados del workflow

## Sprint 7 — Assets Global & Types
### 7-A Assets page
- Galería global de todos los assets del proyecto
- Filtros: búsqueda, cliente, tipo de archivo, solo FINAL
- Contador de tamaño total
- Acciones: descargar, marcar final, eliminar
- Vídeos con preview on hover

### 7-B/C Tipos y Ideation
- `types/database.ts` actualizado (`ref_links` en lugar de `references`)
- Ideation Studio: modo "Pieza Existente" para vincular resultado a pieza ya creada
- Toggle Nueva Pieza / Pieza Existente con selector dropdown
- Redirige al Content Studio tras guardar

## Sprint 8 — Dashboard & Gem ubiquity
### 8-C Dashboard Stats Bar
- 5 cards con conteo total y por columna (Ideation/Producción/Review/Publicado)
- Barra de progreso proporcional por cada estado

### 8-D Gem en Ideation
- Gem del cliente también se aplica al generar ideas en Ideation Studio
- Badge "GEM ACTIVO" visible en el panel de contexto de marca

### 8-E Client Detail Metrics
- Stats bar en la ficha de cliente: total piezas, en producción, en review, publicadas
- Link rápido "Ver todas" al Content Master

## Sprint 9 — Status UX & PDF
### 9-A Status Stepper
- Reemplaza 3 botones fijos por un grid visual de todos los estados del workflow
- Badge de estado actual con color, grid de estados disponibles
- Transitions con indicador de carga

### 9-B PDF Enriquecido
- El PDF de presentaciones ahora incluye `copy_out` y `visual_description` por pieza
- Etiquetas "COPY OUT" y "DESCRIPCIÓN VISUAL" separadas visualmente

## Sprint 10 — Header, Error Boundary, Performance
### 10-A Header dinámico
- El avatar del header muestra las iniciales del nombre de agencia (desde Settings)
- Hover cambia a rojo

### 10-B Error Boundary
- Componente `ErrorBoundary` React para capturar crashes
- UI de error con botón "Reintentar"

### 10-C Indicador Gem
- Badge "GEM ACTIVO" visible en el panel izquierdo del Ideation Studio

### 10-D Performance Indexes
- 10 índices SQL añadidos en Supabase para consultas más rápidas

## Sprint 11 — Delete, Sort, Calendar UX
### 11-A Delete Pieza
- Botón "Eliminar pieza" en zona de peligro del sidebar
- Confirmación + redirect a Content Master

### 11-B Sort en Content Master
- Selector de ordenación: Más recientes / Por fecha de publicación / Por estado

### 11-C Calendar Quick-Create
- Hover sobre un día vacío muestra botón "+"
- Click navega a /content con fecha prefijada en el query param

---

## Esquema de Base de Datos (Supabase)

### Tablas
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Usuarios del sistema |
| `clients` | Clientes/marcas con brand_guidelines JSONB |
| `car_models` | Modelos de coches por cliente |
| `content_pieces` | Piezas de contenido (18 columnas) |
| `briefings` | Briefings por pieza |
| `ideas` | Ideas generadas por pieza |
| `assets` | Archivos multimedia |
| `comments` | Comentarios/feedback |
| `reviews` | Ciclos de revisión |
| `production_tasks` | Tareas de producción |
| `presentations` | Presentaciones mensuales |
| `ai_prompts` | Prompts guardados de IA |

### Storage
- Bucket `assets` (público, 100 MB/archivo)

### Migraciones
- `001_initial_schema.sql` — Schema base
- `003_fix_rls_prototyping.sql` — RLS permisiva para prototipo
- `004_storage_assets.sql` — Bucket de storage
- `005_verify_schema.sql` — Verificación y fix de columnas
- `006_performance_indexes.sql` — Índices de performance
