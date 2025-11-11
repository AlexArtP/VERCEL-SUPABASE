const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

(async ()=>{
  const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
  const sql = postgres(DATABASE_URL, { max: 1 });
  try{
    console.log('Usando DATABASE_URL:', DATABASE_URL.startsWith('postgresql://') ? DATABASE_URL.replace(/:(.*?)@/, ':*****@') : DATABASE_URL);

    // Insertar usuarios necesarios en auth.users
    const u1 = '00000000-0000-0000-0000-000000000001';
    const u2 = '00000000-0000-0000-0000-000000000002';

    const insertUsers = `
      INSERT INTO auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES
        (gen_random_uuid(), '${u1}', 'authenticated', 'authenticated', 'ana@ejemplo.test', '{}'::jsonb, '{}'::jsonb, now(), now()),
        (gen_random_uuid(), '${u2}', 'authenticated', 'authenticated', 'carlos@ejemplo.test', '{}'::jsonb, '{}'::jsonb, now(), now())
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log('Insertando usuarios de ejemplo en auth.users...');
    await sql.unsafe(insertUsers);
    console.log('Usuarios insertados (o ya existentes).');

    // Ejecutar seed 002
    const seedFile = path.resolve(__dirname, '..', 'migrations', '002_seed.sql');
    const content = fs.readFileSync(seedFile, 'utf8');
    console.log('Ejecutando seed 002...');
    await sql.unsafe(content);
    console.log('Seed 002 aplicado correctamente.');

    await sql.end();
    process.exit(0);
  }catch(e){
    console.error('Error durante seed+retry:', e);
    try{ await sql.end(); }catch(_){ }
    process.exit(2);
  }
})();
