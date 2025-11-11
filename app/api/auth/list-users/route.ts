/**
 * ARCHIVO: app/api/auth/list-users/route.ts
 * PROPÓSITO: Endpoint para listar todos los usuarios (solo admins)
 * 
 * GET /api/auth/list-users?limit=10&offset=0
 * Query params (opcionales):
 *   - limit: número de resultados (default 10, max 100)
 *   - offset: para paginación (default 0)
 * 
 * Retorna: Lista de usuarios con sus perfiles
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role key')
  }
  
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log(`\n📋 LIST USERS REQUEST - Limit: ${limit}, Offset: ${offset}`)
    console.log('='.repeat(60))

    const serviceSupabase = createServiceRoleClient()

    // Obtener todos los perfiles (con info de auth implícita)
    console.log('🔍 Obteniendo usuarios...')
    const { data: profiles, error: profileError, count } = await serviceSupabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (profileError) {
      console.error(`❌ Error obteniendo perfiles: ${profileError.message}`)
      return NextResponse.json(
        { error: profileError.message || 'Error al obtener usuarios' },
        { status: 400 }
      )
    }

    console.log(`✅ ${profiles?.length || 0} usuarios obtenidos`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      data: profiles || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('[list-users] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
