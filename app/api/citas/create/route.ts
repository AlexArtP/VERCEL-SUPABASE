import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const srv = createServiceRoleClient()

    // Extraer hora_inicio y hora_fin del timestamp completo si viene en ese formato
    let hora_inicio = body.hora || '00:00'
    let hora_fin = body.horaFin || '00:30'
    let fecha = body.fecha || new Date().toISOString().split('T')[0]

    // Si viene start/end en ISO format, extraer partes
    if (body.start && body.start.includes('T')) {
      const [f, h] = body.start.split('T')
      fecha = f
      hora_inicio = h.substring(0, 5) // HH:MM
    }
    if (body.end && body.end.includes('T')) {
      hora_fin = body.end.split('T')[1].substring(0, 5) // HH:MM
    }

    // Construir el payload SOLO con campos que existen en la tabla:
    // id, profesional_id, paciente_id, modulo_id, fecha, hora_inicio, hora_fin, estado, paciente_nombre_cache, created_at
    const payload: Record<string, any> = {
      fecha: fecha,
      hora_inicio: hora_inicio,
      hora_fin: hora_fin,
      estado: body.estado ?? 'pendiente',
    }

    // Agregar campos requeridos
    if (body.moduloId || body.modulo_id) {
      payload.modulo_id = body.moduloId ?? body.modulo_id
    }
    if (body.profesionalId || body.profesional_id) {
      payload.profesional_id = body.profesionalId ?? body.profesional_id
    }
    if (body.pacienteId || body.paciente_id) {
      payload.paciente_id = body.pacienteId ?? body.paciente_id
    }
    // Usar paciente_nombre_cache (no paciente_nombre)
    // El frontend ya combina nombre + apellidos en 'nombreCompleto'
    if (body.pacienteNombre || body.paciente_nombre_cache) {
      payload.paciente_nombre_cache = body.pacienteNombre ?? body.paciente_nombre_cache
    }
    // También guardar apellidos si vienen separados (para disponibilidad futura)
    if (body.pacienteApellidos || body.apellidos) {
      payload.paciente_apellidos_cache = body.pacienteApellidos ?? body.apellidos
    }
    // Guardar observaciones
    if (body.observacion) {
      payload.observaciones = body.observacion
    }
    // Guardar tipo de cita (nombre del módulo)
    if (body.tipo) {
      payload.tipocita = body.tipo
    }

    console.log('[api/citas/create] 📝 Creando cita:', payload)

    const { data, error } = await srv
      .from('citas')
      .insert([payload])
      .select()

    if (error) {
      console.error('[api/citas/create] ❌ Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enriquecer la respuesta con datos adicionales para la UI (run y teléfono)
    const enrichedData = {
      ...data?.[0],
      paciente_run: body.pacienteRun || null,
      paciente_telefono: body.pacienteTelefono || null,
    }

    console.log('[api/citas/create] ✅ Cita creada:', enrichedData)
    return NextResponse.json({ data: [enrichedData] })
  } catch (err: any) {
    console.error('[api/citas/create] ❌ Exception:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
