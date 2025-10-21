import { NextResponse } from 'next/server'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
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
 * GET /api/auth/solicitudes
 * Retorna todas las solicitudes de registro desde la colección "solicitudes"
 */
export async function GET() {
  try {
    console.log('📥 Obteniendo solicitudes de registro desde /api/auth/solicitudes...')
    
    const snapshot = await getDocs(collection(db, 'solicitudes'))
    const results: any[] = []
    
    snapshot.forEach(doc => {
      results.push({ 
        id: doc.id, 
        ...doc.data() 
      })
    })

    console.log(`✅ Se obtuvieron ${results.length} solicitudes`)
    return NextResponse.json({ 
      success: true, 
      data: results,
      count: results.length 
    }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Error en /api/auth/solicitudes:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Error al obtener solicitudes' 
    }, { status: 500 })
  }
}
