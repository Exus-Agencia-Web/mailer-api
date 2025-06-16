#!/bin/bash

clear 

echo "::"
echo "Actualizando la versión del proyecto..."
echo ""
echo ""

# Validar si jq está instalado
if ! command -v jq &> /dev/null
then
    echo "Error: jq no está instalado. Por favor instálalo para continuar."
    exit 1
fi

# Ruta al package.json (ajustar si es necesario)
PACKAGE_FILE="source/package.json"

# Leer la versión actual
CURRENT_VERSION=$(jq -r .version "$PACKAGE_FILE")

# Separar en partes: major.minor.patch
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Incrementar el patch
PATCH=$((PATCH + 1))

# Nueva versión
NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# Actualizar el package.json con la nueva versión
jq --arg v "$NEW_VERSION" '.version = $v' "$PACKAGE_FILE" > tmp.$$.json && mv tmp.$$.json "$PACKAGE_FILE"

echo "Versión actualizada: $CURRENT_VERSION → $NEW_VERSION"
echo ""
echo ""

# Hacer commit y push
git add -A
git commit -m "Versión actualizada: $CURRENT_VERSION → $NEW_VERSION"
git push
echo ""
echo ""

echo "Commit y push realizados."
echo ""
echo ""
