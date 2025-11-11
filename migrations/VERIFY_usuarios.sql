-- ============================================================================
-- VERIFICACIÓN: Confirmar que tabla usuarios existe y tiene datos
-- ============================================================================
-- Ejecuta este script en Supabase Studio para verificar el estado

-- 1. Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'usuarios' AND table_schema = 'public';

-- 2. Contar usuarios en la tabla
SELECT COUNT(*) as total_usuarios FROM public.usuarios;

-- 3. Listar todos los usuarios con sus datos principales
SELECT 
  userid,
  email,
  nombre || ' ' || COALESCE(apellido_paterno, '') as nombre_completo,
  profesion,
  estamento,
  activo,
  profesional,
  estado
FROM public.usuarios
ORDER BY fechacreacion DESC;

-- 4. Verificar que hay usuarios con profesional=true
SELECT COUNT(*) as total_profesionales 
FROM public.usuarios 
WHERE profesional = true;

-- 5. Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ✅ Si ves resultados en todas las queries, la tabla está lista para usar
