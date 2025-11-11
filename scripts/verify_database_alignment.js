#!/usr/bin/env node
// scripts/verify_database_alignment.js
// Verifica que las tablas y columnas en la DB coincidan con el schema esperado
// Uso: node verify_database_alignment.js [DATABASE_URL]

const fs = require('fs')
const path = require('path')
const postgres = require('postgres')

// Cargar .env.local si existe
try {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const l = line.trim()
      if (!l || l.startsWith('#')) return
      const idx = l.indexOf('=')
      if (idx === -1) return
      const k = l.slice(0, idx).trim()
      let v = l.slice(idx + 1).trim()
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
      if (!process.env[k]) process.env[k] = v
    })
  }
} catch (e) {}

const dbUrl = process.argv[2] || process.env.DATABASE_URL
if (!dbUrl) {
  console.error('❌ Falta DATABASE_URL. Usa: node verify_database_alignment.js "postgresql://..."')
  process.exit(2)
}

// Desactivar SSL si la conexión es local (localhost / 127.0.0.1)
const isLocal = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost')
const sql = isLocal
  ? postgres(dbUrl, { ssl: false })
  : postgres(dbUrl, { ssl: { rejectUnauthorized: false } })

const expectedTables = {
  usuarios: [
    'userid', 'nombre', 'email', 'rol', 'esadmin', 'telefono',
    'direccion', 'fotoperfil', 'fechacreacion', 'profesional', 'profesion'
    // 'estamento' kept for backwards compatibility but deprecated
  ],
  solicitudregistro: ['solicitudid', 'nombre', 'email', 'rolsolicitado', 'estado', 'fechacreacion'],
  pacientes: ['pacienteid', 'nombre', 'apellido', 'rut', 'email', 'telefono', 'fechanacimiento', 'fechacreacion'],
  citas: [
    'citaid', 'profesionalid', 'pacienteid', 'fecha', 'duracionminutos',
    'estado', 'motivo', 'observaciones', 'tipocita'
  ],
  modulos: ['moduloid', 'profesionalid', 'fechacreacion', 'nombre', 'descripcion', 'configuracion'],
  plantillas: ['plantillaid', 'profesionalid', 'createdby', 'nombre', 'tipo', 'contenido'],
  modulodefinitions: ['modulodefid', 'profesionalid', 'createdby', 'nombre', 'profesion', 'configuracionbase'],
  config: ['configkey', 'configvalue']
}

;(async () => {
  try {
    console.log('🔍 Verificando alineación de base de datos...\n')

    for (const [tableName, expectedColumns] of Object.entries(expectedTables)) {
      try {
        const result = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = ${tableName}
          ORDER BY column_name
        `

        if (result.length === 0) {
          console.log(`❌ TABLA NO ENCONTRADA: ${tableName}`)
          continue
        }

        const actualColumns = result.map((r) => r.column_name)
        const missing = expectedColumns.filter((c) => !actualColumns.includes(c))
        const extra = actualColumns.filter((c) => !expectedColumns.includes(c))

        if (missing.length === 0 && extra.length === 0) {
          console.log(`✅ ${tableName}: ${actualColumns.length} columnas correctas`)
        } else {
          console.log(`⚠️  ${tableName}:`)
          if (missing.length > 0) console.log(`   Faltantes: ${missing.join(', ')}`)
          if (extra.length > 0) console.log(`   Extras: ${extra.join(', ')}`)
        }
      } catch (e) {
        console.log(`⚠️  ${tableName}: ${e.message.split('\n')[0]}`)
      }
    }

    console.log('\n✅ Verificación completada.')
    await sql.end({ timeout: 5 })
    process.exit(0)
  } catch (e) {
    console.error('❌ Error:', e.message || e)
    try { await sql.end({ timeout: 5 }) } catch (er) {}
    process.exit(3)
  }
})()
