/**
 * ARCHIVO: app/api/admin/check-user/route.ts
 * PROPÓSITO: Verificar el estado de un usuario en Firebase Auth y Firestore
 * 
 * POST /api/admin/check-user
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'email requerido' },
        { status: 400 }
      )
    }

    const admin = initializeFirebaseAdmin()
    const auth = getAuth(admin.app())
    const db = getFirestore(admin.app())

    console.log(`\n🔍 CHECK USER - Email: ${email}`)
    console.log('='.repeat(60))

    // 1. Verificar en Firebase Auth
    let authUser: any = null
    try {
      authUser = await auth.getUserByEmail(email)
      console.log(`✅ Usuario encontrado en Firebase Auth`)
      console.log(`   UID: ${authUser.uid}`)
      console.log(`   Email: ${authUser.email}`)
      console.log(`   Email Verificado: ${authUser.emailVerified}`)
      console.log(`   Deshabilitado: ${authUser.disabled}`)
      console.log(`   Creado: ${new Date(authUser.metadata.creationTime).toLocaleString()}`)
    } catch (err: any) {
      console.log(`❌ Usuario NO encontrado en Firebase Auth`)
      console.log(`   Error: ${err.message}`)
      return NextResponse.json({
        error: `Usuario ${email} no encontrado en Firebase Auth`,
        authExists: false
      }, { status: 404 })
    }

    // 2. Verificar en Firestore
    const userDoc = await db.collection('usuarios').doc(authUser.uid).get()
    
    let firestoreData: any = null
    if (userDoc.exists) {
      firestoreData = userDoc.data()
      console.log(`✅ Usuario encontrado en Firestore`)
      console.log(`   Email: ${firestoreData.email}`)
      console.log(`   Nombre: ${firestoreData.nombre}`)
      console.log(`   esAdmin: ${firestoreData.esAdmin}`)
      console.log(`   Activo: ${firestoreData.activo}`)
      console.log(`   Rol: ${firestoreData.rol}`)
    } else {
      console.log(`❌ Usuario NO encontrado en Firestore`)
    }

    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      auth: {
        uid: authUser.uid,
        email: authUser.email,
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        createdAt: new Date(authUser.metadata.creationTime).toISOString()
      },
      firestore: firestoreData ? {
        email: firestoreData.email,
        nombre: firestoreData.nombre,
        esAdmin: firestoreData.esAdmin,
        activo: firestoreData.activo,
        rol: firestoreData.rol,
        profesion: firestoreData.profesion
      } : null,
      firestoreExists: userDoc.exists,
      sync: {
        bothExist: !!firestoreData,
        adminStatus: firestoreData?.esAdmin || false
      }
    })

  } catch (error: any) {
    console.error('❌ Error en /api/admin/check-user:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
