/**
 * ARCHIVO: app/api/admin/reset-user-password/route.ts
 * PROPÓSITO: Endpoint para cambiar la contraseña de un usuario
 * 
 * POST /api/admin/reset-user-password
 * Body: { userId: string, newPassword: string }
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
    const body = await request.json()
    const { email, newPassword = 'demo123' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    console.log(`\n🔐 RESET PASSWORD - Email: ${email}`)
    console.log('='.repeat(60))

    const supabase = createSupabaseServiceClient()

    // Obtener el usuario por email para obtener el ID
    console.log(`🔍 Buscando usuario...`)
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    const user = users?.users?.find(u => u.email === email)
    if (!user) {
      console.error(`❌ Usuario no encontrado`)
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    console.log(`✅ Usuario encontrado: ${user.id}`)

    // Cambiar contraseña
    console.log(`🔐 Cambiando contraseña...`)
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error(`❌ Error cambiando contraseña: ${updateError.message}`)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Contraseña cambiada exitosamente`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      message: `✅ Contraseña del usuario ${email} ha sido restablecida a: ${newPassword}`
    })
  } catch (error: any) {
    console.error('[reset-user-password] Error:', error)
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    )
  }
}
