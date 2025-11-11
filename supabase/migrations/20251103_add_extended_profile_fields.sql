-- Migration: Add additional profile fields
-- Purpose: Add profesion, sobre_ti, cargo_actual, telefono, foto_perfil, direccion, profesional to profiles table
-- Note: estamento field has been removed (consolidated to use profesion)

BEGIN;

-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profesion VARCHAR(255),
ADD COLUMN IF NOT EXISTS sobre_ti TEXT,
ADD COLUMN IF NOT EXISTS cargo_actual VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(500),
ADD COLUMN IF NOT EXISTS direccion TEXT,
ADD COLUMN IF NOT EXISTS profesional BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS apellido_paterno VARCHAR(255),
ADD COLUMN IF NOT EXISTS apellido_materno VARCHAR(255),
ADD COLUMN IF NOT EXISTS run VARCHAR(20),
ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT false;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_profiles_profesion ON profiles(profesion);
CREATE INDEX IF NOT EXISTS idx_profiles_es_admin ON profiles(es_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_run ON profiles(run);

COMMIT;
