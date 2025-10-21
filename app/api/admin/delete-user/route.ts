/**
 * ENDPOINT: POST /api/admin/delete-user
 * Propósito: Eliminar un usuario de Firestore
 * Requiere: userId
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

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

    const db = getAdminFirestore()
    await db.collection('usuarios').doc(userId).delete()

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
