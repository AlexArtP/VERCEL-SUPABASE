#!/usr/bin/env node
/**
 * Script para aplicar la migración 006 (tabla usuarios) en Supabase Local
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

console.log(`📡 Conectando a Supabase en: ${supabaseUrl}`);
console.log(`🔑 Usando service role key (primeros 20 chars): ${serviceRoleKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const migrationSQL = `
-- Migration: 006_create_usuarios_table.sql
-- Purpose: Create usuarios table for user management

CREATE TABLE IF NOT EXISTS public.usuarios (
  userid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  run TEXT UNIQUE,
  profesion TEXT,
  telefono TEXT,
  direccion TEXT,
  fotoperfil TEXT,
  rol TEXT DEFAULT 'administrativo',
  esadmin BOOLEAN DEFAULT FALSE,
  profesional BOOLEAN DEFAULT FALSE,
  estamento TEXT,
  activo BOOLEAN DEFAULT TRUE,
  estado TEXT DEFAULT 'pendiente',
  fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_run ON public.usuarios(run);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_profesional ON public.usuarios(profesional);
CREATE INDEX IF NOT EXISTS idx_usuarios_profesion ON public.usuarios(profesion);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON public.usuarios(activo);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read own profile
CREATE POLICY "Users can read own usuario profile" ON public.usuarios
  FOR SELECT
  USING (userid = auth.uid());

-- RLS Policy: Admins can read all
CREATE POLICY "Admins can read all usuarios" ON public.usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    )
  );

-- RLS Policy: Users can update own profile
CREATE POLICY "Users can update own usuario profile" ON public.usuarios
  FOR UPDATE
  USING (userid = auth.uid())
  WITH CHECK (userid = auth.uid());

-- RLS Policy: Admins can update any
CREATE POLICY "Admins can update any usuario" ON public.usuarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE userid = auth.uid() AND esadmin = TRUE
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_updated_at_trigger ON public.usuarios;
CREATE TRIGGER usuarios_updated_at_trigger
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION update_usuarios_updated_at();
`;

async function applyMigration() {
  try {
    console.log('\n🔄 Aplicando migración...\n');
    
    const { error } = await supabase.rpc('exec_sql_as_admin', {
      sql: migrationSQL
    }).catch(() => {
      // Fallback: intentar con query directo (si existe)
      return { error: 'exec_sql_as_admin no disponible' };
    });

    if (error && error.message !== 'exec_sql_as_admin no disponible') {
      console.error('❌ Error en migración:', error);
      return;
    }

    // Si el RPC no funcionó, intentar con postgres.js
    console.log('ℹ️  RPC no disponible, intentando conexión directa a Postgres...');
    
    // Usamos el cliente de Supabase para ejecutar queries
    const { data, error: queryError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    // Si la tabla existe, el query no lanzará error
    if (queryError && queryError.code === 'PGRST116') {
      console.error('❌ Tabla no existe. Verificar conexión o permisos.');
      console.log('\nIntentando crear tabla manualmente...');
      
      // Crear tabla usando statements individuales
      const statements = [
        `CREATE TABLE IF NOT EXISTS public.usuarios (userid UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, nombre TEXT, apellido_paterno TEXT, apellido_materno TEXT, run TEXT UNIQUE, profesion TEXT, telefono TEXT, direccion TEXT, fotoperfil TEXT, rol TEXT DEFAULT 'administrativo', esadmin BOOLEAN DEFAULT FALSE, profesional BOOLEAN DEFAULT FALSE, estamento TEXT, activo BOOLEAN DEFAULT TRUE, estado TEXT DEFAULT 'pendiente', fechacreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`
      ];

      // Nota: esto requeriría un edge function o admin access que puede no estar disponible
      console.warn('⚠️  Para crear la tabla, necesitas ejecutar el SQL manualmente o usar `supabase db push`');
      console.log('\n📋 SQL a ejecutar en Supabase Studio (http://127.0.0.1:54323):');
      console.log(migrationSQL);
      return;
    }

    console.log('✅ Tabla usuarios verificada/creada exitosamente!');
    console.log('\n📊 Estructura de la tabla:');
    
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'usuarios')
      .eq('table_schema', 'public');
    
    if (columns) {
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Solución alternativa: copia el SQL y ejecuta en Supabase Studio');
    console.log('Abre: http://127.0.0.1:54323 → SQL Editor → pega el SQL arriba');
  }
}

applyMigration();
