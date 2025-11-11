import { createClient } from '@supabase/supabase-js';

// Cliente Supabase admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    console.log('🔧 Iniciando migración de tabla modulo_definitions...');

    // Ejecutar SQL directamente
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      return Response.json({
        success: false,
        error: error.message || 'Error ejecutando migración'
      }, { status: 400 });
    }

    console.log('✅ Migración de modulo_definitions completada exitosamente');
    return Response.json({
      success: true,
      message: 'Tabla modulo_definitions actualizada correctamente',
      data
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('❌ Error:', errorMsg);
    return Response.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
