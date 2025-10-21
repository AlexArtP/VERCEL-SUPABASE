import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'

export const dynamic = 'force-dynamic'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

/**
 * POST /api/auth/make-admin?uid=...&email=...
 * Hacer que un usuario sea admin (solo para desarrollo/testing)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    const email = searchParams.get('email')

    if (!uid && !email) {
      return NextResponse.json(
        { success: false, message: 'Se requiere uid o email' },
        { status: 400 }
      )
    }

    console.log(`🔐 Haciendo admin a usuario: ${uid || email}...`)

    // Si es email, necesito encontrar el uid (complicado sin Admin SDK)
    // Por ahora, usaré directamente el uid
    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'Se requiere uid (usualmente el Firebase UID)' },
        { status: 400 }
      )
    }

    // Actualizar documento del usuario
    await updateDoc(doc(db, 'usuarios', uid), {
      esAdmin: true,
    })

    console.log(`✅ Usuario ${uid} ahora es admin`)

    return NextResponse.json(
      {
        success: true,
        message: `Usuario ${email || uid} ahora es admin`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error en /api/auth/make-admin:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Error' },
      { status: 500 }
    )
  }
}
