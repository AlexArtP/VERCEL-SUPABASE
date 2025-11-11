-- ============================================================
-- SCRIPT MANUAL: Agregar campos faltantes a tabla usuarios
-- ============================================================
-- Ejecutar este script en Supabase SQL Editor o via psql
-- 
-- NOTA: Si se ejecuta en desarrollo local, usar:
-- psql -h 127.0.0.1 -U postgres -d postgres -p 54321 -f este_archivo.sql
-- ============================================================

-- 1. Agregar columna 'run' si no existe
DO $$
BEGIN
  ALTER TABLE usuarios ADD COLUMN run VARCHAR(50);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 2. Agregar columna 'activo' si no existe (con default TRUE)
DO $$
BEGIN
  ALTER TABLE usuarios ADD COLUMN activo BOOLEAN DEFAULT TRUE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 3. Agregar columna 'apellidos' si no existe
DO $$
BEGIN
  ALTER TABLE usuarios ADD COLUMN apellidos VARCHAR(255);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 4. Asegurar que todos los usuarios existentes tengan activo = TRUE
UPDATE usuarios SET activo = TRUE WHERE activo IS NULL;

-- 5. Actualizar usuario de prueba con datos completos
UPDATE usuarios SET 
  activo = TRUE,
  apellidos = 'Arteaga',
  esadmin = TRUE
WHERE email = 'a.arteaga02@ufromail.cl';

-- 6. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_esadmin ON usuarios(esadmin);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- 7. Mostrar estado de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- ✅ Verificación
SELECT userid, nombre, email, esadmin, activo, apellidos, run 
FROM usuarios 
LIMIT 5;
