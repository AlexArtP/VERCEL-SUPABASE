#!/usr/bin/env node

/**
 * Script de prueba E2E:
 * 1. Crear un módulo (scheduling module)
 * 2. Crear una cita (appointment) en ese módulo
 * 3. Verificar que se guardaron en BD
 * 
 * Uso: node scripts/test_e2e_flows.js
 */

const postgres = require('postgres');
const { v4: uuidv4 } = require('uuid');

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function runTests() {
  const sql = postgres(connectionString, { ssl: false });

  try {
    console.log('🚀 Iniciando pruebas E2E del flujo de calendario y citas\n');
    console.log('='.repeat(60) + '\n');

    // ============================================
    // TEST 1: Verificar usuario profesional
    // ============================================
    console.log('📋 TEST 1: Verificar Usuario Profesional');
    console.log('-'.repeat(60));

    const profesionalUID = 'aedd4150-27da-492a-8588-d8b1787a9f2a';
    
    const usuarioResult = await sql`
      SELECT userid, nombre, rol, profesional, email
      FROM usuarios
      WHERE userid = ${profesionalUID}
    `;

    if (usuarioResult.length === 0) {
      console.error('❌ ERROR: Usuario profesional no encontrado');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${usuarioResult[0].userid}`);
    console.log(`   Nombre: ${usuarioResult[0].nombre}`);
    console.log(`   Rol: ${usuarioResult[0].rol}`);
    console.log(`   Es Profesional: ${usuarioResult[0].profesional}`);
    console.log(`   Email: ${usuarioResult[0].email}\n`);

    // ============================================
    // TEST 2: Crear Módulo (Scheduling Module)
    // ============================================
    console.log('📋 TEST 2: Crear Módulo de Calendario');
    console.log('-'.repeat(60));

    const moduloID = uuidv4();
    const ahora = new Date();
    const proximoMes = new Date();
    proximoMes.setDate(proximoMes.getDate() + 30);

    const fechaModulo = ahora.toISOString().split('T')[0];
    const horaInicio = '09:00:00';
    const horaFin = '17:00:00';

    console.log(`📅 Creando módulo para el mes próximo (hasta ${proximoMes.toLocaleDateString()})`);

    const moduloResult = await sql`
      INSERT INTO modulos (
        moduloid,
        profesionalid,
        nombre,
        descripcion,
        fechacreacion,
        fecha,
        hora_inicio,
        hora_fin,
        tipo
      ) VALUES (
        ${moduloID},
        ${profesionalUID},
        'Módulo de Disponibilidad Noviembre',
        'Módulo automático para pruebas del calendario',
        ${ahora},
        ${fechaModulo},
        ${horaInicio},
        ${horaFin},
        'normal'
      )
      RETURNING moduloid, profesionalid, nombre, descripcion, fechacreacion, fecha, hora_inicio, hora_fin, tipo
    `;

    console.log('✅ Módulo creado exitosamente:');
    console.log(`   ID del Módulo: ${moduloResult[0].moduloid}`);
    console.log(`   Profesional: ${moduloResult[0].profesionalid}`);
    console.log(`   Nombre: ${moduloResult[0].nombre}`);
    console.log(`   Fecha: ${moduloResult[0].fecha}`);
    console.log(`   Hora: ${moduloResult[0].hora_inicio} - ${moduloResult[0].hora_fin}`);
    console.log(`   Descripción: ${moduloResult[0].descripcion}\n`);

    // ============================================
    // TEST 3: Crear Paciente (para la cita)
    // ============================================
    console.log('📋 TEST 3: Crear Paciente');
    console.log('-'.repeat(60));

    const pacienteID = uuidv4();
    const pacienteResult = await sql`
      INSERT INTO pacientes (
        pacienteid,
        nombre,
        apellido_paterno,
        apellido_materno,
        email,
        telefono,
        rut,
        fechacreacion
      ) VALUES (
        ${pacienteID},
        'Pedro',
        'Martinez',
        'Gonzalez',
        'pedro.martinez@email.com',
        '+56912345678',
        '19.123.456-K',
        ${ahora}
      )
      RETURNING pacienteid, nombre, apellido_paterno, email, rut
    `;

    console.log('✅ Paciente creado:');
    console.log(`   ID: ${pacienteResult[0].pacienteid}`);
    console.log(`   Nombre: ${pacienteResult[0].nombre} ${pacienteResult[0].apellidopaterno}`);
    console.log(`   Email: ${pacienteResult[0].email}`);
    console.log(`   RUT: ${pacienteResult[0].rut}\n`);

    // ============================================
    // TEST 4: Crear Cita en el Módulo
    // ============================================
    console.log('📋 TEST 4: Crear Cita (Appointment)');
    console.log('-'.repeat(60));

    const citaID = uuidv4();
    const fechaCita = new Date();
    fechaCita.setDate(fechaCita.getDate() + 5); // Cita para dentro de 5 días
    const fechaCitaStr = fechaCita.toISOString().split('T')[0];
    const horaCitaStr = '10:30:00';

    const citaResult = await sql`
      INSERT INTO citas (
        citaid,
        profesionalid,
        pacienteid,
        moduloid,
        fecha,
        hora_inicio,
        duracionminutos,
        estado,
        motivo,
        tipocita,
        observaciones
      ) VALUES (
        ${citaID},
        ${profesionalUID},
        ${pacienteID},
        ${moduloID},
        ${fechaCitaStr},
        ${horaCitaStr},
        ${30},
        'confirmada',
        'Consulta general',
        'presencial',
        'Prueba automática del sistema'
      )
      RETURNING citaid, profesionalid, pacienteid, moduloid, fecha, hora_inicio, duracionminutos, estado, motivo
    `;

    console.log('✅ Cita creada exitosamente:');
    console.log(`   ID de Cita: ${citaResult[0].citaid}`);
    console.log(`   Profesional: ${citaResult[0].profesionalid}`);
    console.log(`   Paciente: ${citaResult[0].pacienteid}`);
    console.log(`   Módulo: ${citaResult[0].moduloid}`);
    console.log(`   Fecha: ${citaResult[0].fecha}`);
    console.log(`   Hora: ${citaResult[0].hora_inicio}`);
    console.log(`   Duración: ${citaResult[0].duracionminutos} minutos`);
    console.log(`   Estado: ${citaResult[0].estado}`);
    console.log(`   Motivo: ${citaResult[0].motivo}\n`);

    // ============================================
    // TEST 5: Listar Módulos del Profesional
    // ============================================
    console.log('📋 TEST 5: Listar Módulos del Profesional');
    console.log('-'.repeat(60));

    const modulosDelProfesional = await sql`
      SELECT moduloid, nombre, fecha, hora_inicio, hora_fin, fechacreacion
      FROM modulos
      WHERE profesionalid = ${profesionalUID}
      ORDER BY fechacreacion DESC
      LIMIT 5
    `;

    console.log(`✅ Encontrados ${modulosDelProfesional.length} módulo(s):`);
    modulosDelProfesional.forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.nombre}`);
      console.log(`      ID: ${m.moduloid}`);
      console.log(`      Fecha: ${m.fecha} | Hora: ${m.hora_inicio}-${m.hora_fin}`);
    });
    console.log();

    // ============================================
    // TEST 6: Listar Citas del Profesional
    // ============================================
    console.log('📋 TEST 6: Listar Citas del Profesional');
    console.log('-'.repeat(60));

    const citasDelProfesional = await sql`
      SELECT 
        c.citaid, 
        c.fecha, 
        c.hora_inicio,
        c.estado,
        c.motivo,
        c.pacienteid
      FROM citas c
      WHERE c.profesionalid = ${profesionalUID}
      ORDER BY c.fecha DESC
      LIMIT 10
    `;

    console.log(`✅ Encontradas ${citasDelProfesional.length} cita(s):`);
    citasDelProfesional.forEach((c, idx) => {
      console.log(`   ${idx + 1}. Paciente: ${c.pacienteid} - ${c.fecha} ${c.hora_inicio}`);
      console.log(`      Estado: ${c.estado} | Motivo: ${c.motivo}`);
    });
    console.log();

    // ============================================
    // TEST 7: Consulta Integrada (Módulo + Citas)
    // ============================================
    console.log('📋 TEST 7: Vista Integrada (Módulo + Citas Asociadas)');
    console.log('-'.repeat(60));

    const moduloConCitas = await sql`
      SELECT 
        m.moduloid,
        m.nombre as modulo_nombre,
        m.fecha,
        m.hora_inicio,
        m.hora_fin,
        COUNT(c.citaid) as total_citas,
        COUNT(CASE WHEN c.estado = 'confirmada' THEN 1 END) as citas_confirmadas,
        COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as citas_canceladas
      FROM modulos m
      LEFT JOIN citas c ON m.moduloid = c.moduloid
      WHERE m.profesionalid = ${profesionalUID}
      GROUP BY m.moduloid, m.nombre, m.fecha, m.hora_inicio, m.hora_fin
      ORDER BY m.fechacreacion DESC
      LIMIT 5
    `;

    console.log(`✅ Módulos con estadísticas:`);
    moduloConCitas.forEach((m, idx) => {
      console.log(`   ${idx + 1}. ${m.modulo_nombre} (${m.estado})`);
      console.log(`      Total citas: ${m.total_citas}`);
      console.log(`      Confirmadas: ${m.citas_confirmadas} | Canceladas: ${m.citas_canceladas}`);
    });
    console.log();

    // ============================================
    // TEST 8: Actualizar Cita
    // ============================================
    console.log('📋 TEST 8: Actualizar Cita (cambiar estado)');
    console.log('-'.repeat(60));

    const citaActualizada = await sql`
      UPDATE citas
      SET estado = 'completada', observaciones = 'Cita completada exitosamente'
      WHERE citaid = ${citaID}
      RETURNING *
    `;

    console.log('✅ Cita actualizada:');
    console.log(`   ID: ${citaActualizada[0].citaid}`);
    console.log(`   Nuevo estado: ${citaActualizada[0].estado}`);
    console.log(`   Observaciones: ${citaActualizada[0].observaciones}\n`);

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('='.repeat(60));
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON CORRECTAMENTE!\n');
    
    console.log('📊 RESUMEN DE DATOS GUARDADOS EN BD:');
    console.log('   ✅ Módulo creado y guardado');
    console.log('   ✅ Paciente creado y guardado');
    console.log('   ✅ Cita creada y guardada');
    console.log('   ✅ Datos son consultables desde BD');
    console.log('   ✅ Actualizaciones funcionan correctamente\n');

    console.log('🚀 La aplicación está LISTA para:');
    console.log('   - Visualizar calendario con módulos');
    console.log('   - Crear citas en los módulos');
    console.log('   - Gestionar pacientes');
    console.log('   - Actualizar estado de citas\n');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LOS TESTS:\n');
    console.error(error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runTests();
