# 🔐 Conectar Firebase Authentication con tu Proyecto

## 📋 Índice
1. [Paso 1: Habilitar Firebase Auth](#paso-1-habilitar-firebase-auth)
2. [Paso 2: Crear usuarios en Firebase Console](#paso-2-crear-usuarios-en-firebase-console)
3. [Paso 3: Configurar Firestore Security Rules](#paso-3-configurar-firestore-security-rules)
4. [Paso 4: Actualizar código del proyecto](#paso-4-actualizar-código-del-proyecto)
5. [Paso 5: Probar la autenticación](#paso-5-probar-la-autenticación)

---

## PASO 1: Habilitar Firebase Auth

### 1.1 Ir a Firebase Console
1. Abre [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **agendacecosam**
3. En el menú izquierdo, ve a **Build** → **Authentication**

### 1.2 Habilitar Email/Password
1. Haz clic en la pestaña **"Sign-in method"**
2. Busca **"Email/Password"** y haz clic
3. Activa el toggle **"Enable"** (el email/password debe estar activo)
4. Haz clic en **"Save"**

✅ Ahora Firebase Authentication está habilitado.

---

## PASO 2: Crear usuarios en Firebase Console

### 2.1 Crear primer usuario (Admin)
1. Abre Firebase Console → Authentication → **Users** tab
2. Haz clic en **"Add user"**
3. Completa los campos:
   ```
   Email: juan.perez@clinica.cl
   Password: demo123
   ```
4. Haz clic en **"Add user"**

### 2.2 Crear segundo usuario (Admin)
1. Haz clic nuevamente en **"Add user"**
2. Completa:
   ```
   Email: carlos.ramirez@clinica.cl
   Password: demo123
   ```
3. Haz clic en **"Add user"**

### 2.3 Crear usuarios adicionales (Opcionales)
1. Haz clic en **"Add user"**
2. Completa:
   ```
   Email: maria.silva@clinica.cl
   Password: demo123
   ```
3. Haz clic en **"Add user"**

✅ Los usuarios ahora existen en Firebase Authentication.

---

## PASO 3: Configurar Firestore Security Rules

Las Security Rules controlan quién puede acceder a la base de datos.

### 3.1 Ir a Firestore Rules
1. Firebase Console → **Firestore Database** → **Rules**
2. Reemplaza el contenido con estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Permitir lectura/escritura si el usuario está autenticado
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Colecciones públicas (acceso abierto)
    match /pacientes/{document=**} {
      allow read: if true;
    }
    
    match /especialidades/{document=**} {
      allow read: if true;
    }
    
    // Colecciones protegidas (solo autenticados)
    match /usuarios/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /profesionales/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /citas/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /modulos/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Haz clic en **"Publish"**

✅ Las Security Rules están configuradas.

---

## PASO 4: Actualizar código del proyecto

### 4.1 Crear nuevo archivo de autenticación
Crearemos un archivo que maneje la autenticación de Firebase.

**Archivo:** `lib/firebaseAuth.ts`

```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { db } from './firebaseConfig'
import { getDoc, doc } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

// Obtener instancia de Firebase Auth
const firebaseConfig = {
  apiKey: "AIzaSyB8kRSzHD_H1_NhF8Rr-yF2gFPukpZJ5rM",
  authDomain: "agendacecosam.firebaseapp.com",
  projectId: "agendacecosam",
  storageBucket: "agendacecosam.firebasestorage.app",
  messagingSenderId: "66728286123",
  appId: "1:66728286123:web:287a51b05cb848644ea4ee"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

/**
 * Login con Firebase Authentication
 */
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Obtener datos adicionales del usuario de Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid))
    const userData = userDoc.data()
    
    // Guardar en localStorage para SPA
    localStorage.setItem('sistema_auth_token', JSON.stringify({
      id: user.uid,
      email: user.email,
      nombre: userData?.nombre || user.displayName,
      rol: userData?.rol || 'profesional',
      esAdmin: userData?.esAdmin || false,
      timestamp: Date.now()
    }))
    
    return { success: true, user, userData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Logout
 */
export const logoutUser = async () => {
  try {
    localStorage.removeItem('sistema_auth_token')
    localStorage.removeItem('usuario_id')
    await signOut(auth)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Listener para cambios de autenticación
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Obtener usuario actual
 */
export const getCurrentUser = () => {
  return auth.currentUser
}
```

### 4.2 Actualizar página de login
**Archivo:** `app/login/page.tsx`

Reemplaza la función `handleLogin`:

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    // Intentar login con Firebase
    const { success, error, userData } = await loginWithEmail(email, password)
    
    if (!success) {
      setError(error || 'Error al iniciar sesión')
      setLoading(false)
      return
    }

    // Redirigir según rol
    const isAdmin = userData?.esAdmin === true
    if (isAdmin) {
      router.push('/admin/init-database')
    } else {
      router.push('/')
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error desconocido')
    setLoading(false)
  }
}
```

---

## PASO 5: Probar la autenticación

### 5.1 Compilar el proyecto
```bash
npm run build
```

### 5.2 Iniciar servidor local
```bash
npm run dev
```

### 5.3 Probar login
1. Ve a http://localhost:3001/login
2. Intenta con:
   - Email: juan.perez@clinica.cl
   - Contraseña: demo123
3. Deberías ver:
   - ✅ Login exitoso → Redirige a /admin/init-database
   - ✅ Datos cargados de Firebase
   - ✅ Sesión guardada en localStorage

### 5.4 Verificar en Firebase Console
1. Firebase Console → Authentication → **Users**
2. Deberías ver los usuarios listados
3. Haz clic en un usuario para ver:
   - Email
   - Fecha de creación
   - Último login

---

## 🔄 Flujo de Autenticación

```
Usuario introduce credenciales
         ↓
Firebase Authentication valida
         ↓
Si es válido → obtener datos de Firestore (usuarios)
         ↓
Guardar token en localStorage
         ↓
Redirigir según rol (admin o normal)
         ↓
✨ Usuario logueado
```

---

## 🚨 Troubleshooting

### Problema: "auth/user-not-found"
**Solución:** El usuario no existe en Firebase Auth. Crea el usuario en Firebase Console siguiendo Paso 2.

### Problema: "auth/wrong-password"
**Solución:** La contraseña es incorrecta. Verifica que sea exactamente "demo123".

### Problema: "Permission denied" en Firestore
**Solución:** Las Security Rules no están configuradas correctamente. Sigue Paso 3 de nuevo.

### Problema: Los datos de usuario no se cargan
**Solución:** La colección "usuarios" en Firestore no existe. Usa el panel admin para inicializar la base de datos.

---

## 📝 Próximos Pasos

1. ✅ Habilitar Firebase Auth
2. ✅ Crear usuarios en Firebase Console
3. ✅ Configurar Security Rules
4. ✅ Actualizar código del proyecto
5. ⏳ Llenar colecciones en Firestore con datos reales

Ver: `README/02-FIREBASE-INIT/FIREBASE_INIT_GUIDE.md` para llenar la base de datos.

---

## 🔗 Enlaces Útiles

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Console](https://console.firebase.google.com)

---

## ❓ ¿Preguntas?

Si tienes problemas:
1. Revisa el archivo: `README/08-REFERENCIA/FIREBASE_DEPLOY_FIX.md`
2. Consulta: `README/07-VERIFICACION/CHECKLIST_VERIFICACION.md`
3. O contacta al equipo de desarrollo
