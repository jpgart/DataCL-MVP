#!/bin/bash
# Script para hacer push del proyecto a GitHub

echo "🚀 Configurando repositorio remoto y haciendo push..."

# Reemplaza 'TU_USUARIO' con tu nombre de usuario de GitHub
# Reemplaza 'DataCL' con el nombre que le diste al repositorio
GITHUB_USER="TU_USUARIO"
REPO_NAME="DataCL"

# Agregar el remote (solo la primera vez)
git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git 2>/dev/null || echo "Remote ya existe"

# Cambiar a la rama main (si estás en otra)
git branch -M main

# Hacer push
echo "📤 Haciendo push a GitHub..."
git push -u origin main

echo "✅ ¡Push completado exitosamente!"
echo "🌐 Visita: https://github.com/${GITHUB_USER}/${REPO_NAME}"

