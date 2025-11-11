-- Migration: Actualizar tabla modulo_definitions con todas las columnas necesarias
-- Autor: Sistema de Agenda
-- Fecha: 2025-11-04

-- Primero, eliminar la tabla antigua si existe (para recrearla completa)
-- DROP TABLE IF NOT EXISTS public.modulo_definitions CASCADE;

-- Crear/recrear tabla modulo_definitions con todas las columnas
CREATE TABLE IF NOT EXISTS public.modulo_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre varchar(255) NOT NULL,
  tipo varchar(100),
  duracion integer DEFAULT 60,
  observaciones text,
  color varchar(7),
  profesionalId uuid,
  profesion varchar(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  descripcion text,
  config jsonb
);

-- Crear índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_modulo_definitions_nombre ON public.modulo_definitions(nombre);
CREATE INDEX IF NOT EXISTS idx_modulo_definitions_tipo ON public.modulo_definitions(tipo);
CREATE INDEX IF NOT EXISTS idx_modulo_definitions_profesionalId ON public.modulo_definitions(profesionalId);
CREATE INDEX IF NOT EXISTS idx_modulo_definitions_profesion ON public.modulo_definitions(profesion);
CREATE INDEX IF NOT EXISTS idx_modulo_definitions_created_at ON public.modulo_definitions(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.modulo_definitions ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer
DROP POLICY IF NOT EXISTS "Usuario puede ver definiciones" ON public.modulo_definitions;
CREATE POLICY "Usuario puede ver definiciones" ON public.modulo_definitions
  FOR SELECT USING (true);

-- Política de inserción: solo usuarios autenticados
DROP POLICY IF NOT EXISTS "Usuario autenticado puede crear definiciones" ON public.modulo_definitions;
CREATE POLICY "Usuario autenticado puede crear definiciones" ON public.modulo_definitions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de actualización: solo el creador o admin
DROP POLICY IF NOT EXISTS "Usuario puede actualizar sus definiciones" ON public.modulo_definitions;
CREATE POLICY "Usuario puede actualizar sus definiciones" ON public.modulo_definitions
  FOR UPDATE USING (
    auth.uid() = profesionalId OR 
    auth.role() = 'authenticated'
  );

-- Política de eliminación: solo el creador o admin
DROP POLICY IF NOT EXISTS "Usuario puede eliminar sus definiciones" ON public.modulo_definitions;
CREATE POLICY "Usuario puede eliminar sus definiciones" ON public.modulo_definitions
  FOR DELETE USING (
    auth.uid() = profesionalId OR 
    auth.role() = 'authenticated'
  );

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_modulo_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_modulo_definitions_updated_at_trigger ON public.modulo_definitions;
CREATE TRIGGER update_modulo_definitions_updated_at_trigger
  BEFORE UPDATE ON public.modulo_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modulo_definitions_updated_at();
