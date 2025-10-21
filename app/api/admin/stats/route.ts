/**
 * ARCHIVO: app/api/admin/stats/route.ts
 * PROPÓSITO: API endpoint para obtener estadísticas de la BD (SERVER-SIDE)
 */

import { NextRequest, NextResponse } from 'next/server'

// Configurar como dinámico (no static)
export const dynamic = 'force-dynamic'

// Lazy import to avoid Firebase init during build
async function getDatabaseStatsFunc() {
  const { getDatabaseStats } = await import('@/lib/firebase-init')
  return getDatabaseStats
}

/**
 * GET /api/admin/stats
 * 
 * Retorna las estadísticas actuales de la base de datos
 */
export async function GET(request: NextRequest) {
  try {
    const getDatabaseStats = await getDatabaseStatsFunc()
    const stats = await getDatabaseStats()
    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error in stats API:', error)

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
