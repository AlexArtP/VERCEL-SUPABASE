#!/bin/bash
# Script de prueba para validación de RUN
# Prueba el endpoint /api/auth/register con diferentes casos

echo "🧪 Pruebas de Validación de RUN"
echo "=================================="
echo ""

API_URL="http://localhost:3002/api/auth/register"

# Función auxiliar para hacer requests
test_register() {
  local test_name="$1"
  local run="$2"
  local should_pass="$3"
  
  echo "Test: $test_name"
  echo "RUN: $run"
  
  response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"nombre\": \"Test User\",
      \"apellidoPaterno\": \"Test\",
      \"apellidoMaterno\": \"Prueba\",
      \"run\": \"$run\",
      \"email\": \"test-${RANDOM}@example.com\",
      \"password\": \"TestPass123\",
      \"confirmPassword\": \"TestPass123\",
      \"profesion\": \"Médico\",
      \"telefono\": \"987654321\"
    }")
  
  success=$(echo "$response" | grep -o '"success":true' || true)
  
  if [ "$should_pass" = "yes" ] && [ -n "$success" ]; then
    echo "✅ PASS - Registró correctamente"
  elif [ "$should_pass" = "no" ] && [ -z "$success" ]; then
    echo "❌ FAIL - Rechazó el registro (como se esperaba)"
    echo "Mensaje: $(echo "$response" | grep -o '"message":"[^"]*' | cut -d'"' -f4)"
  else
    echo "❌ FAIL - Resultado inesperado"
    echo "Respuesta: $response"
  fi
  
  echo ""
}

# Prueba 1: RUN con formato correcto
test_register "RUN formato correcto" "12345678-9" "yes"

# Prueba 2: RUN sin guion
test_register "RUN sin guion" "123456789" "yes"

# Prueba 3: RUN con espacios
test_register "RUN con espacios" "12345678 9" "yes"

# Prueba 4: RUN con puntos
test_register "RUN con puntos" "12.345.678-9" "yes"

# Prueba 5: RUN con letra K mayúscula
test_register "RUN con letra K" "12345678-K" "yes"

# Prueba 6: RUN inválido (muy pocos dígitos)
test_register "RUN inválido - pocos dígitos" "1234567-9" "no"

# Prueba 7: RUN inválido (demasiados dígitos)
test_register "RUN inválido - muchos dígitos" "123456789-0" "no"

# Prueba 8: RUN con letra minúscula (debe formatear a mayúscula)
test_register "RUN con letra k minúscula" "12345678-k" "yes"

# Prueba 9: RUN vacío
test_register "RUN vacío" "" "no"

echo "🏁 Pruebas completadas"
echo ""
echo "ℹ️  Para pruebas manuales, abre: http://localhost:3002/register"
