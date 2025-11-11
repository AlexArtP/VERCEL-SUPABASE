/**
 * ENDPOINT: POST /api/admin/delete-user
 * MIGRADO: De Firebase Admin SDK a Supabase Admin API
 * 
 * Propósito: Eliminar un usuario de Supabase
 * Requiere: userId
 */

import { NextRequest, NextResponse } from 'next/server'
import { deleteUser } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId es requerido' },
        { status: 400 }
      )
    }

    console.log(`🗑️  Eliminando usuario: ${userId}`)

    // Eliminar de Auth (también elimina el perfil por cascada si está configurado)
    await deleteUser(userId)

    console.log(`✅ Usuario eliminado: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    })
  } catch (error: any) {
    console.error('❌ Error eliminando usuario:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error eliminando usuario',
      },
      { status: 500 }
    )
  }
}
