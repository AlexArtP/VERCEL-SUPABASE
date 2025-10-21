/**
 * ARCHIVO: app/api/admin/wipe/route.ts
 * PROPÓSITO: API endpoint para limpiar la BD (SERVER-SIDE)
 * 
 * ⚠️ PELIGROSO - Este endpoint borra todos los datos
 */

import { NextRequest, NextResponse } from 'next/server'

// Configurar como dinámico (no static)
export const dynamic = 'force-dynamic'

// Lazy import to avoid Firebase init during build
async function getWipeDatabase() {
  const { wipeDatabase } = await import('@/lib/firebase-init')
  return wipeDatabase
}

/**
 * POST /api/admin/wipe
 * 
 * Limpia TODA la base de datos
 * ⚠️ DESTRUCTIVO - No se puede deshacer
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que hay un token en los headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header provided' },
        { status: 401 }
      )
    }

    // Confirmar que es intencional (enviar "confirm": true)
    const body = await request.json()
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: 'Confirmación requerida (send confirm: true)' },
        { status: 400 }
      )
    }

    // Lazy-load wipeDatabase to avoid Firebase init during build
    const wipeDatabase = await getWipeDatabase()

    // Ejecutar la limpieza
    await wipeDatabase()

    return NextResponse.json(
      { message: 'Base de datos limpiada exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error in wipe API:', error)

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
