import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Listando todos los perfiles actuales...\n');

const { data: allProfiles, error: selectError } = await supabase
  .from('profiles')
  .select('id, email, run, is_admin, estado');

if (selectError) {
  console.error('❌ Error consultando perfiles:', selectError.message);
} else {
  console.log(`✅ Total de perfiles: ${allProfiles?.length || 0}\n`);
  allProfiles?.forEach(p => {
    console.log(`   ${p.email} - RUN: ${p.run || '(vacío)'} - Admin: ${p.is_admin}`);
  });
}

// Buscar y eliminar duplicados de RUN
console.log('\n🔧 Buscando RUNs duplicados...\n');

const runCounts = {};
allProfiles?.forEach(p => {
  if (p.run) {
    runCounts[p.run] = (runCounts[p.run] || 0) + 1;
  }
});

const duplicateRuns = Object.entries(runCounts)
  .filter(([run, count]) => count > 1)
  .map(([run]) => run);

if (duplicateRuns.length > 0) {
  console.log(`⚠️  RUNs duplicados encontrados: ${duplicateRuns.join(', ')}\n`);
  
  // Para juan.perez, usar un RUN único
  console.log('🔧 Actualizando juan.perez con RUN único...\n');
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ run: '12345678-9-DEMO' })
    .eq('email', 'juan.perez@clinica.cl');

  if (updateError) {
    console.error(`❌ Error actualizando RUN:`, updateError.message);
  } else {
    console.log(`✅ RUN actualizado a 12345678-9-DEMO para juan.perez`);
  }
} else {
  console.log('✅ No hay RUNs duplicados\n');
}

console.log('\n📋 Verificando perfiles finales después de correcciones...\n');

const { data: finalProfiles } = await supabase
  .from('profiles')
  .select('id, email, display_name, nombre, apellido_paterno, run, is_admin, estado')
  .in('email', ['juan.perez@clinica.cl', 'maria.santos@clinica.cl', 'admin@clinica.cl']);

finalProfiles?.forEach(p => {
  console.log(`📌 ${p.email}`);
  console.log(`   Nombre: ${p.display_name || p.nombre}`);
  console.log(`   RUN: ${p.run}`);
  console.log(`   Admin: ${p.is_admin ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   Estado: ${p.estado}`);
});

console.log('\n🎉 ¡Perfiles de demo listos!\n');
