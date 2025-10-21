/**
 * ARCHIVO: app/api/admin/init-database/route.ts
 * PROPÓSITO: API endpoint para inicializar la base de datos (SERVER-SIDE)
 * 
 * Este endpoint maneja la inicialización de Firebase en el servidor,
 * no en el cliente, para evitar errores de compilación de Webpack.
 */

import { NextRequest, NextResponse } from 'next/server'

// Configurar como dinámico (no static)
export const dynamic = 'force-dynamic'

// Lazy import to avoid Firebase init during build
async function getInitializeDatabase() {
  const { initializeDatabase } = await import('@/lib/firebase-init')
  return initializeDatabase
}

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

    // Lazy-load initializeDatabase to avoid Firebase init during build
    const initializeDatabase = await getInitializeDatabase()

    // Ejecutar la inicialización
    const result = await initializeDatabase()

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error in init-database API:', error)

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
