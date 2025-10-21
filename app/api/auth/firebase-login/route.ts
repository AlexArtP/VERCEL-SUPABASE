/**
 * ARCHIVO: app/api/auth/firebase-login/route.ts
 * PROPÓSITO: Endpoint para login usando Firebase Auth
 * 
 * POST /api/auth/firebase-login
 * Body: { email: string, password: string }
 * 
 * Este endpoint autentica contra Firebase Auth y retorna los datos del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { getAuth as getClientAuth } from 'firebase/auth'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB8kRSzHD_H1_NhF8Rr-yF2gFPukpZJ5rM",
  authDomain: "agendacecosam.firebaseapp.com",
  projectId: "agendacecosam",
  storageBucket: "agendacecosam.firebasestorage.app",
  messagingSenderId: "66728286123",
  appId: "1:66728286123:web:287a51b05cb848644ea4ee"
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos' },
        { status: 400 }
      )
    }

    console.log(`\n🔐 LOGIN REQUEST - Email: ${email}`)
    console.log('='.repeat(60))

    // Inicializar Firebase (client-side SDK en server)
    let app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    const auth = getClientAuth(app)
    const db = getFirestore(app)

    // Intentar autenticar
    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log(`✅ Autenticación exitosa - UID: ${userCredential.user.uid}`)
    } catch (authError: any) {
      console.log(`❌ Autenticación fallida: ${authError.code}`)
      
      let errorMessage = 'Credenciales incorrectas'
      if (authError.code === 'auth/user-not-found') {
        errorMessage = 'El usuario no existe'
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta'
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido'
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    // Obtener datos del usuario en Firestore
    console.log(`📄 Obteniendo datos del usuario de Firestore...`)
    const userDocRef = doc(db, 'usuarios', userCredential.user.uid)
    const userDoc = await getDoc(userDocRef)

    if (!userDoc.exists()) {
      console.log(`⚠️ Usuario NO existe en Firestore`)
      // El usuario existe en Firebase Auth pero no en Firestore
      // Es posible que sea un usuario nuevo sin documento
      return NextResponse.json({
        success: true,
        token: 'firebase-token', // En producción, usar custom token
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          nombre: userCredential.user.displayName || userCredential.user.email,
          apellidoPaterno: '',
          apellidoMaterno: '',
          esAdmin: false,
          activo: true
        }
      })
    }

    const userData = userDoc.data()
    console.log(`✅ Datos obtenidos de Firestore`)
    console.log(`   Email: ${userData.email}`)
    console.log(`   Nombre: ${userData.nombre}`)
    console.log(`   esAdmin: ${userData.esAdmin}`)
    console.log(`   activo: ${userData.activo}`)

    // Verificar si el usuario está activo
    if (userData.activo === false) {
      console.log(`❌ Usuario inactivo`)
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacta al administrador.' },
        { status: 403 }
      )
    }

    // Verificar si requiere cambio de contraseña
    if (userData.cambioPasswordRequerido) {
      console.log(`⚠️ Usuario requiere cambio de contraseña`)
      return NextResponse.json({
        success: true,
        requiresPasswordChange: true,
        token: 'firebase-token',
        user: {
          uid: userCredential.user.uid,
          email: userData.email,
          nombre: userData.nombre,
          apellidoPaterno: userData.apellidoPaterno,
          apellidoMaterno: userData.apellidoMaterno,
          esAdmin: userData.esAdmin || false,
          activo: userData.activo !== false,
          cambioPasswordRequerido: true
        }
      })
    }

    console.log('='.repeat(60))
    console.log(`✅ Login completado exitosamente\n`)

    return NextResponse.json({
      success: true,
      token: 'firebase-token', // En producción, usar custom token
      user: {
        uid: userCredential.user.uid,
        email: userData.email,
        nombre: userData.nombre,
        apellidoPaterno: userData.apellidoPaterno,
        apellidoMaterno: userData.apellidoMaterno,
        esAdmin: userData.esAdmin || false,
        activo: userData.activo !== false
      }
    })

  } catch (error: any) {
    console.error('❌ Error en /api/auth/firebase-login:', error.message)
    return NextResponse.json(
      { 
        error: 'Error al procesar login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
