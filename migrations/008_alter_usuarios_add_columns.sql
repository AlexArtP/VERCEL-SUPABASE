-- ============================================================================
-- Migration: ALTER TABLE usuarios - Agregar columnas faltantes
-- ============================================================================
-- Esta migración agrega las columnas que faltan a la tabla usuarios existente

-- Agregar columnas faltantes si no existen
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS apellido_paterno TEXT,
ADD COLUMN IF NOT EXISTS apellido_materno TEXT,
ADD COLUMN IF NOT EXISTS estamento TEXT,
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_usuarios_estamento ON public.usuarios(estamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON public.usuarios(activo);

-- Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;
