const postgres = require('postgres');

async function run() {
  const defaultLocal = 'postgresql://postgres:postgres@localhost:54322/postgres';
  const DATABASE_URL = process.env.DATABASE_URL || defaultLocal;
  console.log('Usando DATABASE_URL:', DATABASE_URL.startsWith('postgresql://') ? DATABASE_URL.replace(/:(.*?)@/, ':*****@') : DATABASE_URL);
  const sql = postgres(DATABASE_URL, { max: 1 });
  try {
    const solicitud = {
      nombre: 'PruebaDirecta',
      apellido_paterno: 'Uno',
      apellido_materno: 'Dos',
      run: '12345678-5',
      profesion: 'Medico',
      sobre_ti: 'N/A',
      cargo_actual: 'N/A',
      email: 'direct.insert@example.com',
      telefono: '+56900000001',
      password: 'Password123',
      estado: 'pendiente',
      es_admin: false,
      fecha_solicitud: new Date().toISOString(),
      fecha_aprobacion: null,
      aprobado_por: null,
    };

    const res = await sql`
      insert into public.solicitudes (
        nombre, apellido_paterno, apellido_materno, run, profesion,
        sobre_ti, cargo_actual, email, telefono, password,
        estado, es_admin, fecha_solicitud, fecha_aprobacion, aprobado_por
      ) values (
        ${solicitud.nombre}, ${solicitud.apellido_paterno}, ${solicitud.apellido_materno}, ${solicitud.run}, ${solicitud.profesion},
        ${solicitud.sobre_ti}, ${solicitud.cargo_actual}, ${solicitud.email}, ${solicitud.telefono}, ${solicitud.password},
        ${solicitud.estado}, ${solicitud.es_admin}, ${solicitud.fecha_solicitud}, ${solicitud.fecha_aprobacion}, ${solicitud.aprobado_por}
      ) returning id`;
    console.log('Insert result:', res);
  } catch (err) {
    console.error('Error inserting solicitud:', err.message || err);
  } finally {
    await sql.end();
  }
}

// helper to build column list (postgres lib doesn't accept array for dynamic columns in template directly)
// helpers removed: not needed for simple insert

run();
