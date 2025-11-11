import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const srv = createServiceRoleClient()

    // Consultar 1 registro para ver estructura
    const { data, error } = await srv
      .from('citas')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    // Si hay datos, mostrar claves
    const keys = data && data.length > 0 ? Object.keys(data[0]) : []

    return NextResponse.json({ 
      totalRecords: data?.length || 0,
      columns: keys,
      sampleData: data ? data[0] : null
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
