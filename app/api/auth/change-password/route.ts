import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(url, key, {
    auth: { persistSession: false }
  })
}

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

/**
 * POST /api/auth/change-password
 * Body: { email, currentPassword, newPassword }
 * 
 * Flujo:
 * 1. Reautenticar usuario con credenciales actuales (client public)
 * 2. Si OK, actualizar contraseña usando service-role (server-side)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, currentPassword, newPassword } = body

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Email, contraseña actual y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      )
    }

    console.log(`\n🔑 CHANGE PASSWORD REQUEST - Email: ${email}`)
    console.log('='.repeat(60))

    // Paso 1: Reautenticar con cliente público para verificar contraseña
    console.log('🔍 Verificando credenciales actuales...')
    const publicClient = createPublicClient()
    
    const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
      email,
      password: currentPassword
    })

    if (authError || !authData.user) {
      console.error('❌ Credenciales inválidas:', authError?.message)
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 401 }
      )
    }

    const userId = authData.user.id
    console.log(`✅ Usuario verificado - UID: ${userId}`)

    // Paso 2: Actualizar contraseña usando service-role
    console.log('🔐 Actualizando contraseña con service-role...')
    const serviceSupabase = createServiceRoleClient()
    
    const { error: updateError } = await (serviceSupabase.auth as any).admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError.message)
      return NextResponse.json(
        { error: updateError.message || 'Error al cambiar contraseña' },
        { status: 400 }
      )
    }

    console.log('✅ Contraseña actualizada exitosamente')
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })
  } catch (error: any) {
    console.error('[change-password] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
