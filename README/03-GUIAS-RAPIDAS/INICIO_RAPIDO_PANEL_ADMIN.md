# 🎯 Instrucciones Rápidas: Usar Panel Admin

## 🚀 Empezar Ahora

### Paso 1: Abrir la App
```bash
→ Abre en el navegador: http://localhost:3001/login
```

### Paso 2: Inicia Sesión como Admin
```
Email: juan.perez@clinica.cl
Contraseña: demo123
```

### Paso 3: Navega a Configuraciones
```
Menú lateral izquierdo:
   ⚙️ Configuraciones  ← Haz clic aquí
```

### Paso 4: Abre el Tab Admin
```
Verás 4 tabs en la página:
   [Perfil] [Configuraciones] [Base de Datos] [🔧 Administración] ← NUEVO
   
   Haz clic en: 🔧 Administración
```

### Paso 5: Abre el Panel
```
Veras tarjeta azul:
   🚀 INICIALIZAR BASE DE DATOS
   
   Botón derecha:
   [Abrir Panel →]  ← Haz clic
```

### Paso 6: ¡Estás en el Panel Admin!
```
Se abre en nueva pestaña:
   http://localhost:3001/admin/init-database
   
Con botones para:
   ✅ Inicializar Base de Datos
   ✅ Ver Estadísticas
   ✅ Limpiar BD (cuidado!)
```

---

## ✅ Confirmación Visual

Cuando todo funciona, verás esto:

### En Configuraciones:
```
┌─────────────────────────────────────────┐
│ 🚀 INICIALIZAR BASE DE DATOS            │
│                                         │
│ Configura automáticamente Firebase...   │
│                                         │
│ ✓ Crea 6 colecciones en Firestore      │
│ ✓ Importa 5+ usuarios                  │
│ ✓ Carga pacientes y citas              │
│ ✓ Configura roles y permisos           │
│                                         │
│                   [Abrir Panel →]      │
└─────────────────────────────────────────┘
```

### En Panel Admin:
```
┌──────────────────────────────────────┐
│ 🔧 Panel de Administración            │
│                                       │
│ 🚀 Inicializar Base de Datos         │
│ 📊 Estadísticas                       │
│ ⚠️  Zona de Peligro                   │
│                                       │
│ [🚀 Inicializar] [🔄 Actualizar]    │
└──────────────────────────────────────┘
```

---

## 🔐 Control de Acceso

### ✅ VERÁS la opción si eres:
- **Administrador** (juan.perez@clinica.cl)
- **Recepcionista** (carlos.ramirez@clinica.cl)

### ❌ NO VERÁS la opción si eres:
- **Profesional** (maria.silva@clinica.cl)
- **Paciente** (usuario común)

---

## 🎓 ¿Qué Hace el Panel?

Cuando hagas clic en **"Inicializar Base de Datos"**, el sistema:

1. ✅ Crea 6 colecciones en Firestore:
   - `usuarios` - Perfiles de usuarios
   - `pacientes` - Datos de pacientes
   - `citas` - Agendamiento de citas
   - `modulos` - Templates de calendarios
   - `plantillas` - Templates de módulos
   - `settings` - Configuración del sistema

2. ✅ Importa 5 usuarios con autenticación:
   - juan.perez@clinica.cl (Admin)
   - carlos.ramirez@clinica.cl (Recepcionista)
   - maria.silva@clinica.cl (Profesional)
   - patricia.torres@clinica.cl (Profesional)
   - manuel.garcia@clinica.cl (Profesional)

3. ✅ Carga datos iniciales:
   - 12 pacientes de ejemplo
   - 28 citas agendadas
   - 34 módulos/slots
   - 8 plantillas

4. ✅ Configura permisos:
   - Roles por usuario
   - Accesos a secciones
   - Permisos de lectura/escritura

---

## ⏱️ Tiempo Estimado

| Paso | Duración |
|------|----------|
| 1-3: Login y Navegación | 1-2 min |
| 4: Encontrar tab Admin | 30 seg |
| 5: Abrir Panel | 30 seg |
| 6: Inicializar BD | 30-60 seg |
| **TOTAL** | **3-4 min** |

---

## 🆘 Solución de Problemas

### ❌ Problema: No veo tab "🔧 Administración"
**Solución**: 
1. Verifica estar logueado como admin
2. Actualiza la página (F5)
3. Comprueba que el email sea: `juan.perez@clinica.cl`

### ❌ Problema: No funciona el botón "Abrir Panel"
**Solución**:
1. Abre manualmente: http://localhost:3001/admin/init-database
2. Si pide login, vuelve a iniciar sesión

### ❌ Problema: Veo error en "/admin/init-database"
**Solución**:
1. Vuelve a `/login`
2. Inicia sesión nuevamente
3. Intenta acceder de nuevo

### ❌ Problema: El puerto 3000 está en uso
**Solución**:
1. El servidor usa puerto 3001 automáticamente
2. Accede a: http://localhost:3001/login (no 3000)

---

## 📞 Contacto/Ayuda

Si algo no funciona:
1. Verifica que estés en: http://localhost:3001 (no :3000)
2. Comprueba el navegador tiene JavaScript habilitado
3. Abre Console (F12) para ver errores
4. Reinicia el servidor: `npm run dev`

---

## 📚 Más Información

Para información técnica detallada, ve:
- 📖 `ACCESO_ADMIN_CONFIGURACIONES.md`
- 📖 `GUIA_VISUAL_ADMIN_PANEL.md`
- 📖 `RESUMEN_ACCESO_ADMIN.md`

---

**¡Listo para empezar!** 🎉

Abre: http://localhost:3001/login y comienza.
