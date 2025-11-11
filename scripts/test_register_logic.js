const { createServiceRoleClient } = require('../lib/supabaseClient')
const fs = require('fs')
const path = require('path')

function formatearRun(run) {
  if (!run) return null
  const runLimpio = run.replace(/[\s\-\.]/g, '').toUpperCase()
  if (!/^\d{8}[0-9K]$/.test(runLimpio)) return null
  return `${runLimpio.slice(0,8)}-${runLimpio.slice(8,9)}`
}

async function run() {
  const body = {
    nombre: 'Prueba',
    apellidoPaterno: 'Uno',
    apellidoMaterno: 'Dos',
    run: '12345678-5',
    profesion: 'Medico',
    sobreTi: 'N/A',
    cargoActual: 'N/A',
    email: 'test.local@example.com',
    telefono: '+56900000000',
    password: 'Password123',
    confirmPassword: 'Password123',
  }

  const { nombre, email, password, confirmPassword, run } = body
  if (!nombre || !email || !password) {
    console.error('faltan campos')
    return
  }
  if (password !== confirmPassword) {
    console.error('pw mismatch')
    return
  }
  if (password.length < 8) {
    console.error('pw short')
    return
  }
  const runFormateado = formatearRun(run)
  if (!runFormateado) {
    console.error('run invalido')
    return
  }

  const solicitudData = {
    nombre: nombre || '',
    apellido_paterno: body.apellidoPaterno || '',
    apellido_materno: body.apellidoMaterno || '',
    run: runFormateado,
    profesion: body.profesion || '',
    sobre_ti: body.sobreTi || '',
    cargo_actual: body.cargoActual || '',
    email: body.email || '',
    telefono: body.telefono || '',
    password: body.password,
    estado: 'pendiente',
    es_admin: false,
    fecha_solicitud: new Date().toISOString(),
    fecha_aprobacion: null,
    aprobado_por: null,
  }

  let supabase
  try {
    supabase = createServiceRoleClient()
  } catch (e) {
    console.warn('no service role key, fallback to local')
  }

  if (supabase) {
    try {
      const { data: existingByEmail, error: emailErr } = await supabase.from('solicitudes').select('id').eq('email', body.email).limit(1)
      if (emailErr) {
        console.error('emailErr:', emailErr)
      }
      if (existingByEmail && existingByEmail.length) {
        console.log('email exists')
        return
      }
      const { data: insertRes, error: insertErr } = await supabase.from('solicitudes').insert(solicitudData).select('id').limit(1)
      if (insertErr) {
        console.error('insertErr:', insertErr)
        return
      }
      console.log('Inserted to supabase:', insertRes)
      return
    } catch (err) {
      console.error('supabase error:', err.message || err)
    }
  }

  // fallback
  try {
    const tmpDir = path.join(process.cwd(), 'tmp')
    fs.mkdirSync(tmpDir, { recursive: true })
    const filePath = path.join(tmpDir, 'solicitudes_test.jsonl')
    fs.appendFileSync(filePath, JSON.stringify(solicitudData) + '\n')
    console.log('Saved locally to', filePath)
  } catch (e) {
    console.error('fallback write error', e)
  }
}

run()
