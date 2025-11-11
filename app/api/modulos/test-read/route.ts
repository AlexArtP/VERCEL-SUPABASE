import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
import { createServiceRoleClient } from '@/lib/supabaseClient'

/**
 * GET /api/modulos/test-read
 * Test endpoint para leer TODOS los módulos sin RLS (service-role)
 */
export async function GET(req: NextRequest) {
  try {
    const srv = createServiceRoleClient()
    
    // Query 1: Leer TODO sin filtros
    console.log('[test-read] 1️⃣ Query SIN FILTROS (todas las filas)')
    const { data: allData, error: allError } = await srv
      .from('modulos')
      .select('*')
    
    if (allError) {
      console.error('[test-read] Error:', allError.message)
      return NextResponse.json({ error: allError.message, details: allError }, { status: 500 })
    }
    console.log('[test-read] ✅ Total filas en tabla:', allData?.length ?? 0)
    if (allData && allData.length > 0) {
      console.log('[test-read] Primer item keys:', Object.keys(allData[0]))
      console.log('[test-read] Primeros 3 items:')
      allData.slice(0, 3).forEach((item, i) => {
        console.log(`[test-read]   [${i}] id=${item.id}, profesional_id=${item.profesional_id}, profesionalid=${item.profesionalid}, fecha=${item.fecha}`)
      })
    }
    
    // Query 2: Filtrar por profesionalid EXACTO
    const testUid = '1a41fb81-4ddc-4703-a81e-8581d058f8e3'
    console.log(`[test-read] 2️⃣ Query filtrando eq(profesionalid, "${testUid}")`)
    const { data: byProfidData, error: byProfidError } = await srv
      .from('modulos')
      .select('*')
      .eq('profesionalid', testUid)
    
    if (byProfidError) {
      console.error('[test-read] Error:', byProfidError.message)
    } else {
      console.log('[test-read] ✅ Filas encontradas:', byProfidData?.length ?? 0)
    }
    
    // Query 3: Filtrar por profesional_id (con underscore)
    console.log(`[test-read] 3️⃣ Query filtrando eq(profesional_id, "${testUid}")`)
    const { data: byProfIdData, error: byProfIdError } = await srv
      .from('modulos')
      .select('*')
      .eq('profesional_id', testUid)
    
    if (byProfIdError) {
      console.error('[test-read] Error:', byProfIdError.message)
    } else {
      console.log('[test-read] ✅ Filas encontradas:', byProfIdData?.length ?? 0)
      if (byProfIdData && byProfIdData.length > 0) {
        console.log('[test-read] Primeros 3 items encontrados:')
        byProfIdData.slice(0, 3).forEach((item, i) => {
          console.log(`[test-read]   [${i}] id=${item.id}, fecha=${item.fecha}, nombre=${item.nombre}`)
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      allCount: allData?.length ?? 0,
      byProfidCount: byProfidData?.length ?? 0,
      byProfIdCount: byProfIdData?.length ?? 0,
      allSample: allData?.slice(0, 2) || [],
      byProfIdSample: byProfIdData?.slice(0, 2) || []
    })
  } catch (err: any) {
    console.error('[test-read] Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
