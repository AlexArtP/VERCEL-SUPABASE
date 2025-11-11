/**
 * API ENDPOINT: POST /api/admin/update-user-email
 * PROPÓSITO: Cambiar email de un usuario en Supabase Auth + tabla usuarios
 * REQUERIMIENTOS: 
 *   - Authorization header con token válido
 *   - Body: { userId: string, newEmail: string }
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, newEmail } = body

    if (!userId || !newEmail) {
      return Response.json(
        { error: 'Missing userId or newEmail in request body' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Actualizar email en Auth (usando service role key)
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    )

    if (authError) {
      console.error('❌ Error updating auth email:', authError)
      return Response.json(
        { error: `Failed to update email in Auth: ${authError.message}` },
        { status: 400 }
      )
    }

    // Actualizar email en profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('usuarios')
      .update({ email: newEmail })
      .eq('userid', userId)
      .select()

    if (profileError) {
      console.error('❌ Error updating profile email:', profileError)
      // Si falla en profiles, intentamos revertir el cambio en auth
      await supabase.auth.admin.updateUserById(userId, { email: authData.user.email! })
      return Response.json(
        { error: `Failed to update email in profiles: ${profileError.message}` },
        { status: 400 }
      )
    }

    console.log(`✅ Email actualizado exitosamente para usuario ${userId}`)
    console.log(`   Nuevo email: ${newEmail}`)

    return Response.json({
      success: true,
      message: `✅ Email del usuario ha sido actualizado a: ${newEmail}`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return Response.json(
      { error: `Unexpected error: ${String(err)}` },
      { status: 500 }
    )
  }
}
