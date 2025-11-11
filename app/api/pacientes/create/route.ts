import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      run,
      fecha_nacimiento,
      email,
      telefono,
      psicologo_id,
      psiquiatra_id,
      asistente_social_id,
    } = body

    if (!nombre || !apellido_paterno || !run || !fecha_nacimiento || !email) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const srv = createServiceRoleClient()

    // Calcular edad
    const birthDate = new Date(fecha_nacimiento)
    const today = new Date()
    let edad = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      edad--
    }

    const { data, error } = await srv
      .from('pacientes')
      .insert([
        {
          nombre,
          apellido_paterno,
          apellido_materno,
          run,
          fecha_nacimiento,
          edad,
          email,
          telefono,
          psicologo_id,
          psiquiatra_id,
          asistente_social_id,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[api/pacientes/create] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[api/pacientes/create] ✅ Paciente creado:', data)
    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('[api/pacientes/create] Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
