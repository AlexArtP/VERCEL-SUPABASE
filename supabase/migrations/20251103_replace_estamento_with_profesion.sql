-- Migration: Replace estamento with profesion in modulos and plantillas tables
-- Purpose: Consolidate to use 'profesion' field instead of 'estamento' for consistency

-- Add profesion column to plantillas if it doesn't exist
ALTER TABLE IF EXISTS plantillas ADD COLUMN IF NOT EXISTS profesion VARCHAR(255);

-- Add profesion column to modulos if it doesn't exist  
ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS profesion VARCHAR(255);

-- Copy data from estamento to profesion if estamento exists
UPDATE plantillas SET profesion = estamento WHERE estamento IS NOT NULL AND profesion IS NULL;
UPDATE modulos SET profesion = estamento WHERE estamento IS NOT NULL AND profesion IS NULL;

-- Drop estamento columns (optional - comment out if you want to keep for backwards compatibility)
ALTER TABLE IF EXISTS plantillas DROP COLUMN IF EXISTS estamento;
ALTER TABLE IF EXISTS modulos DROP COLUMN IF EXISTS estamento;

-- Add comment for documentation
COMMENT ON COLUMN plantillas.profesion IS 'Profession/specialty type for this template module';
COMMENT ON COLUMN modulos.profesion IS 'Profession/specialty type for this scheduled module';
