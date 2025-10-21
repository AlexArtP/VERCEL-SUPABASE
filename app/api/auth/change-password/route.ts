import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Verificar que Firebase Admin está inicializado
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export async function POST(req: NextRequest) {
  try {
    const { userId, newPassword, confirmPassword } = await req.json();

    console.log('📍 [change-password] Iniciando cambio de contraseña para usuario:', userId);

    // Validaciones básicas
    if (!userId || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (userId, newPassword, confirmPassword)' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    // 🔐 Validaciones según requisitos del usuario: Mínimo 6 caracteres, 1 mayúscula, 1 número
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'La contraseña debe contener al menos 1 mayúscula' },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'La contraseña debe contener al menos 1 número' },
        { status: 400 }
      );
    }

    // ✅ Actualizar contraseña en Firebase Auth
    try {
      console.log('🔐 Actualizando contraseña en Firebase Auth para:', userId);
      await adminAuth.updateUser(userId, {
        password: newPassword,
      });
      console.log('✅ Contraseña actualizada en Firebase Auth');
    } catch (authError: any) {
      console.error('❌ Error actualizando contraseña en Auth:', authError.message);
      return NextResponse.json(
        { error: 'Error actualizando la contraseña. Por favor, intenta de nuevo.' },
        { status: 500 }
      );
    }

    // ✅ Actualizar flags en Firestore
    try {
      console.log('📝 Actualizando Firestore para usuario:', userId);
      const userDoc = await adminDb.collection('usuarios').doc(userId).get();
      
      if (!userDoc.exists) {
        console.warn('⚠️ Usuario no encontrado en Firestore:', userId);
        return NextResponse.json(
          { error: 'Usuario no encontrado en la base de datos' },
          { status: 404 }
        );
      }

      await adminDb.collection('usuarios').doc(userId).update({
        cambioPasswordRequerido: false, // 🔓 Limpiar flag de cambio requerido
        fechaCambioPassword: new Date().toISOString(),
        ultimoAcceso: new Date().toISOString(),
      });
      console.log('✅ Firestore actualizado correctamente');
    } catch (dbError: any) {
      console.error('❌ Error actualizando Firestore:', dbError.message);
      return NextResponse.json(
        { error: 'Error actualizando el perfil del usuario' },
        { status: 500 }
      );
    }

    console.log('✅ [change-password] Cambio completado exitosamente');
    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada correctamente',
      userId,
    });
  } catch (error: any) {
    console.error('❌ Error en change-password:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Error al cambiar la contraseña' },
      { status: 500 }
    );
  }
}
