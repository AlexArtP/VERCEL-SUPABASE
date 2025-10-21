import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore'
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
 * DELETE /api/auth/cleanup?email=...
 * Elimina TODAS las solicitudes de un email (para limpiar solicitudes fantasma)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Se requiere parámetro: email' },
        { status: 400 }
      )
    }

    console.log(`🧹 Limpiando todas las solicitudes del email: ${email}...`)

    // Buscar todas las solicitudes de este email
    const q = query(collection(db, 'solicitudes'), where('email', '==', email))
    const snapshot = await getDocs(q)

    console.log(`Found ${snapshot.size} solicitudes para ${email}`)

    let deletedCount = 0
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, 'solicitudes', docSnapshot.id))
      deletedCount++
      console.log(`✅ Eliminada solicitud: ${docSnapshot.id}`)
    }

    return NextResponse.json(
      {
        success: true,
        message: `Se eliminaron ${deletedCount} solicitud(es) del email ${email}`,
        deletedCount,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error en /api/auth/cleanup:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Error al limpiar solicitudes' },
      { status: 500 }
    )
  }
}
