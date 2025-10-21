/**
 * ARCHIVO: app/api/admin/init-demo-admin/route.ts
 * PROPÓSITO: Endpoint para crear usuario demo admin en Firestore
 * 
 * Este endpoint devuelve un script que el cliente ejecuta para crear el documento.
 * Usa las reglas de Firestore que permiten crear usuarios sin restricción.
 * 
 * POST /api/admin/init-demo-admin
 * Responde con instrucciones o ejecuta directamente desde el servidor
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Datos del usuario demo administrador
    const demoAdmin = {
      id: 'demo-admin-juan',
      nombre: 'Dr. Juan',
      apellidos: 'Pérez González',
      email: 'juan.perez@clinica.cl',
      run: '12.345.678-9',
      profesion: 'Médico General',
      telefono: '+56 9 1234 5678',
      cargo:
        'Director Médico del Departamento de Medicina Interna. Responsable de la coordinación de equipos médicos y supervisión de protocolos clínicos.',
      description:
        'Profesional con amplia experiencia en medicina interna, gestión de equipos y supervisión clínica. Intereses en docencia y mejora continua.',
      avatar: '',
      specialties: ['Medicina Interna', 'Urgencias'],
      workingHours: { start: '08:30', end: '17:30' },
      preferences: { theme: 'light', primaryColor: '#3B82F6', language: 'es' },
      isPublic: true,
      rol: 'profesional',
      esAdmin: true,
      activo: true,
      password: 'demo123',
      fechaRegistro: new Date().toISOString(),
    }

    // Retornar los datos para que se ejecuten desde el cliente
    // O proporcionar un script que el cliente puede copiar-pegar
    return NextResponse.json(
      {
        success: true,
        message: '✅ Datos del usuario demo admin listos. Ejecuta el script en la consola del navegador.',
        uid: 'demo-admin-juan',
        email: demoAdmin.email,
        esAdmin: demoAdmin.esAdmin,
        nombre: demoAdmin.nombre,
        data: demoAdmin,
        script: `
// Ejecuta esto en la consola del navegador para crear el usuario demo admin
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

const demoAdmin = ${JSON.stringify(demoAdmin)};
await setDoc(doc(db, 'usuarios', 'demo-admin-juan'), demoAdmin);
console.log('✅ Usuario demo admin creado');
        `,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error',
      },
      { status: 500 }
    )
  }
}
