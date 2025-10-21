# 🔐 Configurar Firebase Admin SDK

Para que el endpoint `/api/auth/approve` funcione correctamente y cree usuarios de forma segura en el servidor, necesitas configurar Firebase Admin SDK.

## Pasos para configurar

### 1. Descargar credenciales de servicio desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto ("agendacecosam")
3. Ve a **Configuración** → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Se descargará un archivo JSON con el formato:

```json
{
  "type": "service_account",
  "project_id": "agendacecosam",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@agendacecosam.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

### 2. Configurar variables de entorno

#### Opción A: Variable única JSON (RECOMENDADO para producción)

En tu archivo `.env.local`:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"agendacecosam",...}'
```

**Nota:** Asegúrate de que el JSON está en una sola línea y escapeado correctamente.

#### Opción B: Variables individuales (más legible, más seguro en dev)

En tu archivo `.env.local`:

```bash
FIREBASE_ADMIN_PROJECT_ID=agendacecosam
FIREBASE_ADMIN_PRIVATE_KEY_ID=tu_private_key_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_contenido_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@agendacecosam.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=tu_client_id
```

### 3. Verificar la configuración

Ejecuta la compilación:

```bash
npm run build
```

Si todo está bien, verás:

```
✅ Firebase Admin SDK initialized successfully
```

Si hay error, verás:

```
❌ Error initializing Firebase Admin SDK: Invalid FIREBASE_SERVICE_ACCOUNT_KEY format
```

## Funcionalidades con Admin SDK

Una vez configurado, el endpoint `/api/auth/approve` ahora:

✅ **Crea usuarios de forma segura en el servidor** (no expone contraseñas al cliente)
✅ **Asigna custom claims** (rol, isAdmin) automáticamente
✅ **Genera contraseñas temporales seguras**
✅ **Maneja emails duplicados gracefully**
✅ **Registra operaciones en logs del servidor**

## Logs de depuración

Al aprobar una solicitud, verás en la consola del servidor:

```
✅ Usuario creado en Firebase Auth: abc123def456
✅ Custom claims asignados al usuario: abc123def456
✅ Solicitud actualizada: solicitud789
✅ Documento de usuario creado: abc123def456
```

## Seguridad

- 🔒 Las contraseñas se crean en el servidor (nunca pasan por el cliente)
- 🔒 Las credenciales de admin nunca se exponen al cliente
- 🔒 Los custom claims se asignan server-side
- ⚠️ No expongas nunca `FIREBASE_SERVICE_ACCOUNT_KEY` en tu repositorio público

## Troubleshooting

### Error: "Firebase Admin credentials not found"

**Causa:** Variables de entorno no configuradas.

**Solución:** Verifica que tengas configurada una de las dos opciones anteriores en `.env.local`.

### Error: "Invalid FIREBASE_SERVICE_ACCOUNT_KEY format"

**Causa:** JSON no válido o mal escapeado.

**Solución:** Asegúrate que:
- El JSON es válido (usa [jsonlint.com](https://jsonlint.com))
- En `.env.local`, el JSON está en una línea y escapado correctamente
- Los saltos de línea en `private_key` están escapados como `\n`

### Endpoint retorna 503 "Admin SDK not configured"

**Causa:** Admin SDK no inicializó correctamente.

**Solución:** Revisa los logs del servidor (`npm run dev`) para ver el error exacto.

---

**Para desarrollo local sin Admin SDK:**

Si no tienes las credenciales aún, el endpoint retornará un error 503. Esto es normal. Una vez que configures las variables, automáticamente usará Admin SDK para crear usuarios de forma segura.
