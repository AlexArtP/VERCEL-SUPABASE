-- Migration: Crear tabla plantillas para Supabase
CREATE TABLE IF NOT EXISTS public.plantillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(128) NOT NULL,
  descripcion text,
  tipo varchar(32),
  contenido jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plantillas_tipo ON public.plantillas(tipo);
CREATE INDEX IF NOT EXISTS idx_plantillas_nombre ON public.plantillas(nombre);

ALTER TABLE public.plantillas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario puede ver plantillas" ON public.plantillas
  FOR SELECT USING (true);
