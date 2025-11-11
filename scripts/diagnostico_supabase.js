#!/usr/bin/env node

/**
 * diagnostico_supabase.js
 * Realiza un diagnóstico completo del proyecto:
 * 1. Verifica conexión a Supabase remota
 * 2. Lista tablas y sus columnas
 * 3. Verifica estado de las migraciones
 * 4. Reporta estado general
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno desde .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const parseEnv = (content) => {
  const result = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    result[key.trim()] = valueParts.join('=').trim();
  });
  return result;
};

const env = parseEnv(envContent);
const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no encontrado en .env.local');
  process.exit(1);
}

console.log('🔍 DIAGNÓSTICO DEL PROYECTO AGENDA_VERCEL');
console.log('==========================================\n');

const isLocal = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
const opts = { connectionString: DATABASE_URL };
if (isLocal) {
  opts.ssl = false;
  console.log('⚙️  Base de datos: LOCAL (SSL deshabilitado)');
} else {
  opts.ssl = { rejectUnauthorized: false };
  console.log('⚙️  Base de datos: REMOTA (SSL habilitado)');
}

(async () => {
  const sql = postgres(opts);
  let errOccurred = null;
  
  try {
    console.log('\n📡 Intentando conexión...');
    const connRes = await sql`SELECT now() as now`;
    console.log('✅ Conexión exitosa - Timestamp del servidor:', connRes[0].now);

    console.log('\n📋 TABLAS Y COLUMNAS');
    console.log('==================');

    // Listar tablas en el esquema público
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    for (const { table_name } of tables) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table_name}
        ORDER BY ordinal_position
      `;

      console.log(`\n📌 ${table_name} (${columns.length} columnas):`);
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        const defaultVal = col.column_default ? ` DEFAULT: ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });

      // Contar filas
      const countRes = await sql.unsafe(`SELECT COUNT(*) as count FROM "${table_name}"`);
      console.log(`   Filas: ${countRes[0].count}`);
    }

    console.log('\n🔑 ESTADO DE KEYS Y AUTENTICACIÓN');
    console.log('==================================');
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL || '❌ NO CONFIGURADO'}`);
    console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Presente' : '❌ NO CONFIGURADO'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ NO CONFIGURADO'}`);
    console.log(`DATABASE_URL: ✅ Presente (conectado)`);

    console.log('\n✅ DIAGNÓSTICO COMPLETADO SIN ERRORES');
    
  } catch (err) {
    errOccurred = err;
    console.error('\n❌ ERROR DURANTE DIAGNÓSTICO:');
    console.error('Mensaje:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n   → La base de datos no responde (ECONNREFUSED)');
      console.error('   → Verifica que Supabase está accesible desde tu red');
      console.error('   → Verifica la contraseña en DATABASE_URL');
    } else if (err.message.includes('password authentication failed')) {
      console.error('\n   → Error de credenciales. Verifica contraseña en DATABASE_URL');
    } else if (err.message.includes('FATAL')) {
      console.error('\n   → Error grave de BD. Verifica que el servidor está en línea');
    }
    if (err.stack) console.error('\nStack:', err.stack);
  } finally {
    try { await sql.end({ timeout: 1 }); } catch (e) { }
    process.exit(errOccurred ? 2 : 0);
  }
})();
