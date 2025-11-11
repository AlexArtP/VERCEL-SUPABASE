import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const demoUsers = [
  {
    email: 'juan.perez@clinica.cl',
    password: 'demo123',
    displayName: 'Juan Pérez',
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: '',
    run: '12345678-9',
    profesion: 'Administrativo',
    isAdmin: false,
    estado: 'activo'
  },
  {
    email: 'maria.santos@clinica.cl',
    password: 'demo123',
    displayName: 'María Santos',
    nombre: 'María',
    apellidoPaterno: 'Santos',
    apellidoMaterno: 'López',
    run: '87654321-0',
    profesion: 'Médico',
    isAdmin: false,
    estado: 'activo'
  },
  {
    email: 'admin@clinica.cl',
    password: 'admin123',
    displayName: 'Administrador',
    nombre: 'Admin',
    apellidoPaterno: 'Sistema',
    apellidoMaterno: '',
    run: '11111111-1',
    profesion: 'Administrador',
    isAdmin: true,
    estado: 'activo'
  }
];

console.log('🔍 Buscando usuarios en Auth...\n');

// Primero obtener la lista de usuarios de Auth
const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

if (usersError) {
  console.error('❌ Error listando usuarios:', usersError.message);
  process.exit(1);
}

console.log(`✅ Encontrados ${users.users.length} usuarios en Auth\n`);

// Mapear usuarios de demo con sus IDs de Auth
const userMap = {};
demoUsers.forEach(demo => {
  const authUser = users.users.find(u => u.email === demo.email);
  if (authUser) {
    userMap[demo.email] = { id: authUser.id, ...demo };
    console.log(`✅ ${demo.email} → ID: ${authUser.id}`);
  } else {
    console.log(`⚠️  ${demo.email} NOT FOUND en Auth`);
  }
});

console.log('\n🔧 Actualizando perfiles en tabla profiles...\n');

// Actualizar cada perfil
for (const [email, userData] of Object.entries(userMap)) {
  const { error: updateError } = await supabase
    .from('profiles')
    .upsert({
      id: userData.id,
      email: userData.email,
      display_name: userData.displayName,
      nombre: userData.nombre,
      apellido_paterno: userData.apellidoPaterno,
      apellido_materno: userData.apellidoMaterno,
      run: userData.run,
      profesion: userData.profesion,
      is_admin: userData.isAdmin,
      estado: userData.estado
    }, { onConflict: 'id' });

  if (updateError) {
    console.error(`❌ Error actualizando ${email}:`, updateError.message);
  } else {
    console.log(`✅ Perfil actualizado: ${email}`);
  }
}

console.log('\n📋 Verificando perfiles finales...\n');

const { data: finalProfiles, error: selectError } = await supabase
  .from('profiles')
  .select('id, email, display_name, nombre, apellido_paterno, is_admin, estado')
  .in('email', ['juan.perez@clinica.cl', 'maria.santos@clinica.cl', 'admin@clinica.cl']);

if (selectError) {
  console.error('❌ Error consultando perfiles finales:', selectError.message);
} else {
  console.log(`✅ Total de perfiles de demo: ${finalProfiles?.length || 0}\n`);
  finalProfiles?.forEach(p => {
    console.log(`📌 ${p.email}`);
    console.log(`   Nombre: ${p.display_name || p.nombre}`);
    console.log(`   Admin: ${p.is_admin ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   Estado: ${p.estado}`);
  });
}

console.log('\n🎉 ¡Proceso completado!\n');
console.log('📋 Credenciales para pruebas E2E:');
console.log('   Email: juan.perez@clinica.cl / Contraseña: demo123');
console.log('   Email: maria.santos@clinica.cl / Contraseña: demo123');
console.log('   Email: admin@clinica.cl / Contraseña: admin123');
