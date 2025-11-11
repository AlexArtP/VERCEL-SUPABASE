# CLIENT HOOKS (React Query + supabase-js)

Este archivo contiene ejemplos completos y listos para copiar de los hooks cliente que usará la app con Supabase.

1) `lib/supabaseClient.ts`
--------------------------------
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function getServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing service role key')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}
```

2) `useCalendarioMes`
--------------------------------
```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

function monthRangeFromYYYYMM(yyyyMM: string): [string, string] {
  const [y, m] = [parseInt(yyyyMM.slice(0,4)), parseInt(yyyyMM.slice(4))]
  const first = new Date(y, m-1, 1).toISOString().split('T')[0]
  const last = new Date(y, m, 0).toISOString().split('T')[0]
  return [first, last]
}

export function useCalendarioMes(profId: string, yearMonth: string) {
  const [firstDay, lastDay] = monthRangeFromYYYYMM(yearMonth)
  return useQuery(['calendario', profId, yearMonth], async () => {
    const { data, error } = await supabase
      .from('calendario_dia')
      .select('fecha, citas, modulos')
      .eq('profesional_id', profId)
      .gte('fecha', firstDay)
      .lte('fecha', lastDay)
    if (error) throw error
    return data || []
  }, { staleTime: 1000 * 60 * 5 })
}
```

3) `useMoverCita` (optimistic)
--------------------------------
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useMoverCita() {
  const qc = useQueryClient()
  return useMutation(async ({ id, newDate, newHoraInicio, newHoraFin }: { id: string; newDate: string; newHoraInicio: string; newHoraFin: string }) => {
    const { error } = await supabase.from('citas').update({ fecha: newDate, hora_inicio: newHoraInicio, hora_fin: newHoraFin }).eq('id', id)
    if (error) throw error
    return true
  }, {
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: ['calendario'] })
      const previous = qc.getQueryData(['calendario', variables.id])
      // Aquí se aplicaría el cambio optimista en la cache apropiada
      return { previous }
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(['calendario'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['calendario'] })
    }
  })
}
```

4) `useAddPaciente`
--------------------------------
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useAddPaciente() {
  const qc = useQueryClient()
  return useMutation(async (payload: any) => {
    const { data, error } = await supabase.from('pacientes').insert(payload).select().single()
    if (error) throw error
    return data
  }, {
    onSuccess: () => {
      qc.invalidateQueries(['pacientes'])
    }
  })
}
```

5) `useProfileUpdate` (incluye cambiar contraseña)
--------------------------------
```ts
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export function useProfileUpdate() {
  return useMutation(async ({ profileUpdates, currentPassword, newPassword }: any) => {
    // Primero verificar contraseña actual usando endpoint server (service role) o usar Supabase Auth verify
    if (newPassword) {
      // Llamar un endpoint serverless que reciba currentPassword y newPassword y que use service role para cambiar
      const res = await fetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })
      if (!res.ok) throw new Error('No se pudo cambiar la contraseña')
    }

    const { error } = await supabase.from('profesionales').update(profileUpdates).eq('id', profileUpdates.id)
    if (error) throw error
    return true
  })
}
```

Notas
-----
- Los endpoints que requieren `SUPABASE_SERVICE_ROLE_KEY` deben implementarse en `supabase/functions` o en `pages/api` y usar `getServiceRoleClient()`.
- Ajusta las claves de query/invalidate según estructura de tu app.
