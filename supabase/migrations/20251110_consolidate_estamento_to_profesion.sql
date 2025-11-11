-- Consolidate estamento to profesion (deduplicate fields)
-- Purpose: Keep only 'profesion' field, migrate data from 'estamento' as fallback

-- 1. Copy estamento data to profesion where profesion is NULL (usuarios table)
UPDATE usuarios 
SET profesion = estamento 
WHERE estamento IS NOT NULL AND profesion IS NULL;

-- 2. Copy estamento data to profesion where profesion is NULL (modulos table if exists)
UPDATE modulos 
SET profesion = estamento 
WHERE estamento IS NOT NULL AND profesion IS NULL;

-- 3. Copy estamento data to profesion where profesion is NULL (plantillas table if exists)
UPDATE plantillas 
SET profesion = estamento 
WHERE estamento IS NOT NULL AND profesion IS NULL;

-- Note: The 'estamento' column is kept as fallback for backwards compatibility
-- but all new code should use 'profesion' exclusively.
-- In the future, 'estamento' can be safely dropped after verifying all data is migrated.
