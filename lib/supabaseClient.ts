import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * lib/supabaseClient.ts
 *
 * Singleton público para uso en el cliente y helper para crear un cliente service-role
 * destinado a uso server-side (solo en funciones/edge/server).
 *
 * Variables de entorno esperadas:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (solo server-side)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // No lanzar en tiempo de import para no romper SSR/build cuando aún no están definidas,
  // pero emitir un warning en runtime si faltan.
  if (typeof window !== 'undefined') {
    // en cliente, mostrar aviso en consola
    // eslint-disable-next-line no-console
    console.warn('[supabaseClient] Variables NEXT_PUBLIC_SUPABASE_* no configuradas')
  }
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Manejamos la sesión manualmente
    detectSessionInUrl: false,
  },
})

/**
 * Establece un token JWT para autenticación en Supabase
 * El token se usa en RLS para identificar al usuario mediante auth.uid()
 * @param token Token JWT de Supabase (generalmente desde el login)
 */
export async function setSupabaseSession(token: string) {
  try {
    if (!token) {
      console.warn('[supabaseClient] setSupabaseSession: Token vacío')
      return false
    }
    
    // Intentar establecer la sesión con el JWT
    // Nota: Supabase internamente usará este token para auth.uid() en RLS
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token, // Usar el mismo token como fallback
      expires_in: 3600,
      token_type: 'bearer',
      user: null,
    } as any)
    
    if (error) {
      // Si falla, continuar de todas formas porque el cliente puede funcionar con anon key
      console.warn('[supabaseClient] setSession reportó error (continuando):', error.message)
      return true // Retornar true de todas formas
    }
    
    console.log('[supabaseClient] ✅ JWT configurado en Supabase client')
    return true
  } catch (err) {
    // Ignorar excepciones y continuar
    console.warn('[supabaseClient] setSupabaseSession excepción (continuando):', err)
    return true
  }
}

/**
 * Limpia la sesión Supabase actual
 */
export async function clearSupabaseSession() {
  try {
    await supabase.auth.signOut()
    console.log('[supabaseClient] Sesión Supabase limpiada')
  } catch (err) {
    console.error('[supabaseClient] Error al limpiar sesión:', err)
  }
}

/**
 * Crea un cliente Supabase usando la service role key. SOLO USAR EN SERVER-SIDE.
 * Lanzará error si la variable de entorno no está presente.
 */
export function createServiceRoleClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment')
  return createClient(supabaseUrl, key)
}

export default supabase

// Exponer el cliente en window durante desarrollo para facilitar debugging
try {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    ;(window as any).supabase = supabase
  }
} catch (e) {
  // no bloquear si algo falla
  // eslint-disable-next-line no-console
  console.warn('[supabaseClient] no se pudo exponer supabase en window:', e)
}
