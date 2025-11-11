/**
 * ARCHIVO: app/api/users/update-status/route.ts
 * PROPÓSITO: Cambiar el estado de aprobación de un usuario
 * 
 * PUT /api/users/update-status
 * Body: {
 *   userId: string,
 *   estado: 'pendiente' | 'aprobado' | 'rechazado'
 * }
 * 
 * Campos que actualiza:
 * - estado: El nuevo estado de aprobación
 * - updated_at: Timestamp de actualización
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, estado } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser: pendiente, aprobado o rechazado' },
        { status: 400 }
      )
    }

    console.log(`🔄 Actualizando estado de usuario ${userId} a "${estado}"`)

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('usuarios')
      .update({ 
        estado
      })
      .eq('userid', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error actualizando estado:', error)
      throw error
    }

    console.log(`✅ Estado actualizado a "${estado}" para usuario ${userId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Estado actualizado a "${estado}"`,
      data 
    })
  } catch (error: any) {
    console.error('[PUT /api/users/update-status] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estado del usuario' },
      { status: 500 }
    )
  }
}
