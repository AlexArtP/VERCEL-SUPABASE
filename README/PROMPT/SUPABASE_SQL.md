# SUPABASE SQL — Migrations completas

Este archivo contiene un set completo de scripts SQL para crear la schema necesaria para la app "Agenda_Vercel" en Supabase. Incluye extensiones, tablas, índices, RLS, funciones (PL/pgSQL) y triggers.

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- pg_cron puede no estar disponible en todos los planes; si está, descomenta
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- TABLAS
CREATE TABLE public.profesionales (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  email TEXT,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profesionales_config (
  profesional_id uuid PRIMARY KEY REFERENCES public.profesionales(id) ON DELETE CASCADE,
  agenda_habilitada boolean DEFAULT true,
  motivo_deshabilitado text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid REFERENCES public.profesionales(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  run TEXT,
  fecha_nacimiento DATE,
  email TEXT,
  telefono TEXT,
  tratantes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id uuid REFERENCES public.profesionales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  tipo TEXT,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE public.calendario_dia (
  profesional_id uuid NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  modulos jsonb DEFAULT '{}'::jsonb,
  citas jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  PRIMARY KEY (profesional_id, fecha)
);

CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  profesional_id uuid,
  fecha date,
  issue_type text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_heartbeat (id int PRIMARY KEY, last_ping timestamptz);
INSERT INTO public.system_heartbeat (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_citas_prof_fecha ON public.citas (profesional_id, fecha);
CREATE INDEX IF NOT EXISTS idx_modulos_prof_fecha ON public.modulos (profesional_id, fecha);

-- RLS
ALTER TABLE public.profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesionales_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario_dia ENABLE ROW LEVEL SECURITY;

-- Políticas: profesionales pueden gestionar su propio perfil
CREATE POLICY profesionales_manage_own ON public.profesionales
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Configuración agenda
CREATE POLICY profesionales_manage_own_config ON public.profesionales_config
  FOR ALL USING (auth.uid() = profesional_id) WITH CHECK (auth.uid() = profesional_id);

-- Pacientes: solo lectura/escritura por profesional
CREATE POLICY pacientes_access ON public.pacientes
  FOR ALL USING (auth.uid() = profesional_id) WITH CHECK (auth.uid() = profesional_id);

-- Módulos y citas
CREATE POLICY modulos_manage_own ON public.modulos
  FOR ALL USING (auth.uid() = profesional_id) WITH CHECK (auth.uid() = profesional_id);

CREATE POLICY citas_manage_own ON public.citas
  FOR ALL USING (auth.uid() = profesional_id) WITH CHECK (auth.uid() = profesional_id);

-- Calendario (solo lectura desde cliente)
CREATE POLICY calendario_read_own ON public.calendario_dia
  FOR SELECT USING (auth.uid() = profesional_id);

-- Triggers y funciones (sin detalles demasiado extensos)
-- Función para sincronizar citas -> calendario_dia
CREATE OR REPLACE FUNCTION public.handle_cita_write()
RETURNS TRIGGER AS $$
DECLARE
  v_prof_id uuid;
  v_fecha date;
  v_cita_compacta jsonb;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_prof_id := OLD.profesional_id;
    v_fecha := OLD.fecha;
    -- remove
    UPDATE public.calendario_dia SET citas = citas - OLD.id::text, last_updated = now()
      WHERE profesional_id = v_prof_id AND fecha = v_fecha;
    RETURN OLD;
  END IF;

  v_prof_id := NEW.profesional_id;
  v_fecha := NEW.fecha;
  v_cita_compacta := jsonb_build_object('id', NEW.id, 'horaInicio', NEW.hora_inicio, 'horaFin', NEW.hora_fin, 'pacienteId', NEW.paciente_id, 'pacienteNombre', NEW.paciente_nombre_cache, 'estado', NEW.estado);

  INSERT INTO public.calendario_dia (profesional_id, fecha, citas)
  VALUES (v_prof_id, v_fecha, jsonb_build_object(NEW.id::text, v_cita_compacta))
  ON CONFLICT (profesional_id, fecha)
  DO UPDATE SET citas = calendario_dia.citas || jsonb_build_object(NEW.id::text, v_cita_compacta), last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_citas_write AFTER INSERT OR UPDATE OR DELETE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.handle_cita_write();

-- Función para sincronizar modulos -> calendario_dia
CREATE OR REPLACE FUNCTION public.handle_modulo_write()
RETURNS TRIGGER AS $$
DECLARE
  v_prof_id uuid;
  v_fecha date;
  v_modulo_compacto jsonb;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_prof_id := OLD.profesional_id;
    v_fecha := OLD.fecha;
    UPDATE public.calendario_dia SET modulos = modulos - OLD.id::text, last_updated = now()
      WHERE profesional_id = v_prof_id AND fecha = v_fecha;
    RETURN OLD;
  END IF;

  v_prof_id := NEW.profesional_id;
  v_fecha := NEW.fecha;
  v_modulo_compacto := jsonb_build_object('id', NEW.id, 'horaInicio', NEW.hora_inicio, 'horaFin', NEW.hora_fin, 'tipo', NEW.tipo);

  INSERT INTO public.calendario_dia (profesional_id, fecha, modulos)
  VALUES (v_prof_id, v_fecha, jsonb_build_object(NEW.id::text, v_modulo_compacto))
  ON CONFLICT (profesional_id, fecha)
  DO UPDATE SET modulos = calendario_dia.modulos || jsonb_build_object(NEW.id::text, v_modulo_compacto), last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_modulos_write AFTER INSERT OR UPDATE OR DELETE ON public.modulos
  FOR EACH ROW EXECUTE FUNCTION public.handle_modulo_write();

-- Función heartbeat
CREATE OR REPLACE FUNCTION public.daily_heartbeat()
RETURNS void AS $$
  UPDATE public.system_heartbeat SET last_ping = now() WHERE id = 1;
$$ LANGUAGE sql;

-- Si pg_cron está disponible, programar heartbeat
-- SELECT cron.schedule('daily-heartbeat', '0 12 * * *', $$CALL daily_heartbeat()$$);

-- Backfill helper (ejecutar luego de crear triggers si la tabla ya tiene datos)
CREATE OR REPLACE FUNCTION public.backfill_calendario_dia()
RETURNS void AS $$
BEGIN
  INSERT INTO public.calendario_dia (profesional_id, fecha, modulos, citas, last_updated)
  SELECT c.profesional_id, c.fecha, jsonb_object_agg(m.id::text, jsonb_build_object('id', m.id, 'horaInicio', m.hora_inicio, 'horaFin', m.hora_fin, 'tipo', m.tipo)) FILTER (WHERE m.id IS NOT NULL),
         jsonb_object_agg(ci.id::text, jsonb_build_object('id', ci.id, 'horaInicio', ci.hora_inicio, 'horaFin', ci.hora_fin, 'pacienteId', ci.paciente_id, 'pacienteNombre', ci.paciente_nombre_cache, 'estado', ci.estado)) FILTER (WHERE ci.id IS NOT NULL), now()
  FROM (
    SELECT DISTINCT profesional_id, fecha FROM (
      SELECT profesional_id, fecha FROM public.modulos
      UNION
      SELECT profesional_id, fecha FROM public.citas
    ) t
  ) c
  LEFT JOIN public.modulos m ON m.profesional_id = c.profesional_id AND m.fecha = c.fecha
  LEFT JOIN public.citas ci ON ci.profesional_id = c.profesional_id AND ci.fecha = c.fecha
  GROUP BY c.profesional_id, c.fecha
  ON CONFLICT (profesional_id, fecha) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
