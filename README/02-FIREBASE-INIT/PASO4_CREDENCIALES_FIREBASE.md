# 🔑 PASO 4: OBTENER CREDENCIALES DE FIREBASE
## Guía Detallada con Capturas Mentales

---

## ¿QUÉ NECESITAMOS?

Firebase necesita identificarse con tu proyecto. Como si le dijeras:
> "Hola Firebase, soy la aplicación XYZ del usuario ABC. Déjame guardar datos"

Las credenciales son como las llaves de acceso. Sin ellas, Firebase no te deja conectar.

---

## 📋 PASOS A SEGUIR

### PASO 1: Ir a Firebase Console

1. Abre tu navegador
2. Ve a: **https://console.firebase.google.com**
3. Haz login con tu cuenta de Google
4. Selecciona tu proyecto

```
Pantalla que deberías ver:
┌─────────────────────────────────────────┐
│ Firebase Console                        │
│ Projects / Mi Proyecto / ...            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Overview                            │ │
│ │ Build                               │ │
│ │ └─ Firestore Database               │ │
│ │ └─ Authentication                   │ │
│ │ └─ Cloud Storage                    │ │
│ │ Analytics                           │ │
│ │ Settings ← AQUÍ                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### PASO 2: Abrir Project Settings

1. En la parte inferior izquierda, haz clic en el **engranaje ⚙️**
2. Selecciona **Project Settings** (Configuración del Proyecto)

```
Dónde está:
┌─────────────────────────────┐
│ Mi Proyecto                 │
│                             │
│ ... (muchas opciones)       │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚙️ Project Settings ←   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

### PASO 3: Ir a la pestaña "Your apps"

1. En Project Settings, verás varias pestañas
2. Busca la pestaña **"Your apps"** (Tus aplicaciones)

```
Pestañas que ves:
┌──────────────────────────────────────────┐
│ [General] [Users] [Your apps] ← AQUÍ    │
└──────────────────────────────────────────┘
```

---

### PASO 4: Buscar o crear tu app web

En "Your apps" verás una lista de aplicaciones conectadas.

**Si ya existe tu app web:**
- Haz clic en ella

**Si NO existe:**
- Haz clic en el botón **"Add app"** (Agregar app)
- Selecciona **Web** (</> símbolo)
- Dale un nombre (ej: "Sistema Agendamiento Web")
- Haz clic en "Register app" (Registrar app)

```
Resultado: Verás una pantalla con código JavaScript
```

---

### PASO 5: Copiar credenciales

Cuando hagas clic en tu app web, verás código como este:

```javascript
// Copy-paste this into your Firebase initialize code
const firebaseConfig = {
  apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX",
  authDomain: "mi-proyecto.firebaseapp.com",
  projectId: "mi-proyecto",
  storageBucket: "mi-proyecto.appspot.com",
  messagingSenderId: "1234567890123",
  appId: "1:1234567890123:web:abcdef1234567890ab"
};
```

✅ **AQUÍ ESTÁN LAS CREDENCIALES QUE NECESITAS**

---

## 📝 CÓMO LLENAR `.env.local`

### PASO 1: Abre el archivo `.env.local`

En VS Code:
1. Abre la carpeta del proyecto
2. Busca el archivo `.env.local`
3. Haz doble clic para abrirlo

```
Debería verse así:
┌────────────────────────────────────────────┐
│ .env.local                                 │
├────────────────────────────────────────────┤
│ NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key   │
│ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...      │
│ ... etc                                    │
└────────────────────────────────────────────┘
```

### PASO 2: Llenar cada línea

Copia los valores de Firebase y pégalos aquí.

Mira cómo mapean:

```
Desde Firebase Console:
┌──────────────────────────────────────────┐
│ const firebaseConfig = {                 │
│   apiKey: "AIzaSyD...",                  │
│   authDomain: "mi-proyecto...",          │
│   projectId: "mi-proyecto",              │
│   storageBucket: "mi-proyecto.appspot..", │
│   messagingSenderId: "123456789...",     │
│   appId: "1:123456789:web:abc..."        │
│ }                                        │
└──────────────────────────────────────────┘

Hacia .env.local:
┌──────────────────────────────────────────┐
│ NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...  │
│ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...     │
│ NEXT_PUBLIC_FIREBASE_PROJECT_ID=...      │
│ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...  │
│ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_.. │
│ NEXT_PUBLIC_FIREBASE_APP_ID=1:123456...  │
└──────────────────────────────────────────┘
```

### PASO 3: Rellenar con tus valores

**Ejemplo completo:**

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sistema-agendamiento.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sistema-agendamiento
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sistema-agendamiento.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890123
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890123:web:abcdef1234567890ab
```

---

## ⚠️ IMPORTANTE: Seguridad

### ❌ NUNCA hagas esto:

```
❌ NO subas .env.local a GitHub
❌ NO compartas estas credenciales
❌ NO las pongas en un chat de grupo
❌ NO las dejes visibles en capturas
```

### ✅ Qué SÍ debes hacer:

```
✅ Guarda .env.local solo en tu computadora
✅ El archivo está en .gitignore (ignorado automáticamente)
✅ Si accidentalmente las compartes, crea nuevas en Firebase
✅ En producción, usa variables de entorno seguras
```

---

## 🔍 VERIFICACIÓN

Después de llenar `.env.local`:

### Paso 1: Reiniciar servidor

```bash
# Presiona Ctrl+C en la terminal si está corriendo
# Luego:
npm run dev
```

### Paso 2: Ver logs

Abre navegador y ve a `http://localhost:3000`

Abre la consola (F12) y busca logs:

```
✅ Si ves:
"📡 Activando listeners para profesional: 1"
"✅ Módulos actualizados: [...]"
→ ¡EXCELENTE! Funciona

❌ Si ves:
"Firebase initialization failed"
"Permission denied"
"undefined" en credenciales
→ Hay un problema
```

---

## 🚨 TROUBLESHOOTING

### Problema 1: "Firebase initialization failed"

**Causa:** Credenciales incorrectas

**Solución:**
1. Copia EXACTAMENTE de Firebase Console
2. No agregues espacios ni cambies nada
3. Asegúrate de no incluir comillas adicionales
4. Reinicia servidor: `npm run dev`

### Problema 2: "Permission denied"

**Causa:** Reglas de Firestore no permiten acceso

**Solución:**
1. Ve a Firebase Console
2. Firestore Database → Rules
3. Reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Haz clic en "Publish"

### Problema 3: Variables no cargan

**Causa:** Servidor no se reinició

**Solución:**
1. Ctrl+C para detener servidor
2. `npm run dev` para reiniciar
3. Cierra navegador completamente
4. Abre nuevamente

### Problema 4: "No veo credenciales en Firebase Console"

**Causa:** Tu app web no está registrada

**Solución:**
1. Ve a Project Settings → Your apps
2. Si está vacío, haz clic "Add app"
3. Selecciona "Web"
4. Llena el formulario
5. Copia las credenciales

---

## ✅ CHECKLIST - Paso 4 Completado

- [ ] Fui a https://console.firebase.google.com
- [ ] Abrí Project Settings (⚙️)
- [ ] Fui a la pestaña "Your apps"
- [ ] Encontré mi app web (o la creé)
- [ ] Copié las credenciales
- [ ] Abrí el archivo `.env.local` en VS Code
- [ ] Llené todos los valores (6 líneas)
- [ ] Guardé el archivo (Ctrl+S)
- [ ] Reinicié el servidor (`npm run dev`)
- [ ] ¡Paso 4 COMPLETADO! ✅

---

## 🎯 ¿QUÉ SIGUE?

Una vez que tengas `.env.local` lleno:

1. Reinicia servidor: `npm run dev`
2. Sigue al **PASO 7: Pruebas en navegador**
3. Abre 2 navegadores
4. Crea un módulo en uno
5. Verifica que aparece en el otro en <1 segundo

---

## 📞 RESUMEN RÁPIDO

```
Firebase Console
        ↓
Your apps (Pestaña)
        ↓
Tu app web
        ↓
Copia credenciales
        ↓
Pega en .env.local
        ↓
Reinicia servidor
        ↓
¡LISTO!
```

