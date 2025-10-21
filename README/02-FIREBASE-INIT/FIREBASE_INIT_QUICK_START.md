# 🎯 GUÍA RÁPIDA: FIREBASE INIT EN 5 MINUTOS

**Objetivo:** Inicializar la base de datos online con un click

---

## ANTES DE EMPEZAR

Asegúrate de tener:

- ✅ Credenciales Firebase en `.env.local` (6 variables `NEXT_PUBLIC_FIREBASE_*`)
- ✅ Servidor corriendo: `npm run dev`
- ✅ Usuario admin creado (o usa credenciales de demostración)

---

## PASO 1: Abre la página de inicialización

```
Abre en tu navegador:
http://localhost:3000/admin/init-database
```

**Verás:**
- Panel bonito con opciones
- Verificación de que estés autenticado
- Botón verde: "🚀 Inicializar Base de Datos"

---

## PASO 2: Inicia sesión (si es necesario)

Si no estás autenticado:

```
Email: juan.perez@clinica.cl
Contraseña: demo123
```

(Estos son datos de demostración del archivo demoData.ts)

---

## PASO 3: Haz clic en "🚀 Inicializar Base de Datos"

```
[ANTES]
├─ Firestore: Vacío
├─ Authentication: Sin usuarios
└─ Estado: Listo para inicializar

[Click en botón]
     ↓
[PROCESO]
⏳ Inicializando base de datos...
  ✓ Usuario creado: Dr. Juan Pérez González
  ✓ Usuario creado: Dra. María Silva Rojas
  ✓ Usuario creado: Carlos Ramírez Torres
  ✓ Usuario creado: Dra. Ana Morales Díaz
  ✓ Usuario creado: Luis Fernández Castro
  ✓ Paciente creado: Pedro Sánchez
  ✓ Paciente creado: Laura Martínez
  ✓ Paciente creado: Roberto Gutiérrez
  ✓ Plantilla creada: Consulta General
  ✓ Plantilla creada: Cardiología
  ✓ Plantilla creada: Control
  ✓ Plantilla creada: Ingreso
  ✓ Módulo creado: Consulta General - 09:00
  ✓ Módulo creado: Consulta General - 10:00
  ✓ Módulo creado: Cardiología - 10:00
  ✓ Módulo creado: Control - 14:00
  ✓ Módulo creado: Control - 14:30
  ✓ Cita creada: Pedro Sánchez - 09:00
  ✓ Cita creada: Laura Martínez - 10:30
  ✓ Cita creada: Roberto Gutiérrez - 14:00
  ✓ Cita creada: Pedro Sánchez - 11:00
✅ Base de datos inicializada exitosamente

[DESPUÉS]
├─ Firestore: Lleno de datos
├─ Authentication: 5 usuarios con login
└─ Estado: Listo para usar

📊 ESTADÍSTICAS
├─ Usuarios: 5
├─ Pacientes: 3
├─ Citas: 4
├─ Módulos: 5
└─ Plantillas: 4
```

---

## PASO 4: ¡Verifica en Firebase Console!

### Opción A: Ver en Firestore

```
1. Abre: https://console.firebase.google.com
2. Selecciona tu proyecto
3. Click: "Firestore Database"
4. Verás colecciones:
   ├─ users/
   ├─ pacientes/
   ├─ citas/
   ├─ modulos/
   ├─ plantillas/
   └─ config/
```

### Opción B: Ver en Authentication

```
1. En Firebase Console
2. Click: "Authentication"
3. Verás 5 usuarios:
   ├─ juan.perez@clinica.cl
   ├─ maria.silva@clinica.cl
   ├─ carlos.ramirez@clinica.cl
   ├─ ana.morales@clinica.cl
   └─ luis.fernandez@clinica.cl
```

---

## PASO 5: Prueba tu app

### Prueba 1: Login

```
1. Abre tu app en http://localhost:3000
2. Intenta login con:
   Email: juan.perez@clinica.cl
   Password: demo123
3. Deberías entrar sin problemas
```

### Prueba 2: Ver datos

```
1. Si hay un módulo de calendario
2. Deberías ver 5 módulos disponibles
3. Deberías ver 4 citas agendadas
```

### Prueba 3: Sincronización en tiempo real

```
1. Abre dos ventanas del navegador
2. En ventana 1: Crea un nuevo módulo
3. En ventana 2: Sin refrescar, verás el módulo aparecer en <1 segundo
```

---

## ✅ CHECKLIST

```
[ ] He abierto http://localhost:3000/admin/init-database
[ ] He iniciado sesión como admin
[ ] He hecho click en "Inicializar Base de Datos"
[ ] Vi el mensaje "✅ Base de datos inicializada exitosamente"
[ ] Vi las estadísticas (5 usuarios, 3 pacientes, etc.)
[ ] Fui a Firebase Console y vi las colecciones
[ ] Intenté login con juan.perez@clinica.cl
[ ] Vi que el calendario tiene módulos
[ ] Probé la sincronización en tiempo real
```

---

## 🆘 PROBLEMAS COMUNES

### ❌ "No puedo acceder a /admin/init-database"

**Solución:**
```
1. Asegúrate de estar en http://localhost:3000 (no producción)
2. Verifica que el servidor esté corriendo: npm run dev
3. Recarga la página: Ctrl+Shift+R (borrar caché)
```

### ❌ "Dice: Solo administradores pueden acceder"

**Solución:**
```
El usuario juan.perez@clinica.cl está marcado como esAdmin: true

Si no funciona, edita: app/admin/init-database/page.tsx

Cambia:
  const isAdmin = user?.email?.includes('admin')

A:
  const isAdmin = user?.email === 'juan.perez@clinica.cl'
```

### ❌ "Error: Firebase not initialized"

**Solución:**
```
1. Verifica que .env.local tiene las 6 variables
2. Reinicia el servidor: Ctrl+C y npm run dev
3. Limpia caché del navegador: Ctrl+Shift+R
```

### ❌ "Error: Email already in use"

**Solución:**

La BD ya fue inicializada antes.

**Opción 1 - Usar la BD existente (RECOMENDADO):**
```
Simplemente recarga la página.
Verás: "La base de datos ya está configurada"
```

**Opción 2 - Limpiar todo (para desarrollo):**
```
1. En la página de init-database
2. Baja hasta "Zona de Peligro"
3. Click: "🗑️ Limpiar Toda la Base de Datos"
4. Confirmación: "Confirmar Eliminación"
5. Espera 30 segundos
6. Click: "🚀 Inicializar Base de Datos" (comienza de cero)
```

---

## 📚 RECURSOS ADICIONALES

- **Guía completa:** `FIREBASE_INIT_GUIDE.md` (15 minutos)
- **Cómo obtener credenciales:** `PASO4_CREDENCIALES_FIREBASE.md`
- **Troubleshooting avanzado:** `CHECKLIST_VERIFICACION.md`

---

## 🎉 ¡LISTO!

Tu base de datos online está lista para usar.

**Lo que acabas de hacer:**

✅ Inicializaste 5 usuarios en Firebase Authentication  
✅ Importaste 3 pacientes a Firestore  
✅ Creaste 4 plantillas (templates) de módulos  
✅ Generaste 5 módulos (slots) en el calendario  
✅ Importaste 4 citas de demostración  
✅ Configuraste sincronización en tiempo real  

**¡Tu sistema de agendamiento está online y funcionando!** 🚀
