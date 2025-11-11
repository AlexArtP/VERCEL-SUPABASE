-- Migración: Agregar columnas para gestión de agendas deshabilitadas
-- Descripción: Agrega las columnas agenda_disabled y agenda_disabled_reason a la tabla usuarios

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS agenda_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agenda_disabled_reason text DEFAULT NULL;

-- Crear índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_usuarios_agenda_disabled ON usuarios(agenda_disabled);
CREATE INDEX IF NOT EXISTS idx_usuarios_profesional_agenda ON usuarios(profesional, agenda_disabled);

-- Mensaje de confirmación
SELECT 'Columnas agenda_disabled y agenda_disabled_reason agregadas exitosamente' AS resultado;
