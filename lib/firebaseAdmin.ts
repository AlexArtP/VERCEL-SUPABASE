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
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT
      // Try parse JSON directly; if that fails, try base64 decode then parse
      try {
        serviceAccount = JSON.parse(raw as string)
      } catch (e1) {
        try {
          const decoded = Buffer.from(raw as string, 'base64').toString('utf8')
          serviceAccount = JSON.parse(decoded)
        } catch (e2) {
          console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY (raw or base64):', e1, e2)
          throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format; must be JSON or base64-encoded JSON')
        }
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
        // Normalize newlines if user stored escaped newlines
        private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID || '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      }
    } else {
      throw new Error(
        'Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or individual FIREBASE_ADMIN_* variables.'
      )
    }

    // If parsed serviceAccount exists but private_key contains escaped newlines, normalize them
    if (serviceAccount && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = (serviceAccount.private_key as string).replace(/\\n/g, '\n')
    }

    // If project_id is missing from the parsed JSON, try environment fallback
    if (!serviceAccount?.project_id && process.env.FIREBASE_ADMIN_PROJECT_ID) {
      serviceAccount.project_id = process.env.FIREBASE_ADMIN_PROJECT_ID
    }

    // Final validation
    if (!serviceAccount || typeof serviceAccount.project_id !== 'string' || serviceAccount.project_id.length === 0) {
      console.error('Firebase Admin service account is missing required property project_id. Current env keys:', {
        has_SERVICE_ACCOUNT_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY || !!process.env.FIREBASE_SERVICE_ACCOUNT,
        FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      })
      throw new Error('Service account object must contain a string "project_id" property. Ensure FIREBASE_SERVICE_ACCOUNT_KEY JSON includes project_id or set FIREBASE_ADMIN_PROJECT_ID env var.')
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
