import { NextResponse } from 'next/server'
import { DEMO_DATA } from '@/lib/demoData'

// For static HTML export, force this API route to be static
export const dynamic = 'force-static'

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

    const idx = DEMO_DATA.usuarios.findIndex((u) => u.id === Number(body.id))
    if (idx === -1) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    // Actualizar solo campos permitidos para evitar inyección accidental
    const allowed = [
      'run',
      'nombre',
      'apellidos',
      'profesion',
      'cargo',
      'description',
      'telefono',
      'email',
      'specialties',
      'workingHours',
      'preferences',
      'isPublic',
    ]

    const updated = { ...DEMO_DATA.usuarios[idx] }
    for (const key of allowed) {
      if (typeof (body as any)[key] !== 'undefined') {
        ;(updated as any)[key] = (body as any)[key]
      }
    }

    DEMO_DATA.usuarios[idx] = updated
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 })
  }
}
