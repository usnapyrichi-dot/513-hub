# 513 HUB — Deploy en Vercel

## Pre-requisitos
- Cuenta en [vercel.com](https://vercel.com) (gratis)
- El código subido a GitHub (o GitLab / Bitbucket)

---

## Paso 1 — Subir el código a GitHub

Si aún no tienes el repo en GitHub:

```bash
cd 513-hub
git init
git add .
git commit -m "feat: 513 HUB — deploy ready"
```

Luego crea un repositorio nuevo en github.com (sin README) y ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/513-hub.git
git branch -M main
git push -u origin main
```

> **⚠️ Importante:** El archivo `.env.local` tiene tus credenciales reales.
> Ya está incluido en `.gitignore` por defecto — **nunca lo subas a GitHub**.

---

## Paso 2 — Importar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Haz clic en **"Import Git Repository"**
3. Selecciona tu repositorio `513-hub`
4. En **"Configure Project"**:
   - Framework Preset: **Next.js** (se detecta automáticamente)
   - Root Directory: `.` (raíz del proyecto)
   - Build Command: `npm run build` (por defecto)
   - Output Directory: `.next` (por defecto)

---

## Paso 3 — Variables de entorno

Antes de hacer clic en **Deploy**, añade las siguientes variables en la sección **"Environment Variables"**:

| Variable | Dónde encontrarla |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Tu archivo `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu archivo `.env.local` |
| `GEMINI_API_KEY` | Tu archivo `.env.local` |

Copia los valores desde tu `.env.local` — **nunca los escribas directamente en este archivo ni en ningún archivo que vayas a subir a GitHub**.

---

## Paso 4 — Deploy

Haz clic en **"Deploy"**. El build tarda ~2 minutos. Cuando termine, Vercel te da una URL del tipo:

```
https://513-hub-xyz.vercel.app
```

¡Eso es todo. Ya puedes compartir esa URL con quien quieras!

---

## Acceso y autenticación

La app usa las RLS de Supabase en modo permisivo (prototipo). Cualquier persona con el link puede entrar. Si en el futuro quieres protegerla con login, tienes que activar la autenticación de Supabase y restringir las RLS.

---

## Actualizaciones futuras

Cada vez que hagas cambios y los subas a GitHub:
```bash
git add .
git commit -m "feat: descripción del cambio"
git push
```
Vercel lo detecta automáticamente y redespliega en ~1 minuto.

---

## Cambios en este deploy

- ✅ PDF generation reescrito en JavaScript puro (`pdf-lib`) — ya no depende de Python
- ✅ TypeScript build errors corregidos (JSX y tipos Supabase)
- ✅ Todas las rutas compilan y pasan el build de producción
