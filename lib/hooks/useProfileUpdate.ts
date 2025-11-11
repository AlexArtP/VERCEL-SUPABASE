import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase, { createServiceRoleClient } from '@/lib/supabaseClient'
import { Profesional } from '@/types'

interface UpdatePayload extends Partial<Profesional> {
  id: string
}

interface MutationContext {
  previous?: Profesional[]
}

/**
 * useProfileUpdate
 * - intenta actualizar en Supabase si las variables están configuradas (cliente anon + RLS)
 * - si no está configurado, cae a /api/profile (demo)
 * - maneja actualización optimista en query cache para 'profesionales'
 */
export function useProfileUpdate() {
  const qc = useQueryClient()

  return useMutation<Profesional, Error, UpdatePayload, MutationContext>({
    mutationFn: async (payload: UpdatePayload) => {
      // Si tenemos supabase configurado, intentar actualizar en la tabla 'profesionales'
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          // Usar cliente anon para la actualización; asume que RLS permite al usuario modificar su perfil
          const { data, error } = await supabase.from('profesionales').update(payload).eq('id', payload.id).select().single()
          if (error) throw error
          return data
        }
      } catch (e) {
        console.warn('useProfileUpdate: supabase update failed, falling back to API', e)
      }

      // Fallback a API interna
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('API error')
      return res.json()
    },
    onMutate: async (variables: UpdatePayload) => {
      await qc.cancelQueries({ queryKey: ['profesionales'] })
      const previous = qc.getQueryData<Profesional[]>(['profesionales'])
      if (previous) {
        qc.setQueryData<Profesional[]>(
          ['profesionales'],
          previous.map(p => p.id === variables.id ? { ...p, ...variables } : p)
        )
      }
      return { previous }
    },
    onError: (err: Error, vars: UpdatePayload, context?: MutationContext) => {
      if (context?.previous) qc.setQueryData(['profesionales'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['profesionales'] })
    }
  })
}

export default useProfileUpdate
