import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const srv = createServiceRoleClient()

    const { data, error } = await srv
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/pacientes/list] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/pacientes/list] Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
