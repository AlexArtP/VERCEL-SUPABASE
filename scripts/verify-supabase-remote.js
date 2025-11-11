#!/usr/bin/env node

/**
 * Script: Verificar conexión a Supabase Remoto
 * Comprueba que tu configuración es correcta antes de Vercel Deploy
 */

const https = require('https');

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://spbkmtvpvfdhnofqkndb.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OeSg1lhBdAMnrgx8AI5TGQ_Aum0ciRH',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};

console.log('🔍 Verificando conexión a Supabase Remoto...\n');
console.log('📌 Configuración detectada:');
console.log(`   URL: ${config.supabaseUrl}`);
console.log(`   Anon Key: ${config.anonKey.substring(0, 20)}...`);
console.log(`   Service Role Key: ${config.serviceRoleKey ? 'Configurada ✅' : 'No configurada ❌'}\n`);

// Función para hacer request a Supabase
function checkSupabaseConnection() {
  return new Promise((resolve) => {
    const url = new URL(`${config.supabaseUrl}/rest/v1/usuarios?select=count`);

    const options = {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('🌐 Conectando a Supabase...');

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 206) {
          console.log('✅ Conexión exitosa a Supabase Remoto!');
          console.log(`   Status Code: ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 100)}...\n`);
          resolve(true);
        } else {
          console.log(`❌ Error en la conexión: ${res.statusCode}`);
          console.log(`   Response: ${data}\n`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ Error de conexión: ${err.message}\n`);
      resolve(false);
    });
  });
}

async function main() {
  const isConnected = await checkSupabaseConnection();

  console.log('📋 Checklist Vercel Deploy:\n');
  console.log(`   [${config.supabaseUrl ? '✅' : '❌'}] URL de Supabase configurada`);
  console.log(`   [${config.anonKey ? '✅' : '❌'}] Anon Key configurada`);
  console.log(`   [${config.serviceRoleKey ? '✅' : '❌'}] Service Role Key configurada`);
  console.log(`   [${isConnected ? '✅' : '❌'}] Conexión a Supabase funcionando\n`);

  if (isConnected && config.serviceRoleKey) {
    console.log('🚀 ¡Listo para deploy a Vercel!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Falta configurar algo. Revisa los puntos ❌\n');
    process.exit(1);
  }
}

main();
