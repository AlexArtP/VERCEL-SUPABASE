-- SEED SQL — Datos de ejemplo para pruebas
-- Generated from README/PROMPT/SEED_SQL.md

-- Insertar profesionales (asumiendo que auth.users ya existen y tienen los mismos ids)
INSERT INTO public.profesionales (id, nombre_completo, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dra. Ana Perez', 'ana@ejemplo.test'),
  ('00000000-0000-0000-0000-000000000002', 'Dr. Carlos Ruiz', 'carlos@ejemplo.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profesionales_config (profesional_id, agenda_habilitada, motivo_deshabilitado) VALUES
  ('00000000-0000-0000-0000-000000000001', true, NULL),
  ('00000000-0000-0000-0000-000000000002', false, 'Vacaciones hasta 2025-11-10')
ON CONFLICT (profesional_id) DO UPDATE SET agenda_habilitada = EXCLUDED.agenda_habilitada, motivo_deshabilitado = EXCLUDED.motivo_deshabilitado;

-- Pacientes
INSERT INTO public.pacientes (id, profesional_id, nombre, apellido_paterno, apellido_materno, run, fecha_nacimiento, email, telefono, tratantes)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'María', 'González', 'López', '12.345.678-5', '1985-04-10', 'maria@example.test', '+56911111111', '[{"rol":"psiquiatra","id":"00000000-0000-0000-0000-000000000001"}]'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Pedro', 'Soto', 'Martínez', '9.876.543-2', '1990-09-20', 'pedro@example.test', '+56922222222', '[]');

-- Modulos
INSERT INTO public.modulos (id, profesional_id, fecha, hora_inicio, hora_fin, tipo) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', current_date, '09:00', '09:30', 'consulta'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', current_date, '09:30', '10:00', 'consulta');

-- Citas (usar ids generados por gen_random_uuid())
INSERT INTO public.citas (id, profesional_id, paciente_id, fecha, hora_inicio, hora_fin, paciente_nombre_cache) SELECT gen_random_uuid(), profesional_id, id, current_date, '09:00', '09:30', nombre FROM public.pacientes WHERE nombre = 'María' LIMIT 1;

-- Ejecutar backfill si necesita crear calendario_dia inicial
SELECT public.backfill_calendario_dia();
