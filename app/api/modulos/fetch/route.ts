import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

/**
 * GET /api/modulos/fetch
 * 
 * Lee módulos desde el servidor usando service-role (bypassa RLS)
 * El servidor valida que el usuario solo pueda leer sus propios módulos
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profesionalId = searchParams.get('profesionalId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!profesionalId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Faltan parámetros: profesionalId, startDate, endDate' },
        { status: 400 }
      )
    }

    console.log('[api/modulos/fetch] 📊 Fetching modulos')
    console.log(`  - profesionalId: ${profesionalId}`)
    console.log(`  - rango: ${startDate} a ${endDate}`)

    // Usar service-role para leer (bypassa RLS)
    const srv = createServiceRoleClient()
    const { data, error } = await srv
      .from('modulos')
      .select('id, profesional_id, profesionalid, fecha, hora_inicio, hora_fin, nombre, descripcion, configuracion, created_at, moduloid, fechacreacion, tipo')
      .eq('profesional_id', profesionalId)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })

    if (error) {
      console.error('[api/modulos/fetch] ❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[api/modulos/fetch] ✅ Fetched ${data?.length || 0} modulos`)
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/modulos/fetch] ❌ Exception:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
