/**
 * ARCHIVO: app/api/admin/reset-password/route.ts
 * PROPÓSITO: Resetear contraseña de un usuario (admin only)
 * 
 * POST /api/admin/reset-password
 * Body: { email: string, newPassword: string }
 * 
 * Esto elimina al usuario de Firebase Auth y lo recrea con la nueva contraseña
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, uid } = await request.json()

    if (!email && !uid) {
      return NextResponse.json(
        { error: 'email o uid requerido' },
        { status: 400 }
      )
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'newPassword debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const admin = initializeFirebaseAdmin()
    const auth = getAuth(admin.app())
    const db = getFirestore(admin.app())

    console.log(`\n🔄 RESET PASSWORD REQUEST`)
    console.log('=' .repeat(60))
    console.log(`Email: ${email || 'N/A'}`)
    console.log(`UID: ${uid || 'Por determinar'}`)

    // 1. Encontrar el usuario
    let userUid = uid
    if (!userUid && email) {
      try {
        const user = await auth.getUserByEmail(email)
        userUid = user.uid
        console.log(`✅ UID encontrado: ${userUid}`)
      } catch (err: any) {
        console.log(`❌ Usuario NO encontrado en Firebase Auth con email: ${email}`)
        return NextResponse.json(
          { 
            error: `Usuario ${email} no encontrado en Firebase Auth`,
            solution: 'El usuario debe existir en Firebase Auth primero'
          },
          { status: 404 }
        )
      }
    }

    if (!userUid) {
      return NextResponse.json(
        { error: 'No se pudo determinar el UID' },
        { status: 400 }
      )
    }

    // 2. Actualizar contraseña
    try {
      console.log(`🔐 Actualizando contraseña para UID: ${userUid}`)
      
      await auth.updateUser(userUid, {
        password: newPassword,
        emailVerified: true
      })
      
      console.log(`✅ Contraseña actualizada exitosamente`)
    } catch (err: any) {
      console.error(`❌ Error al actualizar contraseña:`, err.message)
      return NextResponse.json(
        { 
          error: `No se pudo actualizar la contraseña: ${err.message}`,
          code: err.code
        },
        { status: 500 }
      )
    }

    // 3. Verificar documento en Firestore
    console.log(`📄 Verificando documento en Firestore...`)
    const userDoc = await db.collection('usuarios').doc(userUid).get()
    
    let firestoreData: any = null
    if (userDoc.exists) {
      firestoreData = userDoc.data()
      console.log(`✅ Documento encontrado en Firestore`)
      console.log(`   esAdmin: ${firestoreData.esAdmin}`)
    } else {
      console.log(`⚠️ Documento NO encontrado en Firestore`)
    }

    console.log('=' .repeat(60))

    return NextResponse.json({
      success: true,
      message: `Contraseña actualizada para ${email || userUid}`,
      user: {
        uid: userUid,
        email: email || 'N/A',
        firestoreExists: userDoc.exists,
        esAdmin: firestoreData?.esAdmin || false
      }
    })

  } catch (error: any) {
    console.error('❌ Error en /api/admin/reset-password:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
