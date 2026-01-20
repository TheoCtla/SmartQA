#!/bin/bash

# Script de démarrage SmartQA
# Lance le backend et le frontend simultanément

# Sauvegarder le répertoire racine
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Démarrage de SmartQA..."

# Vérifier si le fichier .env existe
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    echo "⚠️  Fichier backend/.env manquant!"
    echo "   Crée-le avec : echo 'GEMINI_API_KEY=ta_cle_api' > backend/.env"
    exit 1
fi

# Lancer le backend en arrière-plan
echo "Démarrage du backend sur http://localhost:3001..."
cd "$ROOT_DIR/backend" && npm start &
BACKEND_PID=$!

# Attendre un peu que le backend démarre
sleep 2

# Lancer le frontend
echo "Démarrage du frontend sur http://localhost:5173..."
cd "$ROOT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "SmartQA est prêt !"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:3001"
echo ""
echo "Pour arrêter : Ctrl+C"

# Attendre les deux processus
wait $BACKEND_PID $FRONTEND_PID
