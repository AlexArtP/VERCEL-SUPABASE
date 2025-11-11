/**
 * ARCHIVO: lib/supabaseAdmin.ts
 * PROPÓSITO: Utilidades para operaciones administrativas con Supabase
 * 
 * Reemplaza firebaseAdmin.ts con Supabase Admin API
 * Permite operaciones de admin desde el servidor:
 * - Crear usuarios en Auth
 * - Resetear contraseñas
 * - Listar usuarios con permisos elevados
 * - Asignar roles
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Crea cliente Supabase con credenciales de servicio
 * Usa service_role key para operaciones administrativas
 */
export function createSupabaseAdminClient() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!projectUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key not configured')
  }

  return createClient(projectUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Crear usuario en Auth (equivalente a Firebase Admin createUser)
 */
export async function createAuthUser(email: string, password: string, displayName?: string) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        display_name: displayName || email.split('@')[0],
      },
    })

    if (error) throw error

    return {
      success: true,
      userId: data.user?.id,
      user: data.user,
    }
  } catch (error: any) {
    console.error('Error creating auth user:', error.message)
    throw error
  }
}

/**
 * Obtener usuario por email
 */
export async function getUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase.auth.admin.listUsers()

    if (error) throw error

    const user = data.users.find(u => u.email === email)
    return user || null
  } catch (error: any) {
    console.error('Error getting user by email:', error.message)
    throw error
  }
}

/**
 * Listar todos los usuarios (con permisos de admin)
 */
export async function listAllUsers(limit = 100, offset = 0) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      perPage: limit,
    })

    if (error) throw error

    return {
      users: data.users,
      total: data.users.length,
    }
  } catch (error: any) {
    console.error('Error listing users:', error.message)
    throw error
  }
}

/**
 * Resetear contraseña de usuario (envía email)
 */
export async function sendPasswordResetEmail(email: string) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
      },
    })

    if (error) throw error

    return {
      success: true,
      recoveryLink: data.properties?.action_link,
    }
  } catch (error: any) {
    console.error('Error sending password reset:', error.message)
    throw error
  }
}

/**
 * Actualizar metadata de usuario
 */
export async function updateUserMetadata(userId: string, metadata: Record<string, any>) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
    }
  } catch (error: any) {
    console.error('Error updating user metadata:', error.message)
    throw error
  }
}

/**
 * Eliminar usuario
 */
export async function deleteUser(userId: string) {
  const supabase = createSupabaseAdminClient()

  try {
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) throw error

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error deleting user:', error.message)
    throw error
  }
}

/**
 * Obtener perfil desde base de datos profiles
 */
export async function getUserProfile(userId: string) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found

    return data || null
  } catch (error: any) {
    console.error('Error getting user profile:', error.message)
    throw error
  }
}

/**
 * Actualizar perfil en base de datos
 */
export async function updateUserProfile(userId: string, profile: Record<string, any>) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      profile: data,
    }
  } catch (error: any) {
    console.error('Error updating user profile:', error.message)
    throw error
  }
}

/**
 * Crear perfil en base de datos
 */
export async function createUserProfile(userId: string, profile: Record<string, any>) {
  const supabase = createSupabaseAdminClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profile,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      profile: data,
    }
  } catch (error: any) {
    console.error('Error creating user profile:', error.message)
    throw error
  }
}
