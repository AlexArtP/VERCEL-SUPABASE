#!/usr/bin/env node
/**
 * scripts/add_estado_column_to_usuarios.js
 * Agrega la columna 'estado' a la tabla 'usuarios' si no existe
 */

const fs = require('fs')
const path = require('path')
const postgres = require('postgres')

// Cargar .env.local
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
  console.error('❌ Falta DATABASE_URL')
  process.exit(1)
}

const isLocal = dbUrl.includes('127.0.0.1') || dbUrl.includes('localhost')
const sql = isLocal
  ? postgres(dbUrl, { ssl: false })
  : postgres(dbUrl, { ssl: { rejectUnauthorized: false } })

;(async () => {
  try {
    console.log('🔍 Verificando columna "estado" en tabla "usuarios"...')

    // Verificar si la columna existe
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'usuarios' 
      AND column_name = 'estado'
    `

    if (result.length > 0) {
      console.log('✅ La columna "estado" ya existe en la tabla usuarios')
    } else {
      console.log('⚠️  La columna "estado" no existe. Agregando...')
      
      // Agregar la columna
      await sql`
        ALTER TABLE usuarios 
        ADD COLUMN estado varchar(50) DEFAULT 'pendiente'
      `
      
      console.log('✅ Columna "estado" agregada exitosamente')
    }

    // Verificar que los valores por defecto sean correctos
    const usuarios = await sql`
      SELECT userid, estado FROM usuarios LIMIT 3
    `
    
    console.log('📋 Primeros usuarios:')
    usuarios.forEach(u => {
      console.log(`  - ${u.userid}: estado="${u.estado}"`)
    })

    console.log('✅ Verificación completada')
    await sql.end({ timeout: 5 })
    process.exit(0)
  } catch (e) {
    console.error('❌ Error:', e.message)
    try { await sql.end({ timeout: 5 }) } catch (er) {}
    process.exit(1)
  }
})()
