# Variables de Entorno para Vercel + Firebase

## Instrucciones para agregar en Vercel:

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto `agenda-vercel`
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable con su valor

## Variables a agregar:

### Firebase (Public - pueden estar en el cliente)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB8kRSzHD_H1_NhF8Rr-yF2gFPukpZJ5rM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agendacecosam.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agendacecosam
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agendacecosam.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=66728286123
NEXT_PUBLIC_FIREBASE_APP_ID=1:66728286123:web:287a51b05cb848644ea4ee
```

### Firebase Admin SDK (Privadas - solo servidor)
Necesitas:
1. Ir a Firebase Console: https://console.firebase.google.com/
2. Proyecto: `agendacecosam`
3. Settings (rueda de engranaje) → Service Accounts
4. Haz clic en "Generate New Private Key"
5. Descarga el JSON
6. Copia el contenido completo y pégalo aquí:

```
FIREBASE_ADMIN_SDK_KEY={"type": "service_account", "project_id": "...", ...}
```

## Nota:
- Las variables que empiezan con `NEXT_PUBLIC_` son públicas (visibles en el cliente)
- Las otras son privadas (solo en servidor)
- Todas deben estar en Vercel Environment Variables
