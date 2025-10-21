#!/bin/bash
# Verificación rápida de implementación de validación de RUN

echo "🔍 Verificación de Implementación - Validación de RUN"
echo "=================================================="
echo ""

# 1. Verificar que las funciones existen
echo "1️⃣  Verificando funciones de formateo..."
if grep -q "function formatearRun" "app/api/auth/register/route.ts"; then
    echo "   ✅ formatearRun() definida"
else
    echo "   ❌ formatearRun() NO encontrada"
fi

if grep -q "function validarRun" "app/api/auth/register/route.ts"; then
    echo "   ✅ validarRun() definida"
else
    echo "   ⚠️  validarRun() no encontrada (opcional)"
fi

# 2. Verificar validación de RUN
echo ""
echo "2️⃣  Verificando validación de RUN..."
if grep -q "const runFormateado = formatearRun" "app/api/auth/register/route.ts"; then
    echo "   ✅ Se valida RUN antes de usar"
else
    echo "   ❌ No se valida RUN"
fi

if grep -q "if (!runFormateado)" "app/api/auth/register/route.ts"; then
    echo "   ✅ Se verifica RUN válido"
else
    echo "   ❌ No se verifica validez de RUN"
fi

# 3. Verificar búsqueda de duplicados en solicitudes
echo ""
echo "3️⃣  Verificando detección de duplicados en solicitudes..."
if grep -q "where('run', '==', runFormateado)" "app/api/auth/register/route.ts"; then
    echo "   ✅ Se busca RUN en solicitudes"
else
    echo "   ❌ No se busca RUN en solicitudes"
fi

if grep -q "'Este RUN ya tiene una solicitud'" "app/api/auth/register/route.ts"; then
    echo "   ✅ Mensaje de error para solicitud duplicada"
else
    echo "   ❌ Falta mensaje de error"
fi

# 4. Verificar búsqueda de duplicados en usuarios
echo ""
echo "4️⃣  Verificando detección de duplicados en usuarios..."
if grep -q "collection(db, 'usuarios'), where('run'" "app/api/auth/register/route.ts"; then
    echo "   ✅ Se busca RUN en usuarios"
else
    echo "   ❌ No se busca RUN en usuarios"
fi

if grep -q "'Este RUN ya está registrado en el sistema'" "app/api/auth/register/route.ts"; then
    echo "   ✅ Mensaje de error para usuario existente"
else
    echo "   ❌ Falta mensaje de error"
fi

# 5. Verificar que se guarda RUN formateado
echo ""
echo "5️⃣  Verificando que se guarda RUN formateado..."
if grep -A2 "const solicitudData = {" "app/api/auth/register/route.ts" | grep -q "run: runFormateado"; then
    echo "   ✅ Se guarda RUN formateado"
else
    echo "   ⚠️  Revisar que se guarde RUN formateado"
fi

# 6. Verificar documentación
echo ""
echo "6️⃣  Verificando documentación..."
if [ -f "README/VALIDACION_RUN.md" ]; then
    echo "   ✅ Documentación detallada existe"
else
    echo "   ⚠️  Falta documentación"
fi

if [ -f "README/RESUMEN_VALIDACION_RUN.md" ]; then
    echo "   ✅ Resumen ejecutivo existe"
else
    echo "   ⚠️  Falta resumen"
fi

# 7. Verificar que compiló
echo ""
echo "7️⃣  Verificando compilación..."
if grep -r "Compiled successfully" .next/build-manifest.json 2>/dev/null | grep -q "true"; then
    echo "   ✅ Build exitoso (si está disponible)"
elif npm run build 2>&1 | grep -q "Compiled successfully"; then
    echo "   ✅ Build compiló sin errores"
else
    echo "   ⚠️  Ejecuta: npm run build"
fi

echo ""
echo "=================================="
echo "✅ Verificación completada"
echo ""
echo "📋 Casos de Prueba Recomendados:"
echo "1. Entrar a http://localhost:3002/register"
echo "2. Ingresar RUN: 12345678-9"
echo "3. Completar formulario y enviar"
echo "4. Intentar ingresar el mismo RUN nuevamente"
echo "5. Verificar que rechaza con mensaje: 'RUN ya tiene una solicitud'"
echo ""
echo "📚 Ver documentación en README/VALIDACION_RUN.md"
