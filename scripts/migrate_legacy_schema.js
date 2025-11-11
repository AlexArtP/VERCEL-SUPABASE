#!/usr/bin/env node
// scripts/migrate_legacy_schema.js
// Migra/armoniza columnas legacy hacia el esquema nuevo esperado (añade columnas faltantes y copia datos donde sea posible)
// Uso: node migrate_legacy_schema.js [DATABASE_URL]

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
  console.error('❌ Falta DATABASE_URL. Usa: node migrate_legacy_schema.js "postgresql://..."')
  process.exit(2)
}

const isLocal = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost')
const sql = isLocal ? postgres(dbUrl, { ssl: false }) : postgres(dbUrl, { ssl: { rejectUnauthorized: false } })

;(async () => {
  try {
    console.log('🔁 Iniciando migración de esquema legacy → nuevo...')

    // Usuarios: añadir profesion (estamento mantiene compatibilidad hacia atrás)
    await sql.unsafe("ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS profesion text;")
    console.log('  ✓ usuarios: columna profesion asegurada')

    // Pacientes: añadir pacienteid, apellido, rut, fechanacimiento, fechacreacion
    await sql.unsafe("ALTER TABLE IF EXISTS pacientes ADD COLUMN IF NOT EXISTS pacienteid VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS pacientes ADD COLUMN IF NOT EXISTS apellido VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS pacientes ADD COLUMN IF NOT EXISTS rut VARCHAR(50);")
    await sql.unsafe("ALTER TABLE IF EXISTS pacientes ADD COLUMN IF NOT EXISTS fechanacimiento DATE;")
    await sql.unsafe("ALTER TABLE IF EXISTS pacientes ADD COLUMN IF NOT EXISTS fechacreacion TIMESTAMP;")
    // Rellenar pacienteid desde id si existe
    await sql.unsafe("UPDATE pacientes SET pacienteid = id WHERE pacienteid IS NULL AND id IS NOT NULL;")
    // Rellenar apellido combinando apellido_paterno y apellido_materno si existen
    await sql.unsafe("UPDATE pacientes SET apellido = concat_ws(' ', COALESCE(apellido_paterno,''), COALESCE(apellido_materno,'')) WHERE (apellido IS NULL OR apellido = '') AND (apellido_paterno IS NOT NULL OR apellido_materno IS NOT NULL);")
    // Rellenar rut desde run si existe
    await sql.unsafe("UPDATE pacientes SET rut = run WHERE rut IS NULL AND run IS NOT NULL;")
    // Rellenar fechanacimiento desde fecha_nacimiento si existe
    await sql.unsafe("UPDATE pacientes SET fechanacimiento = fecha_nacimiento WHERE fechanacimiento IS NULL AND fecha_nacimiento IS NOT NULL;")
    // Rellenar fechacreacion desde created_at si existe
    await sql.unsafe("UPDATE pacientes SET fechacreacion = created_at WHERE fechacreacion IS NULL AND created_at IS NOT NULL;")
    console.log('  ✓ pacientes: columnas y mapeos aplicados')

    // Citas: añadir campos esperados y mapear campos con sufijo _id
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS citaid VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS profesionalid VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS pacienteid VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS duracionminutos INT;")
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS motivo TEXT;")
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS observaciones TEXT;")
    await sql.unsafe("ALTER TABLE IF EXISTS citas ADD COLUMN IF NOT EXISTS tipocita VARCHAR(100);")
    // Mapear id -> citaid, profesional_id -> profesionalid, paciente_id -> pacienteid
    await sql.unsafe("UPDATE citas SET citaid = id WHERE citaid IS NULL AND id IS NOT NULL;")
    await sql.unsafe("UPDATE citas SET profesionalid = profesional_id WHERE profesionalid IS NULL AND profesional_id IS NOT NULL;")
    await sql.unsafe("UPDATE citas SET pacienteid = paciente_id WHERE pacienteid IS NULL AND paciente_id IS NOT NULL;")
    console.log('  ✓ citas: columnas y mapeos aplicados')

    // Modulos: añadir/renombrar columnas y mapear
    await sql.unsafe("ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS moduloid VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS profesionalid VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS fechacreacion TIMESTAMP;")
    await sql.unsafe("ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);")
    await sql.unsafe("ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS descripcion TEXT;")
    await sql.unsafe("ALTER TABLE IF EXISTS modulos ADD COLUMN IF NOT EXISTS configuracion JSONB;")
    await sql.unsafe("UPDATE modulos SET moduloid = id WHERE moduloid IS NULL AND id IS NOT NULL;")
    await sql.unsafe("UPDATE modulos SET profesionalid = profesional_id WHERE profesionalid IS NULL AND profesional_id IS NOT NULL;")
    await sql.unsafe("UPDATE modulos SET fechacreacion = created_at WHERE fechacreacion IS NULL AND created_at IS NOT NULL;")
    console.log('  ✓ modulos: columnas y mapeos aplicados')

    // Plantillas y modulodefinitions ya estaban correctas en la verificación anterior; aseguramos columnas JSONB
    await sql.unsafe("ALTER TABLE IF EXISTS plantillas ADD COLUMN IF NOT EXISTS contenido JSONB;")
    await sql.unsafe("ALTER TABLE IF EXISTS modulodefinitions ADD COLUMN IF NOT EXISTS configuracionbase JSONB;")
    console.log('  ✓ plantillas/modulodefinitions: columnas JSONB aseguradas')

    console.log('\n✅ Migración legacy completada. Recomendación: ejecutar verify_database_alignment.js para revisar diferencias restantes.')
    await sql.end({ timeout: 5 })
    process.exit(0)
  } catch (e) {
    console.error('❌ Error durante migración:', e.message || e)
    try { await sql.end({ timeout: 5 }) } catch (er) {}
    process.exit(3)
  }
})()
