/**
 * ARCHIVO: app/api/auth/debug-admin-check/route.ts
 * PROPÓSITO: Endpoint para debuguear por qué isAdminFromFirestore() falla
 * 
 * Verificar:
 * 1. Si el usuario está autenticado
 * 2. Si tiene documento en usuarios collection
 * 3. Si el documento tiene esAdmin: true
 * 4. Si la función isAdminFromFirestore() puede leer el documento
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeFirebaseAdmin } from '@/lib/firebaseAdmin'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { uid, token } = await request.json()

    if (!uid) {
      return NextResponse.json(
        { error: 'uid requerido' },
        { status: 400 }
      )
    }

    const admin = initializeFirebaseAdmin()
    const adminDb = getFirestore(admin.app())
    const adminAuth = getAuth(admin.app())

    console.log(`\n🔍 DEBUG ADMIN CHECK - UID: ${uid}`)
    console.log('=' .repeat(60))

    // 1. Verificar que el usuario existe en Firebase Auth
    let userAuth = null
    try {
      userAuth = await adminAuth.getUser(uid)
      console.log(`✅ Usuario encontrado en Firebase Auth`)
      console.log(`   Email: ${userAuth.email}`)
      console.log(`   UID: ${userAuth.uid}`)
    } catch (err: any) {
      console.log(`❌ Usuario NO encontrado en Firebase Auth`)
      console.log(`   Error: ${err.message}`)
      return NextResponse.json({
        error: `Usuario ${uid} no existe en Firebase Auth`,
        debug: {
          step: 'firebase_auth_lookup',
          uid,
          found: false
        }
      }, { status: 404 })
    }

    // 2. Verificar que el usuario existe en Firestore
    const userDoc = await adminDb.collection('usuarios').doc(uid).get()
    
    if (!userDoc.exists) {
      console.log(`❌ Usuario NO encontrado en Firestore (usuarios collection)`)
      return NextResponse.json({
        error: `Usuario ${uid} no existe en Firestore usuarios collection`,
        debug: {
          step: 'firestore_lookup',
          uid,
          found: false,
          firestore_path: `usuarios/${uid}`
        }
      }, { status: 404 })
    }

    const userData = userDoc.data()
    console.log(`✅ Usuario encontrado en Firestore`)
    console.log(`   Datos del documento:`)
    console.log(`   - email: ${userData?.email}`)
    console.log(`   - nombre: ${userData?.nombre}`)
    console.log(`   - esAdmin: ${userData?.esAdmin}`)

    // 3. Verificar si esAdmin está en true
    if (userData?.esAdmin !== true) {
      console.log(`❌ Usuario NO es admin (esAdmin no es true)`)
      return NextResponse.json({
        error: `Usuario ${uid} no es administrador (esAdmin=${userData?.esAdmin})`,
        debug: {
          step: 'admin_check',
          uid,
          esAdmin: userData?.esAdmin,
          isAdmin: false
        }
      }, { status: 403 })
    }

    console.log(`✅ Usuario ES admin (esAdmin=true)`)
    console.log('=' .repeat(60))

    return NextResponse.json({
      success: true,
      isAdmin: true,
      user: {
        uid,
        email: userData.email,
        nombre: userData.nombre,
        esAdmin: userData.esAdmin
      },
      debug: {
        firebaseAuth: 'encontrado',
        firestore: 'encontrado',
        esAdmin: true
      }
    })

  } catch (error: any) {
    console.error('❌ Error en debug-admin-check:', error.message)
    return NextResponse.json(
      { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
