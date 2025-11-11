#!/usr/bin/env node
/**
 * Script: Inspeccionar estructura de tabla usuarios
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function inspectTable() {
  console.log('🔍 Inspeccionando tabla usuarios...\n');
  
  // Obtener un registro para ver qué campos tiene
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    const usuario = data[0];
    console.log('📋 Campos actuales en tabla usuarios:');
    Object.keys(usuario).forEach(key => {
      console.log(`   • ${key}: ${typeof usuario[key]}`);
    });
  } else {
    console.log('⚠️  Tabla vacía, no se pueden inspeccionar campos');
  }
}

inspectTable();
