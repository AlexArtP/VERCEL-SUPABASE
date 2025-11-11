import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'
import { DEMO_DATA } from '@/lib/demoData'

export const dynamic = 'force-dynamic'

/**
 * GET /api/usuarios/list
 * - Returns: { data: Usuario[] }
 * - Response 200: Array of users from Supabase or DEMO_DATA
 * - Response 500: { error: 'Internal error message' }
 */
export async function GET(request: Request) {
  try {
    // Try to fetch from Supabase (server-side with service role)
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        // If the table doesn't exist or permission error, fallback to DEMO_DATA
        console.warn('[usuarios.GET] supabase error:', error.message || error)
      } else if (data && Array.isArray(data)) {
        return NextResponse.json({ data })
      }
    } catch (e) {
      // service-role key not configured or other failure — fallback below
      console.warn('[usuarios.GET] supabase client not available, falling back to DEMO_DATA')
    }

    // Fallback: return DEMO_DATA
    return NextResponse.json({ data: DEMO_DATA.usuarios || [] })
  } catch (e: any) {
    console.error('[usuarios.GET] error:', e)
    return NextResponse.json({ error: 'Internal error: ' + (e?.message || 'unknown') }, { status: 500 })
  }
}
