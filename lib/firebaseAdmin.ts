/**
 * ARCHIVO: lib/firebaseAdmin.ts
 * PROPÓSITO: Inicializar Firebase Admin SDK para operaciones server-side seguras
 * 
 * Esto permite:
 * - Crear usuarios en Firebase Auth de forma segura desde el servidor
 * - Asignar roles y claims personalizados
 * - Operaciones administrativas en Firestore
 * 
 * NOTA: Requiere variables de entorno FIREBASE_SERVICE_ACCOUNT_KEY (JSON stringified)
 * o individual fields: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL
 */

import admin from 'firebase-admin'

export function initializeFirebaseAdmin() {
  // Use admin.apps array to detect previous initialization. In serverless
  // environments (Next.js) modules may be evaluated multiple times, so
  // checking admin.apps.length is more reliable than a module-level flag.
  if (admin.apps && admin.apps.length) {
    console.log('✅ Firebase Admin SDK already initialized')
    return admin
  }

  try {
    // Intentar obtener credenciales desde variable de entorno
    let serviceAccount: any

    // Opción 1: JSON stringificado completo
    // Compatibilidad: el secreto puede llamarse FIREBASE_SERVICE_ACCOUNT_KEY o FIREBASE_SERVICE_ACCOUNT
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT
        serviceAccount = JSON.parse(raw as string)
      } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e)
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format')
      }
    }
    // Opción 2: Componentes individuales
    else if (
      process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    ) {
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
        private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID || '',
        private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID || '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      }
    } else {
      // No credentials found. Instead of throwing (which breaks Next.js build
      // if run in an environment where secrets aren't available at build time),
      // return a lightweight stub that prevents immediate crashes during build.
      console.warn(
        '⚠️ Firebase Admin credentials not found. Continuing without admin initialization (build-time).'
      )

      const stubAdmin: any = {
        apps: [],
        initializeApp: () => {
          /* no-op */
        },
        credential: {
          cert: () => {
            throw new Error(
              'Firebase Admin credential not available in this environment.'
            )
          },
        },
        auth: () => {
          throw new Error(
            'Firebase Admin not initialized. This operation requires server-side credentials.'
          )
        },
        firestore: () => {
          throw new Error(
            'Firebase Admin not initialized. This operation requires server-side credentials.'
          )
        },
      }

      return stubAdmin
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    })
    // initialized via admin.apps
    console.log('✅ Firebase Admin SDK initialized successfully')
    return admin
  } catch (error: any) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message)
    throw error
  }
}

export function getAdminAuth() {
  const admin = initializeFirebaseAdmin()
  return admin.auth()
}

export function getAdminFirestore() {
  const admin = initializeFirebaseAdmin()
  return admin.firestore()
}

export default initializeFirebaseAdmin
