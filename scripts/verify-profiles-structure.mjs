import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Verificando estructura de tabla profiles...\n');

// Consultar información de la tabla
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Error consultando profiles:', error.message);
  console.error('   Detalles:', error.details);
  process.exit(1);
}

console.log('✅ Tabla profiles accesible');
console.log('📋 Estructura de datos de profiles:');
if (data && data.length > 0) {
  const columns = Object.keys(data[0]);
  columns.forEach(col => {
    console.log(`   - ${col}: ${typeof data[0][col]}`);
  });
} else {
  console.log('   (No hay datos en la tabla)');
}

// Intentar insertar un perfil de demo completo
console.log('\n🔧 Intentando insertar perfil de demo completo...\n');

const { error: insertError } = await supabase
  .from('profiles')
  .upsert({
    id: 'aedd4150-27da-492a-8588-d8b1787a9f2a',
    email: 'juan.perez@clinica.cl',
    nombre: 'Juan',
    apellidos: 'Pérez',
    rol: 'administrativo',
    activo: true
  }, { onConflict: 'id' });

if (insertError) {
  console.error('❌ Error insertando perfil:', insertError.message);
  console.error('   Detalles:', insertError.details);
} else {
  console.log('✅ Perfil inserción intentada exitosamente');
}

// Consultar los perfiles creados
console.log('\n📋 Consultando perfiles actuales...\n');

const { data: profiles, error: selectError } = await supabase
  .from('profiles')
  .select('*')
  .order('email');

if (selectError) {
  console.error('❌ Error consultando perfiles:', selectError.message);
} else {
  console.log(`✅ Total de perfiles: ${profiles?.length || 0}`);
  profiles?.forEach(p => {
    console.log(`   - ${p.email}: activo=${p.activo}, rol=${p.rol}`);
  });
}
