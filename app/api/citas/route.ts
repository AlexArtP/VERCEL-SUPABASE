/**
 * ARCHIVO: app/api/citas/route.ts
 * PROPÓSITO: Reemplazar useFirestoreCitas hook - Gestión de citas/appointments
 * 
 * GET /api/citas - Obtener todas las citas
 * GET /api/citas?profesionalId=... - Citas de un profesional
 * GET /api/citas?pacienteId=... - Citas de un paciente
 * POST /api/citas - Crear nueva cita
 * PUT /api/citas/{id} - Actualizar cita
 * DELETE /api/citas/{id} - Eliminar cita
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

// GET /api/citas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profesionalId = searchParams.get('profesionalId')
    const pacienteId = searchParams.get('pacienteId')

    const supabase = createServiceRoleClient()

    let query = supabase.from('citas').select('*')

    if (profesionalId) {
      // Validar que sea UUID v4
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(profesionalId)) {
        console.warn(`⚠️ profesionalId inválido: ${profesionalId}`)
        return NextResponse.json({ error: 'ID de profesional inválido' }, { status: 400 })
      }
      console.log(`🗓️ Buscando citas de profesional: ${profesionalId}`)
      query = query.eq('profesionalid', profesionalId)
    } else if (pacienteId) {
      console.log(`🗓️ Buscando citas de paciente: ${pacienteId}`)
      query = query.eq('pacienteid', pacienteId)
    } else {
      console.log('📋 Obteniendo todas las citas')
    }

    const { data, error, count } = await query
      .order('fecha', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data, count })
  } catch (error: any) {
    console.error('[GET /api/citas] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    )
  }
}

// POST /api/citas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📝 Creando nueva cita')

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('citas')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Cita creada: ${data.id}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[POST /api/citas] Error:', error)
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    )
  }
}

// PUT /api/citas/{id}
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const citaId = searchParams.get('id')
    const body = await request.json()

    if (!citaId) {
      return NextResponse.json(
        { error: 'citaId es requerido' },
        { status: 400 }
      )
    }

    console.log(`✏️ Actualizando cita: ${citaId}`)

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('citas')
      .update(body)
      .eq('citaid', citaId)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Cita actualizada: ${citaId}`)
    return NextResponse.json({ data, success: true })
  } catch (error: any) {
    console.error('[PUT /api/citas] Error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cita' },
      { status: 500 }
    )
  }
}

// DELETE /api/citas/{id}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const citaId = searchParams.get('id')

    if (!citaId) {
      return NextResponse.json(
        { error: 'citaId es requerido' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Eliminando cita: ${citaId}`)

    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('citas')
      .delete()
      .eq('citaid', citaId)

    if (error) throw error

    console.log(`✅ Cita eliminada: ${citaId}`)
    return NextResponse.json({ success: true, citaId })
  } catch (error: any) {
    console.error('[DELETE /api/citas] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cita' },
      { status: 500 }
    )
  }
}
