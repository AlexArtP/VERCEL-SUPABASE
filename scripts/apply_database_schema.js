#!/usr/bin/env node
// scripts/apply_database_schema.js
// Aplica el esquema SQL init_database_schema.sql al Postgres local
// Uso: node apply_database_schema.js [DATABASE_URL]
// Ej: node apply_database_schema.js "postgresql://postgres:password@127.0.0.1:54322/postgres"

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
    console.log(`✓ Loaded env vars from ${envPath}`)
  }
} catch (e) {
  console.warn('⚠ Could not load .env.local:', e.message)
}

// Aceptar DATABASE_URL como argumento CLI o desde .env.local
const dbUrl = process.argv[2] || process.env.DATABASE_URL
if (!dbUrl) {
  console.error('❌ Falta DATABASE_URL. Usa: node apply_database_schema.js "postgresql://..."')
  process.exit(2)
}

console.log(`🔗 Conectando a: ${dbUrl.replace(/password[^@]*/, 'PASSWORD').replace(/:[^@]*@/, ':***@')}`)

// Si la conexión apunta a localhost, desactivar SSL para evitar errores de handshake
const isLocal = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost')
const sql = isLocal
  ? postgres(dbUrl, { ssl: false })
  : postgres(dbUrl, { ssl: { rejectUnauthorized: false } })

;(async () => {
  try {
    // Leer el archivo SQL
    const sqlPath = path.resolve(__dirname, 'init_database_schema.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📝 Aplicando esquema SQL...')
    
    // Ejecutar cada statement (separados por ;)
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))
    
    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt + ';')
        console.log(`  ✓ ${stmt.slice(0, 50)}...`)
      } catch (e) {
        console.error(`  ⚠ Error en statement: ${stmt.slice(0, 50)}`)
        console.error(`    ${e.message}`)
      }
    }
    
    console.log('✅ Esquema aplicado exitosamente.')
    await sql.end({ timeout: 5 })
    process.exit(0)
  } catch (e) {
    console.error('❌ Error fatal:', e.message || e)
    try { await sql.end({ timeout: 5 }) } catch (er) {}
    process.exit(3)
  }
})()
