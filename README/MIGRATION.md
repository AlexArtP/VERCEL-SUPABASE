# Migration & Local Runbook (Firestore → Supabase)

Resumen reproducible de los pasos realizados para migrar la base a Supabase local y cómo verificarlo.

Requisitos
- Docker Desktop (Windows) — engine running
- Supabase CLI en el repositorio: `./supabase/supabase.exe` (o `supabase` instalado globalmente)
- Node 18+ y dependencias del proyecto (`npm install`)

Pasos ejecutados (reproducible)

1) Levantar Supabase local

- En PowerShell (en la raíz del repo):

```powershell
# arrancar supabase local stack (postgres + rest + realtime)
& '.\supabase\supabase.exe' start
```

2) Aplicar migraciones (Postgres)

- He creado un script que aplica `migrations/001_init.sql` y `migrations/002_seed.sql`.

```powershell
# opcional: exportar DATABASE_URL si quieres apuntar a otro Postgres
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:54322/postgres'
node .\scripts\apply_migrations.js
```

- Si la seed falla por claves foráneas sobre `auth.users`, ejecuta el helper que inserta usuarios y reintenta:

```powershell
node .\scripts\seed_users_and_retry.js
```

3) Comprobaciones básicas (tablas y conteos)

```powershell
node .\scripts\check_tables.js
# salida esperada: filas en public.profesionales, public.pacientes, public.modulos, public.citas, public.calendario_dia, auth.users
```

4) Probar endpoints server-side (Next.js)

- Para arrancar Next dev necesitas las variables públicas de Supabase. En PowerShell:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='http://localhost:54321'
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY='demo_anon_key'
npm run dev
```

- GET `/api/profile?id=1` — este endpoint primero intenta leer de Supabase (`usuarios` table). Si `usuarios` no existe o no hay `SUPABASE_SERVICE_ROLE_KEY` configurada, cae en `DEMO_DATA`. Por tanto puedes probarlo así:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/profile?id=1" -Method GET
```

- POST `/api/auth/change-password` — flujo:
  1. Intenta reauth con el cliente público (email+password). Si no existe la contraseña en `auth.users` el intento fallará con 401/`invalid_credentials`.
  2. Si la reauth es correcta, el endpoint intenta actualizar la contraseña usando la `SUPABASE_SERVICE_ROLE_KEY` (server-side). Si no hay `SUPABASE_SERVICE_ROLE_KEY`, devolverá `Service role not configured`.

Ejemplo de prueba (esperado: invalid_credentials o error si no hay service role):

```powershell
# desde el repo
node .\scripts\test_change_password_flow.js
```

5) Notas y observaciones
- `migrations/001_init.sql` configuró tablas y triggers. `migrations/002_seed.sql` añade datos de ejemplo; la seed asume que existen entradas en `auth.users` para las mismas UUIDs de `profesionales` — por eso el script `seed_users_and_retry.js` crea esas filas si faltan.
- `lib/supabaseClient.ts` requiere `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para arrancar Next en dev. `createServiceRoleClient()` requiere `SUPABASE_SERVICE_ROLE_KEY` y lanzará si no está configurada (por seguridad).
- Para pruebas end-to-end completas (cambio de contraseña, reauth real), debes provisionar usuarios en `auth.users` con contraseña válida o usar el panel de Supabase para crear cuentas.

Siguientes pasos recomendados
- Añadir migración para crear tabla `usuarios` si quieres que `/api/profile` lea desde DB en lugar de `DEMO_DATA`.
- Agregar `SUPABASE_SERVICE_ROLE_KEY` como secret en tu entorno local (no commitear) para probar endpoints administrativos.
- E2E: escribir un Playwright test para el flujo de cambio de contraseña usando una cuenta creada por la suite de tests.

---

Si quieres, actualizo este archivo para incluir las entradas exactas del output que obtuve en esta sesión (tablas, filas y respuesta de endpoints). ¿Lo añado ahora?