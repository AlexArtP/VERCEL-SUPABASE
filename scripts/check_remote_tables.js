#!/usr/bin/env node
/**
 * Verificar si las tablas necesarias existen en el Supabase remoto
 */

const postgres = require('postgres')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL no configurada')
  process.exit(1)
}

const sql = postgres(databaseUrl, { ssl: 'require' })

async function main() {
  console.log('\n📋 Verificando tablas en Supabase remoto...\n')

  try {
    // Verificar tabla profiles
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log('✅ Tablas encontradas:')
    tables.forEach(t => {
      console.log(`   - ${t.table_name}`)
    })

    if (tables.find(t => t.table_name === 'profiles')) {
      console.log('\n✅ Tabla "profiles" EXISTE')
    } else {
      console.log('\n❌ Tabla "profiles" NO EXISTE - Necesita migración')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await sql.end()
  }
}

main()
