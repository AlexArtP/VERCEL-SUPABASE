-- ============================================================================
-- SCRIPT: Insertar 5 Usuarios Demo en tabla usuarios (Supabase Local)
-- ============================================================================
-- Profesiones exactas del formulario de registro:
-- - Psiquiatra Infanto Juvenil
-- - Médico residente Psiq. Infanto Juvenil
-- - Médico general
-- - Asistente social
-- - Psicologo(a)
-- - Terapeuta ocupacional
-- - Fonoaudiologo(a)
-- - Enfermero(a)
-- - Tecn. Enfermería
-- - Administrativo(a)
-- - Pediatra
-- ============================================================================

-- Usuario 1: Psicologo(a) (Estamento: Psicólogo)
INSERT INTO public.usuarios (
  userid, email, nombre, apellido_paterno, apellido_materno, run, 
  profesion, estamento, rol, profesional, esadmin, activo, 
  telefono, direccion, estado
) VALUES (
  gen_random_uuid(),
  'psicolo.juan@clinica.cl',
  'Juan',
  'García',
  'López',
  '12345678-1',
  'Psicologo(a)',
  'Psicólogo',
  'profesional',
  true,
  false,
  true,
  '+56 9 1111 1111',
  'Calle Principal 123, Santiago',
  'aprobado'
);

-- Usuario 2: Psiquiatra Infanto Juvenil (Estamento: Psiquiatra)
INSERT INTO public.usuarios (
  userid, email, nombre, apellido_paterno, apellido_materno, run, 
  profesion, estamento, rol, profesional, esadmin, activo, 
  telefono, direccion, estado
) VALUES (
  gen_random_uuid(),
  'psiquiatra.maria@clinica.cl',
  'María',
  'Silva',
  'Rodríguez',
  '13456789-2',
  'Psiquiatra Infanto Juvenil',
  'Psiquiatra',
  'profesional',
  true,
  false,
  true,
  '+56 9 2222 2222',
  'Avenida Secundaria 456, Santiago',
  'aprobado'
);

-- Usuario 3: Médico general
INSERT INTO public.usuarios (
  userid, email, nombre, apellido_paterno, apellido_materno, run, 
  profesion, estamento, rol, profesional, esadmin, activo, 
  telefono, direccion, estado
) VALUES (
  gen_random_uuid(),
  'medico.carlos@clinica.cl',
  'Carlos',
  'Mendez',
  'Sánchez',
  '14567890-3',
  'Médico general',
  NULL,
  'profesional',
  true,
  true,
  '+56 9 3333 3333',
  'Pasaje Terciaria 789, Santiago',
  'aprobado'
);

-- Usuario 4: Asistente social (Estamento: Asistente Social)
INSERT INTO public.usuarios (
  userid, email, nombre, apellido_paterno, apellido_materno, run, 
  profesion, estamento, rol, profesional, esadmin, activo, 
  telefono, direccion, estado
) VALUES (
  gen_random_uuid(),
  'trabajosocial.rosa@clinica.cl',
  'Rosa',
  'Fernández',
  'González',
  '15678901-4',
  'Asistente social',
  'Asistente Social',
  'profesional',
  true,
  false,
  true,
  '+56 9 4444 4444',
  'Camino Cuartario 1011, Santiago',
  'aprobado'
);

-- Usuario 5: Pediatra
INSERT INTO public.usuarios (
  userid, email, nombre, apellido_paterno, apellido_materno, run, 
  profesion, estamento, rol, profesional, esadmin, activo, 
  telefono, direccion, estado
) VALUES (
  gen_random_uuid(),
  'pediatra.ana@clinica.cl',
  'Ana',
  'Ramírez',
  'Torres',
  '16789012-5',
  'Pediatra',
  NULL,
  'profesional',
  true,
  false,
  true,
  '+56 9 5555 5555',
  'Boulevard Quinto 1213, Santiago',
  'aprobado'
);

-- ============================================================================
-- Verificación: Listar todos los usuarios inseridos
-- ============================================================================
SELECT 
  userid, 
  email, 
  nombre || ' ' || COALESCE(apellido_paterno, '') as nombre_completo,
  profesion,
  estamento,
  activo,
  estado
FROM public.usuarios
ORDER BY fechacreacion DESC
LIMIT 5;

-- ============================================================================
-- ✅ Script completado. Se insertaron 5 usuarios demo con distintas profesiones
-- ============================================================================
