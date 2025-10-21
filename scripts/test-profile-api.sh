#!/usr/bin/env bash
# Script de pruebas E2E para la API de perfil
# Uso: ./scripts/test-profile-api.sh [PORT]
# Por defecto usa puerto 3000; puedes pasar otro puerto como argumento.

set -e

PORT="${1:-3000}"
BASE_URL="http://127.0.0.1:${PORT}"

echo "🧪 Probando API de perfil en ${BASE_URL}"
echo ""

# Test 1: GET /api/profile?id=1
echo "1️⃣  GET /api/profile?id=1"
RESPONSE=$(curl -s "${BASE_URL}/api/profile?id=1")
NOMBRE=$(echo "$RESPONSE" | jq -r '.nombre // empty')

if [ -z "$NOMBRE" ]; then
  echo "❌ Error: no se recibió 'nombre' en la respuesta"
  exit 1
fi

echo "✅ OK: nombre = ${NOMBRE}"
echo ""

# Test 2: PUT /api/profile
echo "2️⃣  PUT /api/profile (actualizar nombre)"
NEW_NAME="Test E2E $(date +%s)"
PUT_RESPONSE=$(curl -s -X PUT -H 'content-type: application/json' \
  -d "{\"id\":1,\"nombre\":\"${NEW_NAME}\"}" \
  "${BASE_URL}/api/profile")

UPDATED_NAME=$(echo "$PUT_RESPONSE" | jq -r '.nombre // empty')

if [ "$UPDATED_NAME" != "$NEW_NAME" ]; then
  echo "❌ Error: nombre no se actualizó correctamente"
  echo "   Esperado: ${NEW_NAME}"
  echo "   Recibido: ${UPDATED_NAME}"
  exit 1
fi

echo "✅ OK: nombre actualizado a '${UPDATED_NAME}'"
echo ""

# Test 3: GET después de PUT
echo "3️⃣  GET /api/profile?id=1 (verificar persistencia)"
VERIFY_RESPONSE=$(curl -s "${BASE_URL}/api/profile?id=1")
VERIFY_NAME=$(echo "$VERIFY_RESPONSE" | jq -r '.nombre // empty')

if [ "$VERIFY_NAME" != "$NEW_NAME" ]; then
  echo "❌ Error: el cambio no persiste en GET posterior"
  exit 1
fi

echo "✅ OK: cambio persiste correctamente"
echo ""

# Test 4: Validación de error (id faltante)
echo "4️⃣  GET /api/profile sin id (debe devolver 400)"
ERROR_RESPONSE=$(curl -s -w "%{http_code}" "${BASE_URL}/api/profile")
HTTP_CODE="${ERROR_RESPONSE: -3}"

if [ "$HTTP_CODE" != "400" ]; then
  echo "❌ Error: esperaba HTTP 400, recibió ${HTTP_CODE}"
  exit 1
fi

echo "✅ OK: validación correcta (HTTP 400)"
echo ""

# Test 5: GET de la página HTML /profile/1
echo "5️⃣  GET /profile/1 (HTML)"
HTML_RESPONSE=$(curl -s "${BASE_URL}/profile/1")
if echo "$HTML_RESPONSE" | grep -q '<html'; then
  echo "✅ OK: HTML recibido correctamente"
else
  echo "❌ Error: no se recibió HTML válido"
  exit 1
fi

echo ""
echo "🎉 Todas las pruebas pasaron exitosamente"
