# VERSION 1.0 sb - Integración Completa de Supabase

**Fecha:** 11 de noviembre de 2025

## 🎯 Resumen

Esta es la versión 1.0 con integración completa de **Supabase PostgreSQL**. Incluye todas las funcionalidades de la agenda médica con autenticación, gestión de usuarios, pacientes, citas y módulos de calendario.

## ✨ Características Principales

### ✅ Autenticación y Usuarios
- Login seguro con Supabase Auth
- Gestión de usuarios (profesionales, administrativos, recepcionistas)
- Roles y permisos
- Cambio de contraseña

### ✅ Perfil de Usuario
- Visualización y edición de perfil profesional
- Campos: Nombre, Apellidos (Paterno y Materno), RUN, Email, Teléfono, Profesión
- Autoformato de RUN con guion antes del dígito verificador
- Profesión mostrada como campo de solo lectura desde la BD

### ✅ Gestión de Pacientes
- CRUD completo de pacientes
- Búsqueda y filtrado
- Asignación a profesionales

### ✅ Citas y Calendario
- Calendario interactivo con módulos/slots
- Gestión de citas confirmadas, pendientes y canceladas
- Notificaciones de citas
- Sobrecupos

### ✅ Admin
- Panel de administración con acceso a usuarios
- Edición de roles y permisos
- Gestión de contraseñas temporales

## 🔧 Stack Tecnológico

- **Frontend:** Next.js 15.5.5, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** Supabase PostgreSQL
- **Autenticación:** Supabase Auth
- **Real-time:** Supabase Realtime (para actualizaciones)

## 🗄️ Base de Datos

### Tablas Principales
- `usuarios` - Profesionales, administrativos, recepcionistas
- `pacientes` - Información de pacientes
- `citas` - Citas agendadas
- `modulos` - Slots de calendario
- `plantillas` - Plantillas de módulos
- `solicitudes` - Solicitudes de autorización

### Campos de Usuarios
- `userid` (UUID) - Clave primaria
- `nombre` - Nombre del usuario
- `apellido_paterno` - Apellido paterno
- `apellido_materno` - Apellido materno
- `email` - Correo electrónico
- `profesion` - Profesión (consolidado de estamento)
- `run` - RUN de identificación
- `telefono` - Teléfono
- `rol` - Rol (profesional, administrativo, recepcionista)
- `esadmin` - Flag de administrador

## 🐛 Correcciones en esta versión

### Problema 1: Consolidación de Estamento
- ✅ Consolidado `estamento` a `profesion`
- ✅ Campo ahora de solo lectura desde la BD
- ✅ Eliminada columna `estamento` de la tabla

### Problema 2: Apellidos Desapareciendo al Guardar
- ✅ Problema identificado: Usuarios cargados desde Firestore en lugar de Supabase
- ✅ Solución: Creado hook `useSupabaseUsuarios` que carga desde Supabase
- ✅ Implementado listener de eventos `profileUpdated` para refrescar automáticamente
- ✅ Apellidos ahora persisten después de guardar y recargar

### Problema 3: Apellidos no se Mostraban en Header
- ✅ Implementada combinación de `apellido_paterno` + `apellido_materno`
- ✅ Se muestran correctamente: "Nombre Apellido Paterno Apellido Materno"

## 📦 Archivos Clave Modificados

- `ProfileView.tsx` - Dispara evento `profileUpdated` tras guardar
- `MainApp.tsx` - Escucha evento y refresca usuarios desde Supabase
- `lib/hooks/useSupabaseUsuarios.ts` - Hook para cargar usuarios desde Supabase
- `app/api/usuarios/route.ts` - Endpoint para obtener lista de usuarios
- `lib/demoData.ts` - Actualizado para incluir `pacienteApellidos`
- `components/AppointmentCard.tsx` - Muestra nombre + apellidos completos

## 🚀 Cómo Usar

### Desarrollo
```bash
npm run dev
```

Accede a http://localhost:3000

### Build
```bash
npm run build
npm start
```

## 📝 Variables de Entorno Requeridas

```
NEXT_PUBLIC_SUPABASE_URL=<tu-url-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

## 🔐 Notas de Seguridad

- Las contraseñas se almacenan en Supabase Auth (nunca en la BD)
- RLS (Row Level Security) habilitado en tablas sensibles
- Service Role Key se usa solo en servidor (nunca exposición al cliente)
- Los tokens se almacenan en localStorage con expiración

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.

---

**Estado:** ✅ Producción Listo
**Versión:** 1.0 sb (Supabase)
**Última Actualización:** 11 de noviembre de 2025
