/**
 * ARCHIVO: app/api/profesionales/route.ts
 * PROPÓSITO: Reemplazar useFirestoreProfesionales hook - Gestión de profesionales
 * 
 * GET /api/profesionales - Obtener todos los profesionales
 * GET /api/profesionales?email=... - Buscar profesional por email
 * POST /api/profesionales - Crear nuevo profesional
 * PUT /api/profesionales/{id} - Actualizar profesional
 * DELETE /api/profesionales/{id} - Eliminar profesional
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

// GET /api/profesionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const supabase = createServiceRoleClient()

    if (email) {
      // Buscar por email en usuarios
      console.log(`🔍 Buscando profesional por email: ${email}`)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('profesional', true) // Filtrar solo profesionales
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ data: null }, { status: 200 })
        }
        throw error
      }

      return NextResponse.json({ data })
    } else {
      // Obtener todos los profesionales de la tabla usuarios
      console.log('👨‍⚕️ Obteniendo todos los profesionales')
      const { data, error, count } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact' })
        .eq('profesional', true) // Filtrar solo profesionales
        .order('nombre', { ascending: true })

      if (error) throw error

      return NextResponse.json({ data, count })
    }
  } catch (error: any) {
    console.error('[GET /api/profesionales] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener profesionales' },
      { status: 500 }
    )
  }
}

// POST /api/profesionales
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('👨‍⚕️ Creando nuevo profesional')

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        userid: body.userid || crypto.randomUUID(),
        email: body.email,
        nombre: body.nombre,
        rol: 'profesional',
        profesional: true,
        profesion: body.profesion || null,
        esadmin: false,
        ...body
      }])
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Profesional creado: ${data.userid}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[POST /api/profesionales] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear profesional' },
      { status: 500 }
    )
  }
}

// PUT /api/profesionales/{id}
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get('id')
    const body = await request.json()

    if (!profesionalId) {
      return NextResponse.json(
        { error: 'profesionalId es requerido' },
        { status: 400 }
      )
    }

    console.log(`✏️ Actualizando profesional: ${profesionalId}`)

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('usuarios')
      .update(body)
      .eq('userid', profesionalId)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Profesional actualizado: ${profesionalId}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[PUT /api/profesionales] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar profesional' },
      { status: 500 }
    )
  }
}

// DELETE /api/profesionales/{id}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get('id')

    if (!profesionalId) {
      return NextResponse.json(
        { error: 'profesionalId es requerido' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Eliminando profesional: ${profesionalId}`)

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('userid', profesionalId)

    if (error) throw error

    console.log(`✅ Profesional eliminado: ${profesionalId}`)
    return NextResponse.json({ success: true, profesionalId })
  } catch (error: any) {
    console.error('[DELETE /api/profesionales] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar profesional' },
      { status: 500 }
    )
  }
}
