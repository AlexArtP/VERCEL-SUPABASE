-- 🔧 CORREGIR: Infinite Recursion en RLS Policies
-- Este script desactiva RLS en la tabla 'usuarios' para resolver el error

-- 1. Desactivar RLS en la tabla usuarios
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que se desactivó
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'usuarios';

-- Si necesitas ver qué políticas hay (para debugging):
-- SELECT * FROM pg_policies WHERE tablename = 'usuarios';

-- Si necesitas eliminar políticas específicas:
-- DROP POLICY IF EXISTS "nombre_policy" ON usuarios;

-- ✅ Después de ejecutar esto, tu Supabase funcionará sin recursión
