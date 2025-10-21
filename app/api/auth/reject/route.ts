/**
 * ARCHIVO: app/api/auth/reject/route.ts
 * PROPÓSITO: Endpoint para rechazar solicitudes de registro
 * 
 * POST /api/auth/reject
 * Body: {
 *   solicitudId: string,
 *   razon?: string,
 *   adminId?: string (uid del admin que rechaza)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [/api/auth/reject] Iniciando...')
    
    const body = await request.json()
    const { solicitudId, razon = '', adminId } = body

    console.log('📥 [/api/auth/reject] Body recibido:', { solicitudId, razon, adminId })

    if (!solicitudId) {
      console.error('❌ [/api/auth/reject] solicitudId no proporcionado')
      return NextResponse.json(
        { success: false, message: 'solicitudId es requerido' },
        { status: 400 }
      )
    }

    // Inicializar Firebase Admin
    console.log('🔧 [/api/auth/reject] Inicializando Firebase Admin...')
    const admin = initializeFirebaseAdmin()
    const db = getFirestore(admin.app())
    console.log('✅ [/api/auth/reject] Admin SDK inicializado')

    // Obtener solicitud
    console.log('🔍 [/api/auth/reject] Buscando solicitud:', solicitudId)
    const solicitudDoc = await db.collection('solicitudes').doc(solicitudId).get()

    if (!solicitudDoc.exists) {
      console.error('❌ [/api/auth/reject] Solicitud no encontrada:', solicitudId)
      return NextResponse.json(
        { success: false, message: 'Solicitud no encontrada' },
        { status: 404 }
      )
    }

    const solicitud = solicitudDoc.data()
    console.log('✅ [/api/auth/reject] Solicitud encontrada:', { id: solicitudId, estado: solicitud?.estado })

    // Validar estado
    if (solicitud?.estado !== 'pendiente') {
      console.error('❌ [/api/auth/reject] Solicitud no está pendiente:', solicitud?.estado)
      return NextResponse.json(
        { success: false, message: `Solicitud ya está ${solicitud?.estado}` },
        { status: 400 }
      )
    }

    console.log('🗑️  [/api/auth/reject] Eliminando solicitud...')
    // Eliminar solicitud de la colección (se rechaza)
    await db.collection('solicitudes').doc(solicitudId).delete()

    console.log(`✅ [/api/auth/reject] Solicitud rechazada y eliminada: ${solicitudId}`)

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitud rechazada y eliminada exitosamente.',
        solicitudId,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ [/api/auth/reject] Error:', error?.message || error)
    console.error('Stack:', error?.stack)
    return NextResponse.json(
      { success: false, message: error.message || 'Error al rechazar solicitud' },
      { status: 500 }
    )
  }
}
