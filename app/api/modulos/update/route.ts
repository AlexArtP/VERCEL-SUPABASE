import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabaseClient'

export const runtime = 'nodejs'

// Nota: este endpoint usa la service-role key para realizar la UPDATE en la tabla
// `modulos`. Para evitar que cualquier actor actualice módulos arbitrarios,
// validamos la identidad del llamante a partir del header Authorization (o
// cookie `sistema_auth_token`) intentando extraer un UID. Solo permitimos la
// actualización si el UID coincide con el `profesionalid` del módulo o si el
// token contiene un indicador de admin.

function extractUidFromToken(t: string | null | undefined): string | null {
  if (!t) return null
  const trimmed = t.trim()
  let uid: string | null = null

  // A) JSON plano
  if (trimmed.startsWith('{')) {
    try { const parsed = JSON.parse(trimmed); uid = parsed?.userId || parsed?.id || null } catch (e) {}
  }
  // B) URL encoded JSON
  if (!uid && (trimmed.startsWith('%7B') || trimmed.startsWith('%7b'))) {
    try { const decoded = decodeURIComponent(trimmed); const parsed = JSON.parse(decoded); uid = parsed?.userId || parsed?.id || null } catch (e) {}
  }
  // C) base64 JSON
  if (!uid && /^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0) {
    try { const b = Buffer.from(trimmed, 'base64').toString('utf8'); if (b && b.trim().startsWith('{')) { const parsed = JSON.parse(b); uid = parsed?.userId || parsed?.id || null } } catch (e) {}
  }
  // D) UUID directo
  if (!uid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(trimmed)) uid = trimmed
  }
  // E) JWT: extraer claim 'sub'
  if (!uid && trimmed.includes('.') && trimmed.split('.').length === 3) {
    try {
      let payload = trimmed.split('.')[1]
      payload += '='.repeat((4 - payload.length % 4) % 4)
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
      uid = decoded?.sub || decoded?.userId || decoded?.id || null
    } catch (e) {}
  }

  return uid
}

export async function POST(req: NextRequest) {
  const traceId = `${Date.now()}-${Math.random().toString(16).slice(2,8)}`
  console.log(`[api/modulos/update][${traceId}] ▶ Inicio POST update modulo`)
  try {
    const body = await req.json()
    console.log(`[api/modulos/update][${traceId}] Body recibido:`, body)
    const id = body?.id
    if (!id) {
      console.warn(`[api/modulos/update][${traceId}] Falta id en body`)
      return NextResponse.json({ error: 'Missing id', traceId }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization') || ''
    let token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) token = req.cookies.get('sistema_auth_token')?.value || ''
    if (!token) {
      console.warn(`[api/modulos/update][${traceId}] Sin token (header/cookie)`)
      return NextResponse.json({ error: 'Token de autenticación requerido', traceId }, { status: 401 })
    }
    console.log(`[api/modulos/update][${traceId}] Token length=${token.length} starts='${token.slice(0,15)}'`)

    const uid = extractUidFromToken(token)
    console.log(`[api/modulos/update][${traceId}] UID extraído:`, uid)
    if (!uid) return NextResponse.json({ error: 'UID no determinado a partir del token', traceId }, { status: 401 })

    const payload: Record<string, any> = {}
    if (body.fecha !== undefined) payload.fecha = body.fecha
    if (body.fecha_iso !== undefined) payload.fecha = body.fecha_iso
    if (body.horaInicio !== undefined) payload.hora_inicio = body.horaInicio
    if (body.horaFin !== undefined) payload.hora_fin = body.horaFin
    if (body.hora_inicio !== undefined) payload.hora_inicio = body.hora_inicio
    if (body.hora_fin !== undefined) payload.hora_fin = body.hora_fin
    if (body.tipo !== undefined) payload.tipo = body.tipo
    if (body.descripcion !== undefined) payload.descripcion = body.descripcion
    if (body.nombre !== undefined) payload.nombre = body.nombre
    console.log(`[api/modulos/update][${traceId}] Payload construido:`, payload)
    if (Object.keys(payload).length === 0) {
      console.warn(`[api/modulos/update][${traceId}] Sin campos actualizables en body`)
      return NextResponse.json({ error: 'No updatable fields provided', traceId }, { status: 400 })
    }

    const srv = createServiceRoleClient()
    const idStr = String(id)
    const t0 = performance.now()
    const { data: existingRows, error: fetchErr } = await srv.from('modulos').select('id,profesionalid,profesional_id,fecha,hora_inicio,hora_fin,tipo,nombre,descripcion').eq('id', idStr)
    const t1 = performance.now()
    console.log(`[api/modulos/update][${traceId}] Fetch existing duration=${(t1-t0).toFixed(1)}ms`)
    if (fetchErr) {
      console.error(`[api/modulos/update][${traceId}] Error fetching existing module:`, fetchErr)
      return NextResponse.json({ error: fetchErr.message, traceId }, { status: 500 })
    }
    if (!existingRows || existingRows.length === 0) {
      console.warn(`[api/modulos/update][${traceId}] Módulo id=${idStr} no encontrado`)
      return NextResponse.json({ error: 'Módulo no encontrado', traceId }, { status: 404 })
    }
    const existing = existingRows[0] as any
    console.log(`[api/modulos/update][${traceId}] Fila antes de update:`, existing)
    const ownerId = existing.profesionalid || existing.profesional_id || null

    let isAdmin = false
    try {
      if (token.trim().startsWith('{')) {
        const parsed = JSON.parse(token)
        isAdmin = !!(parsed?.esAdmin || parsed?.isAdmin || parsed?.admin)
      } else if (token.includes('.') && token.split('.').length === 3) {
        let jwtPayload = token.split('.')[1]
        jwtPayload += '='.repeat((4 - jwtPayload.length % 4) % 4)
        const decoded = JSON.parse(Buffer.from(jwtPayload, 'base64').toString('utf8'))
        isAdmin = !!(decoded?.role === 'admin' || decoded?.admin || decoded?.esAdmin)
      }
    } catch (e) {
      console.warn(`[api/modulos/update][${traceId}] Error determinando admin:`, e)
    }
    console.log(`[api/modulos/update][${traceId}] isAdmin=${isAdmin} ownerId=${ownerId}`)

    if (!isAdmin && ownerId && String(ownerId) !== String(uid)) {
      console.warn(`[api/modulos/update][${traceId}] Forbidden: caller UID (${uid}) != owner (${ownerId})`)
      return NextResponse.json({ error: 'Forbidden', traceId }, { status: 403 })
    }

    const t2 = performance.now()
    const { data, error } = await srv.from('modulos').update(payload).eq('id', idStr).select()
    const t3 = performance.now()
    console.log(`[api/modulos/update][${traceId}] Update duration=${(t3-t2).toFixed(1)}ms`)
    if (error) {
      console.error(`[api/modulos/update][${traceId}] Supabase error:`, error)
      return NextResponse.json({ error: error.message, traceId }, { status: 500 })
    }
    console.log(`[api/modulos/update][${traceId}] Fila(s) actualizada(s):`, data)
    return NextResponse.json({ data, traceId })
  } catch (err: any) {
    console.error(`[api/modulos/update][${traceId}] Exception:`, err)
    return NextResponse.json({ error: err.message || 'Internal error', traceId }, { status: 500 })
  }
}
