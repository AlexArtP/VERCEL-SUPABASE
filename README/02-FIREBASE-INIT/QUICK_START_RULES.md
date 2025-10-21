# 🔐 GUÍA RÁPIDA - Reglas de Firestore

## ¿Cuál es el error?

**Consola:**
```
[code=permission-denied]: Missing or insufficient permissions.
```

**Causa:** Las reglas de Firestore denegaban acceso. Ahora están configuradas.

---

## ✅ SOLUCIÓN - Desplegar Reglas en 2 Minutos

### Opción 1️⃣ Manual (Recomendado primero)

1. Ve a: https://console.firebase.google.com
2. Proyecto: **agendacecosam**
3. Sección: **Firestore Database** → **Rules**
4. Copia todo de este archivo: [`firestore.rules`](../../../firestore.rules)
5. **Pega** en el editor de Firebase Console
6. Click en **Publish** (Publicar)

✅ **¡Listo!** Las reglas están activas

### Opción 2️⃣ Automático (Con CLI)

```bash
# Instalar
npm install -g firebase-tools

# Loguear
firebase login

# Desplegar
firebase deploy --only firestore:rules
```

---

## 🎯 ¿Qué permite cada rol?

### Anónimo (No registrado)
- ✅ Crear solicitud de registro
- ❌ Ver perfiles de usuarios
- ❌ Crear citas

### Usuario (Registrado)
- ✅ Ver su propio perfil
- ✅ Editar su propio perfil
- ✅ Ver/crear/editar sus citas
- ❌ Ver otros usuarios
- ❌ Aprobar solicitudes

### Admin (Administrador)
- ✅ Ver TODOS los perfiles
- ✅ Ver TODAS las solicitudes
- ✅ Aprobar/Rechazar solicitudes
- ✅ Ver logs de auditoría
- ✅ Gestionar TODOS los datos

---

## 📋 Colecciones y Permisos

| Colección | Anónimo | Usuario | Admin |
|-----------|---------|---------|-------|
| `registro_solicitudes` | ✅ C* | ✅ C* | ✅ RWD |
| `usuarios` | ❌ | ✅ R/U** | ✅ RWD |
| `citas` | ❌ | ✅ R/U*** | ✅ RWD |
| `modulos` | ❌ | ✅ R | ✅ RWD |
| `plantillas` | ❌ | ✅ R | ✅ RWD |
| `pacientes` | ❌ | ✅ R/U**** | ✅ RWD |

**Leyenda:** R=Leer, W=Escribir, C=Crear, U=Actualizar, D=Eliminar

*C = Solo su propia solicitud
**R/U = Solo su propio perfil
***R/U = Solo sus citas (como profesional o paciente)
****R/U = Profesionales ven/editan sus pacientes

---

## 🧪 Verificar que Funciona

1. Abre la app: http://localhost:3000
2. Comprueba que NO hay error en consola (F12):
   ```
   [code=permission-denied]
   ```
3. Intenta:
   - ✅ Registrarte sin errores
   - ✅ Loguear como admin
   - ✅ Ver solicitudes pendientes
   - ✅ Aprobar una solicitud

**Si sigue habiendo error:**
1. Abre consola (F12)
2. Busca el error exacto
3. Abre [`FIRESTORE_RULES.md`](./FIRESTORE_RULES.md) → Troubleshooting
4. Sigue los pasos

---

## 📂 Archivos Relacionados

- **Reglas:** [`firestore.rules`](../../../firestore.rules)
- **Documentación completa:** [`FIRESTORE_RULES.md`](./FIRESTORE_RULES.md)
- **Matriz de permisos:** [`FIRESTORE_PERMISSIONS_MATRIX.md`](./FIRESTORE_PERMISSIONS_MATRIX.md)
- **Script automático:** [`scripts/deploy-firestore-rules.sh`](../../../scripts/deploy-firestore-rules.sh)

---

## ⏱️ Pasos siguientes

1. ✅ **Publica las reglas** (sección anterior)
2. ✅ **Recarga la app** (Ctrl+F5 para limpiar caché)
3. ✅ **Verifica en consola** que no hay errores de permisos
4. ✅ **Testa el flujo completo**:
   - Registro → Admin aprueba → Usuario logueado

**¿Preguntas?** Ver [`FIRESTORE_RULES.md`](./FIRESTORE_RULES.md)
