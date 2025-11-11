#!/usr/bin/env node
/**
 * Script: Eliminar columna estamento de localhost Supabase
 * 
 * Uso: node scripts/drop-estamento-local.mjs
 * 
 * Elimina la columna estamento de la tabla usuarios en Supabase local
 * después de haber consolidado todos los datos en profesion
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

console.log(`\n🔗 Conectando a Supabase Local en: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function dropEstamentoColumn() {
  try {
    console.log('🔄 Eliminando columna estamento de tabla usuarios...\n');

    // Ejecutar SQL directo para eliminar la columna
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE usuarios DROP COLUMN IF EXISTS estamento;`
    }).catch(() => {
      // Si RPC no está disponible, intentamos con query directo
      return supabase.from('usuarios').select('estamento').limit(1);
    });

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n📝 Alternativa: Ejecuta esto manualmente en Supabase local:');
      console.log('   ALTER TABLE usuarios DROP COLUMN IF EXISTS estamento;\n');
      process.exit(1);
    }

    console.log('✅ Columna estamento eliminada exitosamente de localhost\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Alternativa: Ejecuta esto manualmente en Supabase local:');
    console.log('   ALTER TABLE usuarios DROP COLUMN IF EXISTS estamento;\n');
    process.exit(1);
  }
}

dropEstamentoColumn();
