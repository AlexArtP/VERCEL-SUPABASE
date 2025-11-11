# PRIMER PASO: Clonar la app usando Supabase (Guía ejecutable)

Este documento es una guía práctica y lista para ejecutar que describe paso a paso cómo reconstruir la aplicación "Agenda_Vercel" usando Supabase (plan gratuito), React y React Query. Incluye los scripts SQL para crear tablas, políticas RLS, triggers PL/pgSQL para denormalizar a `calendario_dia`, cron jobs (pg_cron) para heartbeat y auditoría, la plantilla de Edge Function para auditoría, y ejemplos de hooks cliente (`useCalendarioMes`, `useMoverCita`) usando `@supabase/supabase-js`.

Objetivo rápido
----------------
- Stack: React + React Query + Supabase (Postgres, Edge Functions, pg_cron)
- Requisitos: coste bajo (aprovechar cuotas gratuitas), respuesta de calendario mensual <1s p95, mutaciones optimistas <100ms, integridad 100% entre fuente y vista denormalizada.

Instrucciones rápidas (resumen)
--------------------------------
1. Crear proyecto React (Vite o Next.js) e instalar dependencias.
2. Crear proyecto en Supabase.
3. Ejecutar los scripts SQL de este repositorio en el Editor SQL de Supabase.
4. Implementar la Edge Function de auditoría y registrar su URL segura.
5. Añadir cron jobs (pg_cron) para heartbeat y auditoría o usar GitHub Actions si pg_cron no está disponible.
6. Implementar hooks cliente y UI (modales, formularios) usando `@supabase/supabase-js` y React Query.

---

1) Scripts SQL: tablas (fuente de verdad + vista materializada)
-----------------------------------------------------------

Revisa `README/PROMPT/SUPABASE_SQL.md` para el SQL completo (extensiones, tablas, RLS, triggers y helpers de backfill).

---

2) Row Level Security (RLS) — políticas recomendadas
---------------------------------------------------

Las políticas RLS recomendadas se encuentran en `README/PROMPT/SUPABASE_SQL.md`. En resumen: clientes solo leen `calendario_dia` y solo pueden operar sobre sus filas (auth.uid()). Las escrituras críticas (p. ej. backfill, mantenimiento) se realizan via funciones protegidas con `SUPABASE_SERVICE_ROLE_KEY`.

---

3) Triggers y funciones para sincronización (PL/pgSQL)
-----------------------------------------------------

Los triggers que sincronizan `citas` y `modulos` hacia `calendario_dia` están en `README/PROMPT/SUPABASE_SQL.md`. También hay una función `backfill_calendario_dia()` para inicializar la vista cuando ya existen datos.

---

4) Heartbeat (pg_cron) y auditoría
----------------------------------

La plantilla de Edge Function `daily-audit` y la forma de programarla (pg_cron o alternativa) están en `README/PROMPT/SUPABASE_EDGE_FUNCTIONS.md`.

---

5) Cliente: Hooks clave (React Query + supabase-js)
--------------------------------------------------

Ejemplos y el `supabaseClient` están en `README/PROMPT/CLIENT_HOOKS.md`. Incluye `useCalendarioMes`, `useMoverCita`, `useAddPaciente` y `useProfileUpdate` (con el flujo de cambio de contraseña que valida la contraseña actual en un endpoint protegido).

---

6) Seed y demo data
--------------------

Archivo de ejemplo `README/PROMPT/SEED_SQL.md` contiene inserts para profesionales, pacientes, módulos y citas, y la invocación al backfill.

---

Archivos añadidos ahora (resumen)
--------------------------------
- `README/PROMPT/PROMPT_CREACION_SUPABASE.md` — prompt maestro para generar el proyecto completo.
- `README/PROMPT/SUPABASE_SQL.md` — migrations y scripts SQL.
- `README/PROMPT/SUPABASE_EDGE_FUNCTIONS.md` — plantillas de Edge Functions y despliegue.
- `README/PROMPT/CLIENT_HOOKS.md` — hooks cliente y `supabaseClient`.
- `README/PROMPT/SEED_SQL.md` — seed SQL de ejemplo.

Pasos rápidos de uso (Windows / PowerShell)
-----------------------------------------

1) Instalar supabase CLI y autenticarse

```powershell
npm install -g supabase
supabase login
```

2) Instalar dependencias del frontend

```powershell
npm install
```

3) Ejecutar las migraciones SQL

Opción A — SQL Editor (recomendado para principiantes):
- Abrir el Dashboard de Supabase > SQL editor > pegar el contenido de `README/PROMPT/SUPABASE_SQL.md` y ejecutar.

Opción B — psql (si tienes connection string):

```powershell
$env:PG_CONN = 'postgresql://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/postgres'
psql $env:PG_CONN -f .\README\PROMPT\SUPABASE_SQL.md
psql $env:PG_CONN -f .\README\PROMPT\SEED_SQL.md
```

4) Definir variables de entorno

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (solo en server/functions)

Añade estas variables en el panel de Supabase y en Vercel (`Environment Variables`) o `.env.local` para desarrollo. No subir el `SERVICE_ROLE_KEY` a git.

5) Desplegar y probar las Edge Functions

```powershell
supabase functions deploy daily-audit --no-verify
# Para desarrollo local
supabase functions serve daily-audit --env-file .env
```

6) Ejecutar backfill (si es necesario)

Desde SQL editor ejecuta:

```sql
SELECT public.backfill_calendario_dia();
```

7) Levantar frontend en modo desarrollo

```powershell
npm run dev
```

Notas operativas y recomendaciones
---------------------------------
- Si `pg_cron` no está disponible, usa GitHub Actions o un cron externo que llame la Edge Function protegida.
- Usa índices en `citas(profesional_id, fecha)` y `modulos(profesional_id, fecha)` para consultas rápidas.
- Asegúrate de probar RLS con cuentas de prueba (diferentes `auth.users`) antes de producción.

¿Quieres que continúe y genere los archivos del frontend (por ejemplo `lib/supabaseClient.ts`, hooks completos en `lib/hooks/`, y el modal de paciente en `components/`)? Puedo añadirlos y ejecutar una verificación rápida.

Fin del PRIMER PASSO
# PRIMER PASO: Clonar la app usando Supabase (Guía ejecutable)

Este documento es una guía práctica y lista para ejecutar que describe paso a paso cómo reconstruir la aplicación "Agenda_Vercel" usando Supabase (plan gratuito), React y React Query. Incluye los scripts SQL para crear tablas, políticas RLS, triggers PL/pgSQL para denormalizar a `calendario_dia`, cron jobs (pg_cron) para heartbeat y auditoría, la plantilla de Edge Function para auditoría, y ejemplos de hooks cliente (`useCalendarioMes`, `useMoverCita`) usando `@supabase/supabase-js`.

Objetivo rápido
----------------
- Stack: React + React Query + Supabase (Postgres, Edge Functions, pg_cron)
- Requisitos: costo $0 (aprovechar cuotas gratuitas), respuesta de calendario mensual <1s p95, mutaciones optimistas <100ms, integridad 100% entre fuente y vista denormalizada.

Instrucciones rápidas (resumen)
--------------------------------
1. Crear proyecto React (Vite o Next.js) e instalar dependencias.
2. Crear proyecto en Supabase.
3. Ejecutar los scripts SQL de este archivo en el Editor SQL de Supabase.
4. Implementar la Edge Function de auditoría y registrar su URL segura.
5. Añadir cron jobs (pg_cron) para heartbeat y auditoría.
6. Implementar hooks cliente y UI (modales, formularios) usando `@supabase/supabase-js` y React Query.

---

1) Scripts SQL: tablas (fuente de verdad + vista materializada)
-----------------------------------------------------------

-- 1.1 Tabla `profesionales` (usuario de auth)
CREATE TABLE public.profesionales (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  email TEXT
);

-- 1.2 Tabla `pacientes`
CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid REFERENCES public.profesionales(id),
  nombre TEXT NOT NULL,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  run TEXT,
  fecha_nacimiento DATE,
  email TEXT,
  telefono TEXT,
  created_at timestamptz DEFAULT now()
);

-- 1.3 Tabla `modulos` (disponibilidad)
CREATE TABLE public.modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid REFERENCES public.profesionales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  tipo TEXT
);

-- 1.4 Tabla `citas` (fuente de verdad)
CREATE TABLE public.citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid REFERENCES public.profesionales(id) ON DELETE CASCADE,
  paciente_id uuid REFERENCES public.pacientes(id),
  modulo_id uuid REFERENCES public.modulos(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado TEXT DEFAULT 'confirmada',
  paciente_nombre_cache TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.5 Tabla denormalizada `calendario_dia` (vista materializada en JSONB)
CREATE TABLE public.calendario_dia (
  profesional_id uuid NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  modulos jsonb DEFAULT '{}'::jsonb,
  citas jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  PRIMARY KEY (profesional_id, fecha)
);

-- 1.6 Tabla para heartbeat
CREATE TABLE IF NOT EXISTS public.system_heartbeat (id int PRIMARY KEY, last_ping timestamptz);
INSERT INTO public.system_heartbeat (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

---

2) Row Level Security (RLS) — políticas recomendadas
---------------------------------------------------
-- Habilitar RLS
ALTER TABLE public.profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_dia ENABLE ROW LEVEL SECURITY;

-- Políticas
-- Profesionales solo pueden ver/editar su perfil
CREATE POLICY user_can_manage_own_profile ON public.profesionales
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Profesionales gestionan sus módulos
CREATE POLICY profesional_can_manage_own_modulos ON public.modulos
  FOR ALL USING (auth.uid() = profesional_id) WITH CHECK (auth.uid() = profesional_id);

-- Profesionales gestionan sus citas
CREATE POLICY profesional_can_manage_own_citas ON public.citas
  FOR ALL USING (auth.uid() = profesional_id) WITH CHECK (auth.uid() = profesional_id);

-- La vista `calendario_dia` es solo lectura desde el cliente
CREATE POLICY profesional_can_read_own_calendar_view ON public.calendario_dia
  FOR SELECT USING (auth.uid() = profesional_id);

-- NOTA: Writes/updates a `calendario_dia` los realizará solo el backend (las funciones/trigger).

---

3) Triggers y funciones para sincronización (PL/pgSQL)
-----------------------------------------------------
-- 3.1 Función: manejar escrituras en `citas`
CREATE OR REPLACE FUNCTION public.handle_cita_write()
RETURNS TRIGGER AS $$
DECLARE
  v_prof_id uuid;
  v_fecha date;
  v_cita_id uuid;
  v_cita_compacta jsonb;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_prof_id := OLD.profesional_id;
    v_fecha := OLD.fecha;
    v_cita_id := OLD.id;
  ELSE
    v_prof_id := NEW.profesional_id;
    v_fecha := NEW.fecha;
    v_cita_id := NEW.id;
    v_cita_compacta := jsonb_build_object(
      'id', NEW.id,
      'horaInicio', NEW.hora_inicio,
      'horaFin', NEW.hora_fin,
      'pacienteId', NEW.paciente_id,
      'moduloId', NEW.modulo_id,
      'estado', NEW.estado,
      'pacienteNombre', NEW.paciente_nombre_cache
    );
  END IF;

  INSERT INTO public.calendario_dia (profesional_id, fecha, citas)
  VALUES (v_prof_id, v_fecha, jsonb_build_object(v_cita_id::text, v_cita_compacta))
  ON CONFLICT (profesional_id, fecha)
  DO UPDATE SET
    citas = CASE
      WHEN (TG_OP = 'DELETE') THEN (calendario_dia.citas - v_cita_id::text)
      ELSE calendario_dia.citas || jsonb_build_object(v_cita_id::text, v_cita_compacta)
    END,
    last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_cita_write
  AFTER INSERT OR UPDATE OR DELETE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.handle_cita_write();

-- 3.2 Función: manejar escrituras en `modulos` (similar)
CREATE OR REPLACE FUNCTION public.handle_modulo_write()
RETURNS TRIGGER AS $$
DECLARE
  v_prof_id uuid;
  v_fecha date;
  v_modulo_id uuid;
  v_modulo_compacto jsonb;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_prof_id := OLD.profesional_id;
    v_fecha := OLD.fecha;
    v_modulo_id := OLD.id;
  ELSE
    v_prof_id := NEW.profesional_id;
    v_fecha := NEW.fecha;
    v_modulo_id := NEW.id;
    v_modulo_compacto := jsonb_build_object(
      'id', NEW.id,
      'horaInicio', NEW.hora_inicio,
      'horaFin', NEW.hora_fin,
      'tipo', NEW.tipo
    );
  END IF;

  INSERT INTO public.calendario_dia (profesional_id, fecha, modulos)
  VALUES (v_prof_id, v_fecha, jsonb_build_object(v_modulo_id::text, v_modulo_compacto))
  ON CONFLICT (profesional_id, fecha)
  DO UPDATE SET
    modulos = CASE
      WHEN (TG_OP = 'DELETE') THEN (calendario_dia.modulos - v_modulo_id::text)
      ELSE calendario_dia.modulos || jsonb_build_object(v_modulo_id::text, v_modulo_compacto)
    END,
    last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_modulo_write
  AFTER INSERT OR UPDATE OR DELETE ON public.modulos
  FOR EACH ROW EXECUTE FUNCTION public.handle_modulo_write();

---

4) Heartbeat (pg_cron) y auditoría
----------------------------------
-- 4.1 Heartbeat: evita pausa por inactividad (ejecutar en SQL editor del proyecto)
CREATE OR REPLACE FUNCTION public.daily_heartbeat()
RETURNS void AS $$
  UPDATE public.system_heartbeat SET last_ping = now() WHERE id = 1;
$$ LANGUAGE sql;

-- Programar cron (requiere extensión pg_cron activada en Supabase)
SELECT cron.schedule('daily-heartbeat', '0 12 * * *', $$CALL daily_heartbeat()$$);

-- 4.2 Auditoría: registrar drift en public.audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  profesional_id uuid,
  fecha date,
  issue_type text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Programar daily-audit que llame a una Edge Function (URL protegida)
-- Reemplaza [TU_URL_DE_EDGE_FUNCTION_AQUI] y [TU_SERVICE_ROLE_KEY]
SELECT cron.schedule(
  'daily-audit',
  '0 2 * * *',
  $$
    SELECT net.http_post(
      url:='[TU_URL_DE_EDGE_FUNCTION_AQUI]',
      headers:='{"Authorization": "Bearer [TU_SERVICE_ROLE_KEY]"}'
    )
  $$
);

---

5) Edge Function (TypeScript) — auditoría básica
-------------------------------------------------
// supabase/functions/daily-audit/index.ts
import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Leer profesionales
  const { data: profs } = await supabase.from('profesionales').select('id')
  for (const p of profs || []) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const fecha = yesterday.toISOString().split('T')[0]

    const { data: citas } = await supabase.from('citas').select('*').eq('profesional_id', p.id).eq('fecha', fecha)
    const { data: view } = await supabase.from('calendario_dia').select('citas').eq('profesional_id', p.id).eq('fecha', fecha)

    // Comparar y registrar drift
    // (implementar comparación: ids faltantes, extra, mismatch)
    const drift = [] // construir detalles
    if (drift.length > 0) {
      await supabase.from('audit_logs').insert({ profesional_id: p.id, fecha, issue_type: 'drift', details: { drift } })
    }
  }

  return new Response(JSON.stringify({ success: true }))
})

---

6) Cliente: Hooks clave (React Query + supabase-js)
--------------------------------------------------
// Ejemplo: useCalendarioMes
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useCalendarioMes(profId, yearMonth) {
  const [firstDay, lastDay] = monthRangeFromYYYYMM(yearMonth)
  return useQuery(['calendario', profId, yearMonth], async () => {
    const { data, error } = await supabase
      .from('calendario_dia')
      .select('fecha, citas, modulos')
      .eq('profesional_id', profId)
      .gte('fecha', firstDay)
      .lte('fecha', lastDay)
    if (error) throw error
    return data
  }, { staleTime: 1000 * 60 * 5 })
}

// Ejemplo: useMoverCita (optimistic update)
import { useMutation, useQueryClient } from '@tanstack/react-query'
export function useMoverCita() {
  const qc = useQueryClient()
  return useMutation(async ({ id, newDate, newTime }) => {
    const { error } = await supabase.from('citas').update({ fecha: newDate, hora_inicio: newTime }).eq('id', id)
    if (error) throw error
    return true
  }, {
    onMutate: async (variables) => {
      await qc.cancelQueries()
      const previous = qc.getQueriesData()
      // Aplicar cambio optimista en caches relevantes (calendario, citas)
      return { previous }
    },
    onError: (err, vars, context) => {
      // rollback usando context.previous
    },
    onSettled: () => {
      qc.invalidateQueries()
    }
  })
}

---

7) Migración, Backfill y Rollback
---------------------------------
- Proveer `supabase/seed.sql` con demo data. Los triggers construirán `calendario_dia` automáticamente.
- Implementar feature flag `ENABLE_NEW_CALENDAR` para alternar entre lectura denormalizada (`calendario_dia`) y lectura legacy (JOIN entre `citas` y `modulos`).

---

8) Checklist final antes de producción
-------------------------------------
- [ ] Probar reglas RLS en Supabase local/emulator.
- [ ] Verificar latencias de consultas (p95) para carga mensual (~30 filas por mes).
- [ ] Verificar que `daily-heartbeat` se ejecuta y evita suspensión.
- [ ] Asegurar que todas las mutaciones pasan por triggers y que la auditoría muestra 0 drift después de backfill.

---

Notas y recomendaciones operativas
---------------------------------
- Usa índices en `citas(profesional_id, fecha)` y `modulos(profesional_id, fecha)` para acelerar consultas.
- Evita operaciones masivas sin paginación; usa batch jobs para backfill.
- Protege la URL de la Edge Function con Service Role Key y usa pg_cron net.http_post con esa key.

Si quieres, genero a continuación:
- El archivo `supabase/seed.sql` con datos de ejemplo.
- Un `supabase/functions/daily-audit/index.ts` completo con comparación y reporte.
- Los hooks React completos y una pequeña UI (modal de paciente) adaptada al cliente Supabase.

Fin del PRIMER PASSO
