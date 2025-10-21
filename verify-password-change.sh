#!/bin/bash
# Script de Verificación: Forzar Cambio de Contraseña al Primer Login
# Este script verifica que todos los archivos y configuraciones estén en lugar

echo "🔍 Verificando implementación de cambio forzado de contraseña..."
echo ""

# 1. Verificar que el endpoint de cambio de contraseña existe
echo "1️⃣  Verificando endpoint /api/auth/change-password..."
if [ -f "app/api/auth/change-password/route.ts" ]; then
    echo "   ✅ Archivo encontrado"
else
    echo "   ❌ Archivo NO encontrado"
fi

# 2. Verificar que el modal existe
echo ""
echo "2️⃣  Verificando componente ForcePasswordChangeModal..."
if [ -f "components/ForcePasswordChangeModal.tsx" ]; then
    echo "   ✅ Archivo encontrado"
else
    echo "   ❌ Archivo NO encontrado"
fi

# 3. Verificar que el endpoint de aprobación tiene el flag
echo ""
echo "3️⃣  Verificando que /api/auth/approve establece cambioPasswordRequerido..."
if grep -q "cambioPasswordRequerido: true" "app/api/auth/approve/route.ts"; then
    echo "   ✅ Flag encontrado en aprobación"
else
    echo "   ❌ Flag NO encontrado en aprobación"
fi

# 4. Verificar que MainApp importa el modal
echo ""
echo "4️⃣  Verificando que MainApp importa ForcePasswordChangeModal..."
if grep -q "ForcePasswordChangeModal" "components/MainApp.tsx"; then
    echo "   ✅ Importación encontrada"
else
    echo "   ❌ Importación NO encontrada"
fi

# 5. Verificar que firebaseAuth incluye el flag
echo ""
echo "5️⃣  Verificando que firebaseAuth incluye cambioPasswordRequerido..."
if grep -q "cambioPasswordRequerido" "lib/firebaseAuth.ts"; then
    echo "   ✅ Flag incluido en token"
else
    echo "   ❌ Flag NO incluido en token"
fi

# 6. Verificar que app/page.tsx obtiene el token de Firebase
echo ""
echo "6️⃣  Verificando que app/page.tsx obtiene token de Firebase..."
if grep -q "sistema_auth_token" "app/page.tsx"; then
    echo "   ✅ Token de Firebase detectado"
else
    echo "   ❌ Token NO detectado"
fi

echo ""
echo "================================"
echo "✅ Verificación completada"
echo ""
echo "Próximos pasos:"
echo "1. Iniciar servidor: npm run dev"
echo "2. Ir a http://localhost:3000/login"
echo "3. Registrar nuevo usuario en /register"
echo "4. Aprobar como admin"
echo "5. Login con el nuevo usuario"
echo "6. Cambiar contraseña en el modal"
echo ""
echo "📚 Ver README/FORZAR_CAMBIO_PASSWORD.md para instrucciones completas"
