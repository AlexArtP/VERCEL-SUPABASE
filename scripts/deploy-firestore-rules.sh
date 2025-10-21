#!/bin/bash

# Script para desplegar reglas de Firestore
# Uso: ./scripts/deploy-firestore-rules.sh

set -e  # Exit on error

echo "🚀 Iniciando despliegue de reglas de Firestore..."

# Verificar que Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI no está instalado."
    echo "Instálalo con: npm install -g firebase-tools"
    exit 1
fi

# Verificar que el archivo de reglas existe
if [ ! -f "firestore.rules" ]; then
    echo "❌ El archivo firestore.rules no existe en la raíz del proyecto."
    exit 1
fi

# Verificar que firebase.json existe
if [ ! -f "firebase.json" ]; then
    echo "❌ El archivo firebase.json no existe."
    exit 1
fi

# Validar las reglas sintácticamente
echo "✓ Validando reglas de Firestore..."
firebase deploy --only firestore:rules --dry-run

# Si la validación pasó, preguntar confirmación
read -p "¿Deseas publicar las reglas? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "📤 Publicando reglas..."
    firebase deploy --only firestore:rules
    echo "✅ ¡Reglas publicadas exitosamente!"
else
    echo "⏭️  Operación cancelada."
    exit 0
fi
