# SUPABASE EDGE FUNCTIONS — Plantillas y despliegue

Este documento contiene plantillas TypeScript para Edge Functions (Supabase Functions) usadas por la app: auditoría diaria, webhook administrativo y un endpoint de administración protegido.

Requisitos
----------
- Deno + supabase CLI para desplegar funciones.
- Variables de entorno en el entorno de funciones:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY

1) daily-audit (plantilla completa)
----------------------------------
// supabase/functions/daily-audit/index.ts
import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  // obtener lista de profesionales
  const { data: profs, error: profErr } = await supabase.from('profesionales').select('id')
  if (profErr) return new Response(JSON.stringify({ error: profErr.message }), { status: 500 })

  for (const p of profs || []) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    const fecha = yesterday.toISOString().split('T')[0]

    const { data: citas } = await supabase.from('citas').select('*').eq('profesional_id', p.id).eq('fecha', fecha)
    const { data: view } = await supabase.from('calendario_dia').select('citas').eq('profesional_id', p.id).eq('fecha', fecha)

    const citaIds = new Set((citas || []).map(c => c.id))
    const viewIds = view && view[0] && view[0].citas ? Object.keys(view[0].citas) : []

    // detectar missing/extra
    const missing = [...citaIds].filter(id => !viewIds.includes(id))
    const extra = viewIds.filter(id => !citaIds.has(id))

    if (missing.length || extra.length) {
      await supabase.from('audit_logs').insert({ profesional_id: p.id, fecha, issue_type: 'drift', details: { missing, extra } })
    }
  }

  return new Response(JSON.stringify({ ok: true }))
})

Despliegue
----------
1. Instalar supabase CLI y autenticar.
2. Definir variables de entorno en el dashboard o `supabase functions env`:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
3. Deploy:
   supabase functions deploy daily-audit --no-verify

2) admin-webhook (opcional)
----------------------------------
// supabase/functions/admin-webhook/index.ts
import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Validar token propio (header Authorization)
  const auth = req.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 })

  // Procesar payload
  const body = await req.json()
  // Ejemplo: forzar backfill
  if (body.action === 'backfill') {
    const { error } = await supabase.rpc('backfill_calendario_dia')
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ ok: true }))
  }

  return new Response(JSON.stringify({ ok: false, message: 'no action' }))
})

Seguridad
---------
- Protege estos endpoints con la `SUPABASE_SERVICE_ROLE_KEY` y no expongas la key en el cliente.
