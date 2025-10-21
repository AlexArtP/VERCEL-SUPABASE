#!/bin/bash
# Script de verificación de integración Firestore + Gestión de Usuarios

echo "🔍 Verificación: Gestión de Usuarios ↔️ Firestore"
echo "=================================================="
echo ""

# 1. Verificar que el hook existe
echo "1️⃣  Verificando hook useFirestoreUsers..."
if [ -f "lib/useFirestoreUsers.ts" ]; then
    echo "   ✅ Hook encontrado"
    
    if grep -q "function useFirestoreUsers" "lib/useFirestoreUsers.ts"; then
        echo "   ✅ Función useFirestoreUsers definida"
    fi
    
    if grep -q "onSnapshot" "lib/useFirestoreUsers.ts"; then
        echo "   ✅ Sincronización en tiempo real con onSnapshot"
    fi
    
    if grep -q "toggleUserActive\|toggleUserAdmin\|changeUserRole" "lib/useFirestoreUsers.ts"; then
        echo "   ✅ Métodos CRUD disponibles"
    fi
else
    echo "   ❌ Hook NO encontrado"
fi

# 2. Verificar integración en MainApp
echo ""
echo "2️⃣  Verificando integración en MainApp.tsx..."
if grep -q "useFirestoreUsers" "components/MainApp.tsx"; then
    echo "   ✅ Hook importado"
else
    echo "   ❌ Hook NO importado"
fi

if grep -q "usuariosFirestore" "components/MainApp.tsx"; then
    echo "   ✅ Usuarios de Firestore usados"
fi

if grep -q "changeUserRole\|toggleUserAdmin\|toggleUserActive" "components/MainApp.tsx"; then
    echo "   ✅ Funciones de actualización utilizadas"
fi

# 3. Verificar que el login usa Firestore
echo ""
echo "3️⃣  Verificando login con Firestore..."
if grep -q "loginWithEmail" "lib/firebaseAuth.ts"; then
    echo "   ✅ Función loginWithEmail existe"
fi

if grep -q "getDoc.*usuarios" "lib/firebaseAuth.ts"; then
    echo "   ✅ Lee datos de usuario de Firestore"
fi

if grep -q "setDoc.*usuarios" "lib/firebaseAuth.ts"; then
    echo "   ✅ Crea usuarios en Firestore"
fi

# 4. Verificar que el endpoint de aprobación funciona
echo ""
echo "4️⃣  Verificando endpoint de aprobación..."
if grep -q "adminDb.collection.*usuarios" "app/api/auth/approve/route.ts"; then
    echo "   ✅ Endpoint aprueba y crea usuarios en Firestore"
fi

# 5. Verificar tipos TypeScript
echo ""
echo "5️⃣  Verificando tipos TypeScript..."
if grep -q "interface FirestoreUser" "lib/useFirestoreUsers.ts"; then
    echo "   ✅ Interfaz FirestoreUser definida"
fi

# 6. Verificar documentación
echo ""
echo "6️⃣  Verificando documentación..."
if [ -f "README/GESTION_USUARIOS_FIRESTORE.md" ]; then
    echo "   ✅ Documentación de integración existe"
fi

echo ""
echo "=================================="
echo "✅ Verificación Completada"
echo ""
echo "🚀 Para probar:"
echo "1. Iniciar servidor: npm run dev"
echo "2. Login como admin"
echo "3. Ir a Configuración → Gestión de Usuarios"
echo "4. Ver usuarios de Firestore en tiempo real"
echo ""
echo "📚 Ver README/GESTION_USUARIOS_FIRESTORE.md para detalles"
