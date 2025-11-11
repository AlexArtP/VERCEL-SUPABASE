#!/usr/bin/env node

/**
 * Script para inspeccionar la estructura actual de las tablas
 */

const postgres = require('postgres');

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function inspectSchema() {
  const sql = postgres(connectionString, { ssl: false });

  try {
    console.log('🔍 Inspeccionando estructura de tablas...\n');

    const tablas = ['usuarios', 'modulos', 'citas', 'pacientes', 'plantillas', 'solicitudregistro'];

    for (const tabla of tablas) {
      console.log(`📋 Tabla: ${tabla}`);
      console.log('-'.repeat(70));

      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = ${tabla} AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      if (columns.length === 0) {
        console.log('   ⚠️  No hay columnas (tabla podría no existir)\n');
        continue;
      }

      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   ✓ ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`);
      });

      console.log(`   Total: ${columns.length} columnas\n`);
    }

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

inspectSchema();
