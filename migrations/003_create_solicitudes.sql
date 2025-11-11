-- Migration: create solicitudes table for migration from Firestore
-- Run this in Supabase (psql or SQL editor) before enabling server writes.

CREATE TABLE IF NOT EXISTS public.solicitudes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text,
  apellido_paterno text,
  apellido_materno text,
  run text,
  profesion text,
  sobre_ti text,
  cargo_actual text,
  email text,
  telefono text,
  password text,
  estado text DEFAULT 'pendiente',
  es_admin boolean DEFAULT false,
  fecha_solicitud timestamptz DEFAULT now(),
  fecha_aprobacion timestamptz,
  aprobado_por uuid
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_email ON public.solicitudes (email);
CREATE INDEX IF NOT EXISTS idx_solicitudes_run ON public.solicitudes (run);
