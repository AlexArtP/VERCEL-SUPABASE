const { createClient } = require('@supabase/supabase-js')

;(async ()=>{
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_anon_key'
  const supabase = createClient(supabaseUrl, anonKey)

  try{
    console.log('Attempting signInWithPassword for ana@ejemplo.test (should fail because no password set)')
    const res = await supabase.auth.signInWithPassword({ email: 'ana@ejemplo.test', password: 'wrongpass' })
    console.log('signIn result:', JSON.stringify(res.error || res.data || res, null, 2))
  }catch(e){
    console.error('Error during signIn:', e)
  }

  try{
    console.log('Attempting admin.updateUserById with missing service role (should throw)')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.log('No SUPABASE_SERVICE_ROLE_KEY set — skipping admin update (expected).')
    } else {
      const admin = createClient(supabaseUrl, serviceKey)
      // @ts-ignore
      const { data, error } = await admin.auth.admin.updateUserById('00000000-0000-0000-0000-000000000001', { password: 'newpassword123' })
      console.log('admin update result:', { data, error })
    }
  }catch(e){
    console.error('Error during admin update:', e)
  }

  process.exit(0)
})()
