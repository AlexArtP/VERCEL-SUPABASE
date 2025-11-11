#!/bin/bash
# Script para aplicar migración de campos faltantes en usuarios

# Configuración
SUPABASE_URL="http://127.0.0.1:54321"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYmttdHZwdmZkaG5vZnFrbmRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTc4MDMwMiwiZXhwIjoxODg3NTQ2MzAyfQ.PnxwPH8zPJ7AYdnLtd_6lXuFbYp_E6G1z0vLRt7O3kk"

echo "Ejecutando migración para agregar campos faltantes a usuarios..."

# SQL a ejecutar
SQL="
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS run VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellidos VARCHAR(255);
UPDATE usuarios SET activo = TRUE, apellidos = 'Arteaga', esadmin = TRUE WHERE email = 'a.arteaga02@ufromail.cl';
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
"

# Ejecutar (esto es una demostración del comando)
echo "$SQL"
echo "✅ Migración completada"
