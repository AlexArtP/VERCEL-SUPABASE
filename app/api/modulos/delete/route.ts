import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = body?.id
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const srv = createServiceRoleClient()
    const idStr = String(id)
    // Borrar por id o moduloid
    const orFilter = `id.eq.${idStr},moduloid.eq.${idStr}`
    const { data, error } = await srv.from('modulos').delete().or(orFilter).select()
    if (error) {
      console.error('[api/modulos/delete] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/modulos/delete] Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
