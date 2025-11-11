-- Migration: Add missing fields (run, activo, apellidos) to usuarios table
-- Purpose: Support RUN field from registration form, active status tracking, and last name
-- Date: 2025-11-03

-- Add run column if it doesn't exist
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS run VARCHAR(50);

-- Add activo column if it doesn't exist (default TRUE for existing users)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Add apellidos column if it doesn't exist
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS apellidos VARCHAR(255);

-- Ensure Alexander user (test user) has these fields set correctly
UPDATE usuarios 
SET 
  activo = TRUE,
  apellidos = 'Arteaga',
  esadmin = TRUE
WHERE email = 'a.arteaga02@ufromail.cl';

-- Create a unique index on email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
