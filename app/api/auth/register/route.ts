/**
 * ARCHIVO: app/api/auth/register/route.ts
 * PROPÓSITO: Endpoint para registro usando Supabase Auth
 * 
 * POST /api/auth/register
 * Body: { 
 *   email: string, 
 *   password: string,
 *   nombre?: string,
 *   apellido_paterno?: string,
 *   apellido_materno?: string,
 *   run?: string,
 *   profesion?: string
 * }
 * 
 * Este endpoint crea un nuevo usuario en Supabase Auth y su perfil correspondiente
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      nombre = '',
      apellido_paterno = '',
      apellido_materno = '',
      run = '',
      profesion = ''
    } = body

    if (!email || !password) {
      console.error('[register] Missing email or password')
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    // Validación básica de email
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validación básica de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    console.log(`\n📝 REGISTER REQUEST - Email: ${email}`)
    console.log('='.repeat(60))

    // Usar service-role para crear usuario (mejor control)
    const serviceSupabase = createServiceRoleClient()

    // Crear usuario en Supabase Auth
    console.log('🔐 Creando usuario en Supabase Auth...')
    const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirmar email
    })

    if (authError) {
      console.error(`❌ Error creando usuario en Auth: ${authError.message}`)
      
      // Detectar errores comunes
      if (authError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message || 'Error al crear usuario' },
        { status: 400 }
      )
    }

    const userid = authData.user.id
    console.log(`✅ Usuario creado en Auth - UID: ${userid}`)

    // Insertar en la tabla usuarios con las columnas correctas (minúsculas)
    console.log('📄 Insertando usuario en la tabla usuarios...')
    
    // Determinar rol: si se proporciona profesión, es 'profesional'; sino, 'administrativo'
    const rol = profesion ? 'profesional' : 'administrativo'
    const isProfesional = !!profesion
    
    const { data: usuarioData, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .insert({
        userid,
        email,
        nombre,
        rol,
        esadmin: false,
        telefono: body.telefono || null,
        direccion: body.direccion || null,
        fotoperfil: null,
        fechacreacion: new Date().toISOString(),
        profesional: isProfesional,
        profesion: profesion || body.estamento || null,
        run: run || null
      })
      .select()
      .single()

    if (usuarioError) {
      console.error(`⚠️ Error insertando usuario: ${usuarioError.message}`)
      // No hacer rollback; el usuario existe en Auth y puede actualizarse después
      
      return NextResponse.json({
        success: true,
        message: 'Usuario creado en Auth pero falta actualizar tabla usuarios',
        user: {
          userid,
          email,
          nombre,
          rol,
          profesional: isProfesional,
          esadmin: false
        }
      }, { status: 201 })
    }

    console.log(`✅ Usuario insertado exitosamente en usuarios`)
    console.log(`   Email: ${usuarioData.email}`)
    console.log(`   Nombre: ${usuarioData.nombre}`)
    console.log(`   Rol: ${usuarioData.rol}`)
    console.log(`   Profesional: ${usuarioData.profesional}`)
    console.log('='.repeat(60))
    console.log(`✅ Registro completado exitosamente\n`)

    return NextResponse.json({
      success: true,
      user: {
        userid: usuarioData.userid,
        email: usuarioData.email,
        nombre: usuarioData.nombre,
        rol: usuarioData.rol,
        profesional: usuarioData.profesional,
        profesion: usuarioData.profesion,
        esadmin: usuarioData.esadmin
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('[register] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}