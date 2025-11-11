#!/usr/bin/env node

/**
 * Script para verificar conexión a Supabase Local en Docker
 * Uso: node scripts/test_docker_connection.js
 */

const postgres = require('postgres');

async function testConnection() {
  console.log('🔍 Verificando conexión a Supabase Local en Docker...\n');

  // Puerto correcto es 54322 (verificar con: supabase status)
  const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
  
  try {
    console.log('📡 Conectando a: 127.0.0.1:54322');
    
    const client = postgres(connectionString, {
      ssl: false, // No usar SSL en localhost
    });

    await client`SELECT 1`
    console.log('✅ Conexión exitosa!\n');

    // Test 1: Verificar que estamos en Supabase
    const versionResult = await client`SELECT version()`;
    console.log('🗄️  PostgreSQL Version:');
    console.log(`   ${versionResult[0].version}\n`);

    // Test 2: Listar tablas
    const tablesResult = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`📋 Tablas en la BD (${tablesResult.length} encontradas):`);
    if (tablesResult.length === 0) {
      console.log('   ⚠️  No hay tablas aún. Necesitas ejecutar migraciones.\n');
    } else {
      tablesResult.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log();
    }

    // Test 3: Verificar extensiones Supabase
    const extensionsResult = await client`
      SELECT extname FROM pg_extension WHERE extname IN ('postgrest', 'uuid-ossp', 'pgjwt')
      ORDER BY extname
    `;

    console.log(`🔧 Extensiones Supabase (${extensionsResult.length}):`);
    extensionsResult.forEach(row => {
      console.log(`   ✓ ${row.extname}`);
    });
    console.log();

    // Test 4: Info de BD
    const infoResult = await client`
      SELECT 
        datname as database,
        current_user as connected_as
      FROM pg_database 
      WHERE datname = 'postgres'
    `;

    console.log('📊 Información de BD:');
    console.log(`   Base de datos: ${infoResult[0].database}`);
    console.log(`   Usuario: ${infoResult[0].connected_as}\n`);

    // Test 5: Crear tabla de prueba
    console.log('🧪 Creando tabla de prueba...');
    await client`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        mensaje TEXT,
        creado_en TIMESTAMP DEFAULT NOW()
      )
    `;

    const insertResult = await client`
      INSERT INTO test_connection (mensaje) 
      VALUES (${'Prueba de conexión exitosa'}) 
      RETURNING *
    `;

    console.log(`   ✅ Tabla creada y fila insertada:`);
    console.log(`      ID: ${insertResult[0].id}`);
    console.log(`      Mensaje: ${insertResult[0].mensaje}`);
    console.log(`      Creado: ${insertResult[0].creado_en}\n`);

    // Test 6: Verificar que podemos leer
    const readResult = await client`SELECT COUNT(*) as count FROM test_connection`;
    console.log(`   ✅ Lectura verificada: ${readResult[0].count} fila(s)\n`);

    await client.end();

    console.log('✨ Todos los tests pasaron correctamente!');
    console.log('\n✅ Docker Supabase está LISTO para usarse.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  No se puede conectar a 127.0.0.1:5432');
      console.error('   Asegúrate de que:');
      console.error('   1. Docker Desktop está corriendo');
      console.error('   2. Ejecutaste: supabase start');
      console.error('   3. El contenedor está en estado "running"\n');
      console.error('   Para verificar:');
      console.error('   - Abre Docker Desktop');
      console.error('   - Busca contenedor "supabase" o similar');
      console.error('   - Verifica que está "Running"\n');
    }
    process.exit(1);
  }
}

testConnection();
