/**
 * ARCHIVO: app/api/admin/create-demo-user/route.ts
 * PROPÓSITO: Endpoint para crear usuario demo en Supabase
 * 
 * POST /api/admin/create-demo-user
 * Body: {}
 * 
 * Este endpoint crea un usuario demo para testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n📝 CREANDO USUARIO DEMO')
    console.log('='.repeat(60))

    const supabase = createSupabaseServiceClient()

    // Datos del usuario demo (basado en la estructura anterior)
    const demoUser = {
      email: 'a.arteaga02@ufromail.com',
      password: 'demo123',
      nombre: 'Alexander',
      apellido_paterno: 'Arteaga',
      apellido_materno: 'Pereira',
      run: '26858946-5',
      profesion: 'Médico residente Psiq. Infanto Juvenil',
      telefono: '+56 9 1234 5678',
      rol: 'profesional',
      es_admin: true
    }

    // Verificar si el usuario ya existe
    console.log(`🔍 Verificando si usuario ya existe...`)
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers()
    
    const userExists = existingUser?.users?.some(u => u.email === demoUser.email)
    if (userExists) {
      console.log(`⚠️ Usuario ya existe`)
      return NextResponse.json(
        { message: 'El usuario demo ya existe', success: false },
        { status: 200 }
      )
    }

    // Crear usuario en Supabase Auth
    console.log(`🔐 Creando usuario en Supabase Auth...`)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      email_confirm: true
    })

    if (authError) {
      console.error(`❌ Error creando usuario: ${authError.message}`)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    console.log(`✅ Usuario creado en auth con ID: ${authData.user.id}`)

    // Crear perfil en tabla profiles
    console.log(`📄 Creando perfil...`)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: demoUser.email,
          nombre: demoUser.nombre,
          apellidos: `${demoUser.apellido_paterno} ${demoUser.apellido_materno}`,
          apellido_paterno: demoUser.apellido_paterno,
          apellido_materno: demoUser.apellido_materno,
          run: demoUser.run,
          profesion: demoUser.profesion,
          telefono: demoUser.telefono,
          rol: demoUser.rol,
          es_admin: demoUser.es_admin,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profesional: true,
          cargo_actual: 'Residente Psiquiatría Infanto Juvenil - UFRO'
        }
      ])
      .select()

    if (profileError) {
      console.error(`❌ Error creando perfil: ${profileError.message}`)
      return NextResponse.json(
        { error: `Error creando perfil: ${profileError.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ Perfil creado exitosamente`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      message: '✅ Usuario demo creado exitosamente',
      user: {
        id: authData.user.id,
        email: demoUser.email,
        nombre: demoUser.nombre,
        es_admin: demoUser.es_admin
      }
    })
  } catch (error: any) {
    console.error('[create-demo-user] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario demo' },
      { status: 500 }
    )
  }
}
