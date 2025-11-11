# PROMPT DE CREACIÓN (Supabase) — Repositorio completo

Objetivo
--------
Eres una IA experta en ingeniería de software. Tu tarea es generar un repositorio completo (estructura de archivos, código, scripts y documentación) que replique funcionalmente la aplicación "Agenda_Vercel" usando Supabase como backend (Postgres + RLS + pg_cron + Edge Functions) y React/TypeScript en el frontend (Next.js con app-router preferido). El repositorio debe ser listo para desplegar en Vercel (o en Supabase Hosting) y contener pruebas mínimas y scripts de inicialización.

Entrega esperada (archivo por archivo)
--------------------------------------
- package.json (project config)
- tsconfig.json
- next.config.mjs (si Next.js)
- app/ (rutas, layout, page.tsx)
- components/ (todos los componentes React/TSX necesarios)
- contexts/ (AuthContext, DataContext)
- lib/
  - supabaseClient.ts (inicialización con env)
  - apiHelpers.ts (wrappers para llamadas servidor/edge)
- pages/api/ (endpoints serverless que requieran service role)
- supabase/
  - migrations/*.sql (todo SQL: tablas, RLS, triggers)
  - seed.sql
  - functions/daily-audit (Edge function)
- README.md con pasos de despliegue
- .github/workflows/ci.yml (build + lint + tests)

Requisitos funcionales (de la app)
---------------------------------
1. Autenticación: usar `@supabase/supabase-js` con login por email/password. Los `profesionales` se mapearán con `auth.users.id`.
2. Perfil de profesional: editar perfil; agregar menú de tres puntos junto a "Editar" con opciones:
   - Cambiar contraseña (modal que pide contraseña actual + nueva + confirmar)
   - Deshabilitar agenda (modal con motivo obligatorio). Al deshabilitar, persistir en tabla `profesionales_config` o similar.
3. Calendar: vista mensual + vista por día. Si agenda deshabilitada, mostrar banner en calendario: "Agenda deshabilitada por profesional, MOTIVO: ..." (leer campo desde DB).
4. Pacientes: modal de registro con campos (nombre, apellido paterno, apellido materno, RUN formateado y validado, fecha nacimiento con cálculo de edad en UI, tratantes: psiquiatra/psicólogo/asistente social). Guardar en tabla `pacientes`.
5. Citas y módulos: fuente de verdad `citas` y `modulos`. Denormalizar a `calendario_dia` (JSONB) mediante triggers para lecturas rápidas.
6. Mutaciones: deben ser seguras y pasar por RLS o endpoints que usen Service Role (dependiendo de la operación). Las mutaciones de citas/modulos deben actualizar `calendario_dia` vía triggers.
7. Hooks cliente: proveer `useCalendarioMes`, `useMoverCita`, `useAddPaciente`, `useProfileUpdate` con React Query y manejo optimista.
8. Auditoría: Edge Function diaria que compare `citas` con `calendario_dia`, y registre `audit_logs` si detecta drift.

Calidad y pruebas
-----------------
- Incluir al menos 2 tests unitarios básicos (por ejemplo: validación de RUN, cálculo de edad) y 1 test de integración ligero para hooks (mock Supabase con msw o similar).
- Lint y Prettier configurados.

Detalles de la instrucción para la IA que generará el repo
---------------------------------------------------------
Genera todo el código en TypeScript. Estructura el frontend con Next.js (app dir) y componentes en `components/`. Implementa `contexts/AuthContext` que usa `supabase.auth` y `DataContext` que abstrae queries/mutations (usa React Query). Crea `lib/supabaseClient.ts` con una función `getSupabaseClient()` que usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para cliente y `SUPABASE_SERVICE_ROLE_KEY` en server functions.

SQL y seguridad
---------------
Incluye migrations SQL para:
- extensiones necesarias: pgcrypto, pg_cron (si disponible)
- tablas: profesionales, pacientes, modulos, citas, calendario_dia, profesionales_config, audit_logs, system_heartbeat
- índices: (profesional_id, fecha) en citas y modulos
- RLS: políticas estrictas. Clientes solo pueden seleccionar de `calendario_dia` y sus tablas propias; writes a `calendario_dia` solo desde triggers. Incluye políticas exemplares en SQL.

Edge Functions y cron
---------------------
Incluye una Edge Function TypeScript que:
- corre con `SUPABASE_SERVICE_ROLE_KEY`
- consulta `citas` y `calendario_dia` por profesional + fecha (ayer)
- detecta drift y escribe en `audit_logs`
Agrega instrucciones para registrar la función y programar vía pg_cron un POST seguro.

Hooks y UX
----------
Provee hooks con React Query para:
- `useCalendarioMes(profId, yearMonth)`
- `useMoverCita()` (optimistic update + rollback)
- `useAddPaciente()`
- `useProfileUpdate()` (incluye cambiar contraseña con verificación de contraseña actual)

Salida esperada por la IA
-------------------------
Genera los archivos completos, mini-tests, scripts de NPM y un `README.md` con instrucciones de despliegue (supabase CLI o web UI). Asegúrate que todos los valores sensibles usen variables de entorno y que el repo sea reproducible.

Fin del prompt. Responde únicamente con la estructura del proyecto y confirma que vas a generar los archivos (no los generes aquí, ese es el trabajo que harás luego). 
