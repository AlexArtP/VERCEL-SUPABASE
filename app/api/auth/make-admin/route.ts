/**
 * ARCHIVO: app/api/auth/make-admin/route.ts
 * PROPÓSITO: Endpoint para establecer/remover permisos de admin a un usuario
 * 
 * POST /api/auth/make-admin
 * Body: { 
 *   userId: string (UUID del usuario),
 *   isAdmin: boolean
 * }
 * 
 * Nota: Solo admins pueden ejecutar esta operación (verificar en futuro con JWT claims)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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
    const { userId, isAdmin } = body

    if (!userId || typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'userId e isAdmin (boolean) son requeridos' },
        { status: 400 }
      )
    }

    console.log(`\n� SET ADMIN REQUEST - UserID: ${userId}, isAdmin: ${isAdmin}`)
    console.log('='.repeat(60))

    const serviceSupabase = createServiceRoleClient()

    // Actualizar el perfil del usuario con el flag is_admin
    console.log('📝 Actualizando perfil...')
    const { error: updateError } = await serviceSupabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId)

    if (updateError) {
      console.error(`❌ Error actualizando perfil: ${updateError.message}`)
      return NextResponse.json(
        { error: updateError.message || 'Error al actualizar admin status' },
        { status: 400 }
      )
    }

    console.log(`✅ Admin status actualizado: ${isAdmin ? 'Promovido' : 'Removido'} a admin`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      message: isAdmin ? 'Usuario promovido a admin' : 'Permisos de admin removidos',
      userId,
      isAdmin
    })
  } catch (error: any) {
    console.error('[make-admin] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
