# ⚡ Próximos Pasos - Firebase Authentication

## 📋 Lo que ya está hecho:

✅ Archivo `lib/firebaseAuth.ts` creado con todas las funciones  
✅ Documentación `README/02-FIREBASE-INIT/CONECTAR_FIREBASE_AUTH.md` creada  
✅ Funciones para login, logout, verificación de roles

## ⏳ Lo que necesitas hacer:

### 1️⃣ EN FIREBASE CONSOLE (Web)

Antes de que el proyecto use Firebase Auth, necesitas:

**A. Habilitar Email/Password Auth:**
- Abre: https://console.firebase.google.com
- Proyecto: `agendacecosam`
- Build → Authentication → Sign-in method
- Busca "Email/Password" y activa el toggle

**B. Crear usuarios:**
- Tab "Users" → Click "Add user"
- Crea estos usuarios:
  - `juan.perez@clinica.cl` / `demo123` (admin)
  - `carlos.ramirez@clinica.cl` / `demo123` (admin)
  - `maria.silva@clinica.cl` / `demo123` (normal)

**C. Configurar Security Rules:**
- Firestore Database → Rules
- Copia las reglas del documento: `README/02-FIREBASE-INIT/CONECTAR_FIREBASE_AUTH.md`
- Click "Publish"

### 2️⃣ EN TU PROYECTO (Próximamente)

**Actualizar `app/login/page.tsx`**

Cuando estés listo, puedes reemplazar la función `handleLogin` para usar Firebase Auth en lugar de localStorage.

**Comando para compilar y probar:**
```bash
npm run build
npm run dev
```

## 🔗 URLs Importantes

- **Firebase Console:** https://console.firebase.google.com/project/agendacecosam
- **Guía completa:** `README/02-FIREBASE-INIT/CONECTAR_FIREBASE_AUTH.md`
- **Archivo creado:** `lib/firebaseAuth.ts`

## ❓ ¿Necesitas ayuda?

Si tienes preguntas, avísame y puedo:
1. Actualizar `app/login/page.tsx` para usar Firebase Auth
2. Crear usuarios de demostración
3. Ayudarte a configurar Security Rules
4. Hacer deploy a Firebase Hosting
