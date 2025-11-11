import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Buscando usuario juan.perez en Auth...\n');

const { data: users } = await supabase.auth.admin.listUsers();
const juanUser = users.users.find(u => u.email === 'juan.perez@clinica.cl');

if (!juanUser) {
  console.error('❌ No se encontró juan.perez@clinica.cl en Auth');
  process.exit(1);
}

console.log(`✅ Encontrado: juan.perez@clinica.cl`);
console.log(`   ID: ${juanUser.id}\n`);

console.log('🔧 Insertando perfil de juan.perez...\n');

// Hacer INSERT directo sin constrainton de RUN
const { error: insertError } = await supabase
  .from('profiles')
  .insert({
    id: juanUser.id,
    email: 'juan.perez@clinica.cl',
    display_name: 'Juan Pérez',
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: '',
    run: '19876543-2',  // RUN diferente para evitar conflicto
    profesion: 'Administrativo',
    is_admin: false,
    estado: 'activo'
  });

if (insertError) {
  console.error('❌ Error insertando perfil:', insertError.message);
  console.error('   Intentando actualizar en lugar de insertar...\n');
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      display_name: 'Juan Pérez',
      nombre: 'Juan',
      apellido_paterno: 'Pérez',
      apellido_materno: '',
      run: '19876543-2',
      profesion: 'Administrativo',
      is_admin: false,
      estado: 'activo'
    })
    .eq('id', juanUser.id);

  if (updateError) {
    console.error('❌ Error actualizando perfil:', updateError.message);
  } else {
    console.log('✅ Perfil actualizado exitosamente');
  }
} else {
  console.log('✅ Perfil insertado exitosamente');
}

console.log('\n📋 Verificando perfiles finales...\n');

const { data: finalProfiles } = await supabase
  .from('profiles')
  .select('id, email, display_name, nombre, run, is_admin, estado')
  .in('email', ['juan.perez@clinica.cl', 'maria.santos@clinica.cl', 'admin@clinica.cl'])
  .order('email');

console.log(`✅ Total de perfiles de demo: ${finalProfiles?.length || 0}\n`);
finalProfiles?.forEach(p => {
  console.log(`📌 ${p.email}`);
  console.log(`   Nombre: ${p.display_name || p.nombre}`);
  console.log(`   RUN: ${p.run}`);
  console.log(`   Admin: ${p.is_admin ? '✅' : '❌'}`);
  console.log(`   Estado: ${p.estado}\n`);
});

console.log('✅ ¡Perfiles de demo completados!\n');
console.log('🎯 Credenciales de prueba para E2E:');
console.log('   juan.perez@clinica.cl / demo123');
console.log('   maria.santos@clinica.cl / demo123');
console.log('   admin@clinica.cl / admin123');
