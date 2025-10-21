# 🚀 Deployment a Firebase Hosting

## Preparación para Deploy

### Paso 1: Autenticarse con Firebase CLI

```bash
firebase login
```

Este comando abrirá una ventana del navegador para autenticarte con tu cuenta de Google.

**Nota:** Asegúrate de estar usando la cuenta correcta que tiene acceso al proyecto `agendas-cecosamlautaro`.

### Paso 2: Verificar Acceso a Proyectos

Una vez autenticado, verifica que tienes acceso al proyecto:

```bash
firebase projects:list
```

Deberías ver:
```
agendas-cecosamlautaro (DEFAULT)
```

### Paso 3: Compilar el Proyecto

```bash
npm run build
```

Esto generará la carpeta `.next/static` con los archivos optimizados para producción.

### Paso 4: Deploy a Firebase Hosting

```bash
firebase deploy --only hosting:agendas-cecosamlautaro
```

O simplemente (si es el proyecto por defecto):

```bash
firebase deploy --only hosting
```

## Flujo Completo de Deploy

```bash
# 1. Navegar al directorio del proyecto
cd /workspaces/sistema-agendamiento-5-v2

# 2. Compilar
npm run build

# 3. Deploy
firebase deploy --only hosting:agendas-cecosamlautaro
```

## Verificación Post-Deploy

Una vez que el deploy se complete, verifica que la app está disponible en:

```
https://agendas-cecosamlautaro.web.app
```

## Troubleshooting

### Error: "Failed to authenticate"

**Solución:**
```bash
firebase login
```

Vuelve a autenticarte.

### Error: "Permission denied" o "Insufficient permissions"

**Posibles causas:**
- No tienes acceso al proyecto `agendas-cecosamlautaro`
- La cuenta de Firebase CLI no es la correcta

**Solución:**
1. Cierra sesión: `firebase logout`
2. Vuelve a autenticarte: `firebase login`
3. Verifica acceso: `firebase projects:list`

### Error: "Could not find hosting config"

**Solución:**
Verifica que el archivo `firebase.json` existe y contiene:

```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

## Configuración Actual

El proyecto está configurado con:
- **Proyecto Firebase:** agendas-cecosamlautaro
- **Carpeta de deploy:** `out/` (generada por `next build`)
- **Framework:** Next.js 15.5.5 (Static Export)

## Monitoreo de Deploy

Después de hacer deploy, puedes ver el estado en:

```bash
firebase hosting:channel:list agendas-cecosamlautaro
```

O visita la consola de Firebase:
https://console.firebase.google.com/project/agendas-cecosamlautaro/hosting

## Variables de Entorno

Asegúrate de que las variables de entorno están configuradas en:
- `.env.local` (para desarrollo)
- Firebase Console (para producción, si es necesario)

## Próximos Pasos

1. ✅ Compilar el proyecto
2. 📝 Autenticarse con Firebase: `firebase login`
3. 🚀 Hacer deploy: `firebase deploy --only hosting:agendas-cecosamlautaro`
4. ✓ Verificar en: https://agendas-cecosamlautaro.web.app
