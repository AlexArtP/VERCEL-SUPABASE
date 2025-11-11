import { NextResponse } from 'next/server'
import { DEMO_DATA } from '@/lib/demoData'
import { createServiceRoleClient } from '@/lib/supabaseClient'

// This route performs server-side reads/writes. Force dynamic rendering so
// it can call the database at request time.
export const dynamic = 'force-dynamic'

/**
 * API de perfil de usuario (in-memory para demo)
 * 
 * GET /api/profile?id={userId}
 * - Query params: id (number, required)
 * - Response 200: User object { id, nombre, apellidos, run, email, telefono, profesion, cargo, ... }
 * - Response 400: { message: 'id query param required' }
 * - Response 404: { message: 'User not found' }
 * - Response 500: { message: 'Internal error' }
 * 
 * PUT /api/profile
 * - Body (JSON): { id: number, ...fieldsToUpdate }
 * - Allowed fields: run, nombre, apellidos, profesion, cargo, description, telefono, email, specialties, workingHours, preferences, isPublic
 * - Response 200: Updated user object
 * - Response 400: { message: 'Invalid body' }
 * - Response 404: { message: 'User not found' }
 * - Response 500: { message: 'Internal error' }
 * 
 * Nota: este endpoint modifica DEMO_DATA en memoria (se pierde al reiniciar servidor).
 * Para producción, reemplazar con una base de datos persistente.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ message: 'id query param required' }, { status: 400 })
    
    // Try to persist in Supabase (server-side) if service role is available.
    try {
      const supabase = createServiceRoleClient()
      const { data, error, status } = await supabase
        .from('usuarios')
        .select('*')
        .eq('userid', id)
        .limit(1)
        .maybeSingle()

      if (error) {
        // If the table doesn't exist or permission error, fallback to DEMO_DATA
        // but log the error server-side.
        // eslint-disable-next-line no-console
        console.warn('[profile.GET] supabase error:', error.message || error)
      } else if (data) {
        return NextResponse.json(data)
      }
    } catch (e) {
      // service-role key not configured or other failure — fallback below
      // eslint-disable-next-line no-console
      console.warn('[profile.GET] supabase client not available, falling back to DEMO_DATA')
    }

    const uid = Number(id)
    const user = DEMO_DATA.usuarios.find((u) => u.id === uid)
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (e) {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body || typeof body.id === 'undefined') {
      return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
    }
    // Actualizar solo campos permitidos que existen en Supabase
    const allowed = [
      'run',
      'nombre',
      'apellido_paterno',
      'apellido_materno',
      'telefono',
      'email',
      'estado',
      'activo',
      'rol',
      'esadmin',
      'profesional',
      'direccion',
      'fotoperfil',
      // Otros campos que existen en la tabla
      'agendaDisabled',
      'agendaDisabledReason',
      'isPublic',
    ]
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (typeof (body as any)[key] !== 'undefined' && (body as any)[key] !== null) {
        updates[key] = (body as any)[key]
      }
    }

    // Try to persist in Supabase (server-side) if service role is available.
    try {
      const supabase = createServiceRoleClient()
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('userid', String(body.id))
        .select()
        .maybeSingle()

      if (error) {
        // Log and fall back to DEMO_DATA below.
        // eslint-disable-next-line no-console
        console.warn('[profile.PUT] supabase update error:', error.message || error)
      } else if (data) {
        return NextResponse.json(data)
      }
    } catch (e: any) {
      // service-role not configured or other error — fallback to DEMO_DATA
      // eslint-disable-next-line no-console
      console.warn('[profile.PUT] supabase client error:', e?.message || 'unknown')
    }

    // Fallback: update in-memory DEMO_DATA so UI changes still reflect in dev/demo.
    const idx = DEMO_DATA.usuarios.findIndex((u) => u.id === Number(body.id))
    if (idx === -1) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const updated = { ...DEMO_DATA.usuarios[idx] }
    for (const key of Object.keys(updates)) {
      ;(updated as any)[key] = updates[key]
    }

    DEMO_DATA.usuarios[idx] = updated
    return NextResponse.json(updated)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[profile.PUT] error:', e)
    return NextResponse.json({ message: 'Internal error: ' + (e?.message || 'unknown') }, { status: 500 })
  }
}
