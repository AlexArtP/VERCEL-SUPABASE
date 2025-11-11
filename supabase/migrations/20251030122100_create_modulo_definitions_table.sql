-- Migration: Crear tabla modulo_definitions para Supabase
CREATE TABLE IF NOT EXISTS public.modulo_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(128) NOT NULL,
  descripcion text,
  config jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modulo_definitions_nombre ON public.modulo_definitions(nombre);

ALTER TABLE public.modulo_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario puede ver definiciones" ON public.modulo_definitions
  FOR SELECT USING (true);
