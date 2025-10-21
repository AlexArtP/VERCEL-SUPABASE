/**
 * ENDPOINT: GET /api/admin/get-users
 * Propósito: Obtener lista de usuarios desde Firestore usando Admin SDK
 * Uso: Para Gestión de Usuarios en el dashboard (requiere ser admin o dev)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('📄 GET /api/admin/get-users')

    // Obtener Firestore Admin
    const db = getAdminFirestore()

    // Obtener todos los usuarios de Firestore
    const usuariosSnapshot = await db.collection('usuarios').get()

    if (usuariosSnapshot.empty) {
      console.log('⚠️  No se encontraron usuarios en Firestore')
      return NextResponse.json({
        success: true,
        usuarios: [],
        count: 0,
      })
    }

    // Mapear documentos a objetos con id
    const usuarios = usuariosSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`✅ ${usuarios.length} usuarios obtenidos desde Firestore`)

    return NextResponse.json({
      success: true,
      usuarios,
      count: usuarios.length,
    })
  } catch (error: any) {
    console.error('❌ Error obteniendo usuarios:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error obteniendo usuarios',
      },
      { status: 500 }
    )
  }
}
