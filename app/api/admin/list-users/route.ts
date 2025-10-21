/**
 * ARCHIVO: app/api/admin/list-users/route.ts
 * PROPÓSITO: Listar todos los usuarios de Firestore (para debugging)
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    const admin = initializeFirebaseAdmin()
    const db = getFirestore(admin.app())

    console.log('📋 Listando todos los usuarios de Firestore...')

    const usuariosSnapshot = await db.collection('usuarios').get()

    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      nombre: doc.data().nombre,
      esAdmin: doc.data().esAdmin,
      activo: doc.data().activo,
      rol: doc.data().rol,
      profesion: doc.data().profesion,
      createdAt: doc.data().createdAt
    }))

    console.log(`✅ ${usuarios.length} usuarios encontrados`)

    return NextResponse.json({
      success: true,
      totalUsuarios: usuarios.length,
      usuarios: usuarios.sort((a, b) => (a.esAdmin ? -1 : 1))
    })

  } catch (error: any) {
    console.error('❌ Error en /api/admin/list-users:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
