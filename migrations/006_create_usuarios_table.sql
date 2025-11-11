-- Migration: 006_create_usuarios_table.sql
-- Copiar todo este contenido en Supabase Studio SQL Editor (http://127.0.0.1:54323)
-- Y ejecutar con Ctrl+Enter

-- CREATE TABLE usuarios con todos los campos necesarios
CREATE TABLE IF NOT EXISTS public.usuarios (
  userid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  run TEXT UNIQUE,
  profesion TEXT,
  telefono TEXT,
  direccion TEXT,
  fotoperfil TEXT,
  rol TEXT DEFAULT 'administrativo', -- 'profesional', 'administrativo', 'paciente'
  esadmin BOOLEAN DEFAULT FALSE,
  profesional BOOLEAN DEFAULT FALSE,
  estamento TEXT, -- 'Psicólogo', 'Psiquiatra', 'Asistente Social', etc.
  activo BOOLEAN DEFAULT TRUE,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_run ON public.usuarios(run);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_profesional ON public.usuarios(profesional);
CREATE INDEX IF NOT EXISTS idx_usuarios_estamento ON public.usuarios(estamento);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON public.usuarios(activo);

-- Habilitar RLS en la tabla
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can read own usuario profile" ON public.usuarios
  FOR SELECT
  USING (userid = auth.uid());

-- RLS Policy 2: Los admins pueden ver todos los usuarios
CREATE POLICY "Admins can read all usuarios" ON public.usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    )
  );

-- RLS Policy 3: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own usuario profile" ON public.usuarios
  FOR UPDATE
  USING (userid = auth.uid())
  WITH CHECK (userid = auth.uid());

-- RLS Policy 4: Los admins pueden actualizar cualquier usuario
CREATE POLICY "Admins can update any usuario" ON public.usuarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    )
  );

-- RLS Policy 5: Service role puede insertar (para registro)
CREATE POLICY "Service role can insert usuarios" ON public.usuarios
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    ) OR auth.uid() = userid
  );

-- Crear función para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que ejecute la función anterior
DROP TRIGGER IF EXISTS usuarios_updated_at_trigger ON public.usuarios;
CREATE TRIGGER usuarios_updated_at_trigger
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION update_usuarios_updated_at();

-- ✅ Migración completada. La tabla "usuarios" está lista para usar.
