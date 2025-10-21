/**
 * ARCHIVO: app/api/auth/reset-password/route.ts
 * PROPÓSITO: Endpoint para regenerar contraseña temporal de un usuario (admin only)
 * 
 * POST /api/auth/reset-password
 * Body: {
 *   userId: string (uid del usuario)
 * }
 * 
 * Acciones:
 * 1. Genera contraseña temporal aleatoria
 * 2. Actualiza usuario en Firebase Auth
 * 3. Establece flag cambioPasswordRequerido = true
 * 4. Retorna contraseña temporal
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'
import * as crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📍 [/api/auth/reset-password] Iniciando...')

    const admin = initializeFirebaseAdmin()
    const adminAuth = getAuth(admin.app())
    const adminDb = getFirestore(admin.app())

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      console.error('❌ [/api/auth/reset-password] userId no proporcionado')
      return NextResponse.json(
        { success: false, message: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Obtener usuario
    console.log('🔍 [/api/auth/reset-password] Buscando usuario:', userId)
    const userRecord = await adminAuth.getUser(userId)

    if (!userRecord) {
      console.error('❌ [/api/auth/reset-password] Usuario no encontrado:', userId)
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Generar contraseña temporal segura
    let temporaryPassword = crypto.randomBytes(8).toString('hex').toUpperCase().slice(0, 10)
    // Asegurar que tenga mayúscula y número
    if (!/[A-Z]/.test(temporaryPassword)) temporaryPassword = 'P' + temporaryPassword
    if (!/[0-9]/.test(temporaryPassword)) temporaryPassword = temporaryPassword + '9'

    console.log(`🔐 Contraseña temporal generada: ${temporaryPassword}`)

    // Actualizar contraseña en Firebase Auth
    try {
      await adminAuth.updateUser(userId, {
        password: temporaryPassword,
      })
      console.log(`✅ Contraseña actualizada para usuario: ${userId}`)
    } catch (authError: any) {
      console.error('❌ Error actualizando contraseña en Auth:', authError.message)
      throw authError
    }

    // Actualizar flag en Firestore
    try {
      await adminDb.collection('usuarios').doc(userId).update({
        cambioPasswordRequerido: true,
        ultimaRegenertacionPassword: new Date().toISOString(),
      })
      console.log(`✅ Flag de cambio de contraseña establecido para: ${userId}`)
    } catch (dbError: any) {
      console.warn('⚠️ No se pudo actualizar flag en BD:', dbError.message)
      // Continuar de todas formas
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contraseña temporal generada exitosamente',
        userId,
        email: userRecord.email,
        temporaryPassword,
        instructions: `Nueva contraseña temporal:\n📧 Email: ${userRecord.email}\n🔐 Contraseña: ${temporaryPassword}\n\nℹ️ El usuario DEBE cambiar su contraseña al siguiente login.`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ [/api/auth/reset-password] Error:', error?.message || error)
    return NextResponse.json(
      { success: false, message: error.message || 'Error al regenerar contraseña' },
      { status: 500 }
    )
  }
}
