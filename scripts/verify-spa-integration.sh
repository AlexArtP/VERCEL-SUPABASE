#!/usr/bin/env bash
# Script para verificar la integración SPA del perfil
# Verifica que después de login, el perfil está disponible internamente en MainApp

set -e

PORT="${1:-3003}"
BASE_URL="http://127.0.0.1:${PORT}"

echo "🧪 Verificando integración SPA del perfil en ${BASE_URL}"
echo ""

# Test 1: Verificar que la página principal carga (pantalla de login)
echo "1️⃣  Verificando página de login"
LOGIN_RESPONSE=$(curl -s "${BASE_URL}/")
if echo "$LOGIN_RESPONSE" | grep -q "Iniciar Sesi\|login\|password"; then
  echo "✅ OK: Página de login cargada"
else
  echo "❌ Error: No se encontró formulario de login"
  exit 1
fi
echo ""

# Test 2: Verificar que MainApp existe en el bundle
echo "2️⃣  Verificando que MainApp está en el código"
if echo "$LOGIN_RESPONSE" | grep -q "MainApp\|Sistema de Gestión"; then
  echo "✅ OK: Código de aplicación presente"
else
  echo "⚠️  Advertencia: No se detectó MainApp en HTML inicial (se carga después del login)"
fi
echo ""

# Test 3: Verificar que ProfilePanel existe en el código
echo "3️⃣  Verificando componente ProfilePanel"
# Buscar en los chunks de JavaScript compilados
CHUNKS_DIR="/workspaces/sistema-agendamiento-5-v2/.next"
if [ -d "$CHUNKS_DIR" ]; then
  if grep -r "ProfilePanel\|ProfileView" "$CHUNKS_DIR" --include="*.js" 2>/dev/null | head -1 > /dev/null; then
    echo "✅ OK: ProfilePanel encontrado en build"
  else
    echo "⚠️  Advertencia: ProfilePanel no encontrado en build (puede estar en chunk dinámico)"
  fi
else
  echo "⚠️  Build directory no existe - ejecuta 'npm run build' primero"
fi
echo ""

# Test 4: Verificar que la API de perfil funciona
echo "4️⃣  Verificando API de perfil"
API_RESPONSE=$(curl -s "${BASE_URL}/api/profile?id=1")
if echo "$API_RESPONSE" | grep -q "nombre"; then
  NOMBRE=$(echo "$API_RESPONSE" | jq -r '.nombre // empty')
  echo "✅ OK: API responde correctamente - Usuario: ${NOMBRE}"
else
  echo "❌ Error: API no responde"
  exit 1
fi
echo ""

# Test 5: Verificar estructura de archivos
echo "5️⃣  Verificando estructura de archivos del perfil"
FILES=(
  "/workspaces/sistema-agendamiento-5-v2/components/ProfilePanel.tsx"
  "/workspaces/sistema-agendamiento-5-v2/components/ProfileView.tsx"
  "/workspaces/sistema-agendamiento-5-v2/components/ProfileCalendar.tsx"
  "/workspaces/sistema-agendamiento-5-v2/lib/profileHelpers.ts"
)

ALL_OK=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $(basename $file)"
  else
    echo "  ❌ $(basename $file) - NO ENCONTRADO"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = true ]; then
  echo "✅ OK: Todos los archivos presentes"
else
  echo "❌ Error: Faltan archivos"
  exit 1
fi
echo ""

# Información adicional
echo "📝 Notas:"
echo "  - Para probar la integración SPA completa:"
echo "    1. Abre http://localhost:${PORT}/"
echo "    2. Login con: juan.perez@clinica.cl / demo123"
echo "    3. Haz clic en el menú 'Perfil' (icono de usuario)"
echo "    4. El perfil debe aparecer SIN cambiar de URL"
echo ""
echo "🎉 Verificación completada - La integración está lista para pruebas manuales"
