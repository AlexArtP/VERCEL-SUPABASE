import { NextRequest, NextResponse } from 'next/server'
// For server-side operations that require access to secure env vars and
// Node-only libs, force the Node runtime for this route handler.
export const runtime = 'nodejs'
import { createServiceRoleClient } from '@/lib/supabaseClient'

/**
 * POST /api/modulos/batch
 * Body: { modulos: Array<object> }
 *
 * Inserta un lote de módulos usando la service role key (server-side).
 * REQUISITO: la variable de entorno SUPABASE_SERVICE_ROLE_KEY debe estar configurada.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const list = body?.modulos
    if (!Array.isArray(list) || list.length === 0) {
      return NextResponse.json({ error: 'No hay módulos para crear' }, { status: 400 })
    }

    // DEBUG: comprobar que la service role key está presente
    try {
      console.log('[api/modulos/batch] SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      console.log('[api/modulos/batch] NEXT_PUBLIC_SUPABASE_URL length:', String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').length)
    } catch (dbg) {
      // noop
    }

    // AUTENTICACIÓN (sin Firebase): aceptar Authorization o cookie local como identidad
    // - Authorization: Bearer <JSON|UUID|base64(JSON)|urlencoded(JSON)>
    // - Cookie: sistema_auth_token (JSON con id/userId)
    console.log('[api/modulos/batch] 🔍 INICIO AUTENTICACIÓN')
    
    const authHeader = req.headers.get('authorization') || ''
    console.log('[api/modulos/batch] Authorization header presente:', !!authHeader)
    if (authHeader) {
      console.log('[api/modulos/batch] Authorization length:', authHeader.length, 'preview:', authHeader.slice(0, 50))
    }
    
    let token = authHeader.replace(/^Bearer\s+/i, '').trim()
    console.log('[api/modulos/batch] Token después de retirar Bearer:', { length: token.length, starts: token[0] })

    // Si no llega Authorization, intentar por cookie del cliente
    if (!token) {
      const cookie = req.cookies.get('sistema_auth_token')?.value
      console.log('[api/modulos/batch] Cookie sistema_auth_token presente:', !!cookie)
      if (cookie) {
        token = cookie
        console.log('[api/modulos/batch] Usando token desde cookie:', { length: token.length })
      }
    }

    if (!token) {
      console.error('[api/modulos/batch] ❌ Sin token de autenticación')
      return NextResponse.json({ error: 'Token de autenticación requerido' }, { status: 401 })
    }

    // Resolver UID a partir del token recibido (sin verificación externa)
    let uid: string | null = null
    const t = token.trim()
    console.log('[api/modulos/batch] 🔎 Intentando extraer UID de token. Formato:', {
      startsWithCurly: t.startsWith('{'),
      startsWithUrlEncoded: t.startsWith('%7B') || t.startsWith('%7b'),
      startsWithB64: /^[A-Za-z0-9+/=]+$/.test(t),
      length: t.length,
      preview: t.slice(0, 20)
    })

    // A) JSON plano
    if (!uid && t.startsWith('{')) {
      try {
        console.log('[api/modulos/batch] 📋 Intentando JSON.parse() en token')
        const maybe = JSON.parse(t)
        uid = maybe?.userId || maybe?.id || null
        console.log('[api/modulos/batch] ✅ JSON parseado. UID extraído:', uid)
      } catch (e) {
        console.warn('[api/modulos/batch] ❌ JSON.parse fallback failed:', (e as Error).message)
      }
    }

    // B) JSON URL-encoded
    if (!uid && (t.startsWith('%7B') || t.startsWith('%7b'))) {
      try {
        console.log('[api/modulos/batch] 🔗 Intentando decodeURIComponent + JSON.parse')
        const decoded = decodeURIComponent(t)
        console.log('[api/modulos/batch] Decoded:', decoded.slice(0, 50))
        const maybe = JSON.parse(decoded)
        uid = maybe?.userId || maybe?.id || null
        console.log('[api/modulos/batch] ✅ URL-decoded JSON parseado. UID extraído:', uid)
      } catch (e) {
        console.warn('[api/modulos/batch] ❌ URL-decoded JSON fallback failed:', (e as Error).message)
      }
    }

    // C) JSON base64
    if (!uid && /^[A-Za-z0-9+/=]+$/.test(t) && t.length % 4 === 0) {
      try {
        console.log('[api/modulos/batch] 📦 Intentando base64 decode + JSON.parse')
        const b = Buffer.from(t, 'base64').toString('utf8')
        console.log('[api/modulos/batch] Base64 decoded:', b.slice(0, 50))
        if (b && b.trim().startsWith('{')) {
          const maybe = JSON.parse(b)
          uid = maybe?.userId || maybe?.id || null
          console.log('[api/modulos/batch] ✅ Base64 JSON parseado. UID extraído:', uid)
        }
      } catch (e) {
        console.warn('[api/modulos/batch] ❌ Base64 JSON failed:', (e as Error).message)
      }
    }

    // D) UUID directo
    if (!uid) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(t)) {
        uid = t
        console.log('[api/modulos/batch] ✅ Token es UUID válido:', uid)
      } else {
        console.warn('[api/modulos/batch] ❌ Token no coincide con UUID regex')
      }
    }

    // E) JWT (Supabase format): "header.payload.signature"
    // Intentar extraer el "sub" claim del payload
    if (!uid && t.includes('.') && t.split('.').length === 3) {
      try {
        console.log('[api/modulos/batch] 🔑 Intentando JWT decode (Supabase)')
        const parts = t.split('.')
        // Decodificar el payload (segundo segmento)
        let payload = parts[1]
        // Añadir padding si es necesario (base64)
        payload += '='.repeat((4 - payload.length % 4) % 4)
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
        uid = decoded?.sub || decoded?.userId || decoded?.id || null
        if (uid) {
          console.log('[api/modulos/batch] ✅ JWT decodificado. UID extraído del claim "sub":', uid)
        } else {
          console.warn('[api/modulos/batch] ❌ JWT decodificado pero sin claim "sub/userId/id"')
        }
      } catch (e) {
        console.warn('[api/modulos/batch] ❌ JWT decode failed:', (e as Error).message)
      }
    }

    if (!uid) {
      const preview = t.slice(0, 20)
      console.error('[api/modulos/batch] ❌ No se pudo extraer UID. token summary:', { length: t.length, startsWith: t[0], preview, full: t })
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    console.log('[api/modulos/batch] ✅ AUTENTICACIÓN EXITOSA. UID:', uid)

    if (!uid) {
      return NextResponse.json({ error: 'UID no determinado a partir del token' }, { status: 401 })
    }

    // Asegurarse que los módulos a insertar pertenezcan al UID (o reemplazar)
    const normalized = (list as any[]).map((m) => ({
      ...m,
      profesionalid: m.profesionalid || m.profesional_id || uid,
      profesional_id: m.profesional_id || m.profesionalid || uid,
    }))

    console.log('[api/modulos/batch] 📝 Datos NORMALIZADOS para insertar:')
    console.log('  - Cantidad:', normalized.length)
    console.log('  - Primer item keys:', Object.keys(normalized[0] || {}))
    console.log('  - Primer item:', JSON.stringify(normalized[0], null, 2).slice(0, 200))
    console.log('  - Todos los items:', JSON.stringify(normalized.slice(0, 2), null, 2).slice(0, 500))

    const srv = createServiceRoleClient()
    console.log('[api/modulos/batch] 🔌 Conectando a tabla "modulos" con service role...')
    const { data, error } = await srv.from('modulos').insert(normalized).select()
    
    console.log('[api/modulos/batch] 📊 Resultado del INSERT:')
    console.log('  - error:', error ? 'SÍ' : 'NO')
    console.log('  - data rows inserted:', data?.length ?? 0)
    if (data && data.length > 0) {
      console.log('  - Primer fila insertada keys:', Object.keys(data[0]))
      console.log('  - Primer fila:', JSON.stringify(data[0], null, 2).slice(0, 300))
    }
    
    if (error) {
      // Loguear el objeto de error completo para inspección (no incluir secretos)
      console.error('API /modulos/batch supabase error (full):', JSON.stringify(error, Object.getOwnPropertyNames(error)))
      // incluir fields relevantes si existen
      const errMsg = (error && (error as any).message) ? (error as any).message : 'Error al insertar módulos'
      return NextResponse.json({ error: errMsg, details: error }, { status: 500 })
    }
    
    // 🔗 Ahora, actualizar/crear entradas en modulo_definitions para cada tipo único con color
    console.log('[api/modulos/batch] 🔗 Actualizando modulo_definitions con colores...')
    const tiposUnicos = new Map<string, { color: string; tipo: string; nombre?: string }>()
    
    for (const m of normalized) {
      if (m.tipo && m.color && !tiposUnicos.has(m.tipo)) {
        tiposUnicos.set(m.tipo, { color: m.color, tipo: m.tipo, nombre: m.nombre || m.tipo })
      }
    }
    
    console.log(`[api/modulos/batch] Tipos únicos a registrar en modulo_definitions:`, Array.from(tiposUnicos.keys()))
    
    for (const [tipoKey, tipoData] of tiposUnicos) {
      try {
        // Buscar si ya existe una definición con este tipo
        const { data: existing, error: checkErr } = await srv
          .from('modulo_definitions')
          .select('id')
          .eq('tipo', tipoData.tipo)
          .eq('profesionalId', uid)
          .limit(1)
        
        if (!checkErr && existing && existing.length > 0) {
          // Ya existe, actualizar el color
          console.log(`[api/modulos/batch] Actualizando modulo_definitions para tipo="${tipoData.tipo}"`)
          await srv
            .from('modulo_definitions')
            .update({ color: tipoData.color })
            .eq('tipo', tipoData.tipo)
            .eq('profesionalId', uid)
        } else {
          // No existe, crear nueva
          console.log(`[api/modulos/batch] Creando nueva entrada en modulo_definitions para tipo="${tipoData.tipo}"`)
          await srv.from('modulo_definitions').insert({
            tipo: tipoData.tipo,
            nombre: tipoData.nombre,
            color: tipoData.color,
            profesionalId: uid,
            duracion: 60, // default
          })
        }
      } catch (defErr) {
        console.warn(`[api/modulos/batch] Advertencia al actualizar modulo_definitions para tipo="${tipoKey}":`, defErr)
      }
    }
    
    console.log('[api/modulos/batch] ✅ INSERT exitoso - devolviendo datos:', data?.length, 'filas')
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('API /modulos/batch exception:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}
