# 📅 AGENDA VERCEL SUPABASE# Agenda_Vercel

Agenda C.L

**Versión 1.0 sb - Sistema de Agenda Médica con Integración Completa de Supabase**

![Version](https://img.shields.io/badge/version-1.0_sb-blue)
![Stack](https://img.shields.io/badge/stack-Next.js_TypeScript_React_Supabase-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 🎯 Descripción

Sistema completo de gestión de citas médicas construido con **Next.js 15**, **React 18**, **TypeScript** y **Supabase PostgreSQL**. Permite a profesionales de salud gestionar su calendario, pacientes, citas y módulos de atención.

### ✨ Características Principales

✅ **Autenticación Segura** - Con Supabase Auth  
✅ **Gestión de Usuarios** - Profesionales, administrativos, recepcionistas  
✅ **Perfil Profesional** - Edición completa con validaciones  
✅ **Gestión de Pacientes** - CRUD con búsqueda y filtrado  
✅ **Calendario Interactivo** - Visualización de citas y módulos  
✅ **Sistema de Citas** - Confirmadas, pendientes, canceladas  
✅ **Notificaciones** - Alertas de citas y solicitudes  
✅ **Panel Admin** - Gestión integral de usuarios  

---

## 🚀 Quick Start

### Requisitos Previos

- **Node.js** 18+ 
- **npm** o **yarn**
- Cuenta de **Supabase** con base de datos PostgreSQL
- Cuenta de **Vercel** (opcional, para deploy)

### 1. Clonar Repositorio

```bash
git clone https://github.com/AlexArtP/VERCEL-SUPABASE.git
cd VERCEL-SUPABASE
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase (obtenido de Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Service Role Key (SOLO para servidor)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

Accede a **http://localhost:3000**

### 5. Build para Producción

```bash
npm run build
npm start
```

---

## 📊 Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Frontend | Next.js 15.5.5, React 18, TypeScript |
| Estilos | Tailwind CSS |
| Base de Datos | Supabase PostgreSQL |
| Autenticación | Supabase Auth + Firebase Auth |
| Real-time | Supabase Realtime |
| Despliegue | Vercel |

---

## 🗄️ Base de Datos

### Tabla: `usuarios`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userid` | UUID | Clave primaria (del auth) |
| `nombre` | TEXT | Nombre del usuario |
| `apellido_paterno` | TEXT | Apellido paterno |
| `apellido_materno` | TEXT | Apellido materno |
| `email` | TEXT | Email |
| `profesion` | TEXT | Profesión (consolidado) |
| `run` | TEXT | RUN de identificación |
| `rol` | TEXT | 'profesional', 'administrativo', 'recepcionista' |
| `esadmin` | BOOLEAN | Flag de administrador |
| `activo` | BOOLEAN | Usuario activo |

### Tabla: `pacientes`

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `nombre` | TEXT |
| `apellido_paterno` | TEXT |
| `apellido_materno` | TEXT |
| `email` | TEXT |
| `telefono` | TEXT |
| `run` | TEXT |

### Tabla: `citas`

| Campo | Tipo |
|-------|------|
| `id` | UUID |
| `paciente_id` | UUID |
| `profesional_id` | UUID |
| `fecha` | DATE |
| `hora_inicio` | TIME |
| `hora_fin` | TIME |
| `estado` | TEXT |

---

## ✨ Características Destacadas

### 🔄 Consolidación de Campos
- **Estamento consolidado a Profesión** - Un único campo para especialidad
- **Campo de solo lectura** - Cargado desde BD, no editable en perfil

### 👤 Gestión de Apellidos
- **Dos campos separados** - `apellido_paterno` y `apellido_materno`
- **Visualización combinada** - Se muestran juntos en header
- **Persistencia correcta** - Cambios se guardan y recuperan sin pérdida

### 📞 Autoformato de Campos
- **RUN formateado automáticamente** - `12.345.678-9`
- **Validaciones en tiempo real** - Con feedback visual

### 🔄 Actualización en Tiempo Real
- **Event listener `profileUpdated`** - Dispara actualización automática
- **Refresco de UI** - Los cambios aparecen inmediatamente
- **Sin necesidad de recargar** - Experiencia fluida

---

## 📁 Estructura del Proyecto

```
.
├── app/
│   ├── api/                  # Next.js API Routes
│   │   ├── profile/         # GET/PUT perfil
│   │   ├── usuarios/        # GET usuarios
│   │   ├── auth/            # Autenticación
│   │   └── ...
│   ├── layout.tsx           # Layout + Providers
│   └── page.tsx             # Login
│
├── components/              # Componentes React
│   ├── ProfileView.tsx
│   ├── MainApp.tsx
│   ├── CalendarView.tsx
│   └── ...
│
├── lib/
│   ├── hooks/
│   │   ├── useSupabaseUsuarios.ts
│   │   ├── useSupabasePacientes.ts
│   │   └── ...
│   ├── supabaseClient.ts
│   └── ...
│
├── migrations/              # Migraciones SQL
│   └── ...
│
└── package.json
```

---

## 🔐 Autenticación

### Flujo de Login

1. Usuario ingresa email y contraseña
2. Llamada a `/api/auth/login`
3. Supabase Auth verifica credenciales
4. Token JWT se almacena en localStorage
5. Sesión se restaura en siguientes visitas

### Roles

- **Profesional** - Acceso a calendario y pacientes
- **Administrativo** - Gestión administrativa
- **Recepcionista** - Acceso limitado
- **Admin** - Acceso total (todo)

---

## 🚀 Deploy en Vercel

```bash
# 1. Push a GitHub
git push origin main

# 2. Conectar en Vercel Dashboard
# 3. Configurar Environment Variables
# 4. Deploy automático
```

---

## 🧪 Scripts

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Lint
npm run lint
```

---

## 🐛 Troubleshooting

| Error | Solución |
|-------|----------|
| Tabla `usuarios` no encontrada | Ejecuta migraciones: `supabase migration up` |
| Service Role Key no configurada | Verifica `.env.local` |
| Usuarios no se actualizan | Verifica `useSupabaseUsuarios` activo |
| Apellidos desaparecen | Verifica event listener `profileUpdated` |

---

## 📝 Changelog

### v1.0 sb (11 nov 2025)
- ✅ Consolidación completa a Supabase
- ✅ Consolidación de `estamento` a `profesion`
- ✅ Campos separados de apellidos
- ✅ Hook `useSupabaseUsuarios`
- ✅ Event listener para actualización en tiempo real
- ✅ Visualización correcta de nombre + apellidos

---

## 👤 Autor

**Alexander Arteaga**  
📧 a.arteaga02@ufromail.cl  
🔗 [@AlexArtP](https://github.com/AlexArtP)

---

## 📄 Licencia

MIT License - Ver archivo `LICENSE` para detalles

---

**Status:** ✅ Production Ready  
**Version:** 1.0 sb  
**Last Updated:** 11 de noviembre de 2025
