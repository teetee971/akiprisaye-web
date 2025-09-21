#!/bin/bash

# Script de configuration initiale pour A KI PRI SA YÉ Admin
# Ce script aide à créer le premier utilisateur administrateur

echo "🔐 Configuration Admin - A KI PRI SA YÉ"
echo "======================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé."
    echo "   Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI détecté"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Vous devez être connecté à Firebase."
    echo "   Exécutez: firebase login"
    exit 1
fi

echo "✅ Utilisateur Firebase connecté"

# Get project ID
PROJECT_ID=$(firebase use --json 2>/dev/null | jq -r '.result.project' 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Aucun projet Firebase configuré dans ce dossier."
    echo "   Exécutez: firebase use --add"
    exit 1
fi

echo "✅ Projet: $PROJECT_ID"
echo ""

# Deploy functions first
echo "📦 Déploiement des Cloud Functions..."
if firebase deploy --only functions; then
    echo "✅ Cloud Functions déployées"
else
    echo "❌ Erreur lors du déploiement des fonctions"
    exit 1
fi

echo ""

# Deploy Firestore rules
echo "🛡️ Déploiement des règles Firestore..."
if firebase deploy --only firestore:rules; then
    echo "✅ Règles Firestore déployées"
else
    echo "❌ Erreur lors du déploiement des règles"
    exit 1
fi

echo ""

# Get function URL
REGION="us-central1"  # Default region
FUNCTION_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/createFirstAdmin"

echo "👤 Création du premier utilisateur admin"
echo "======================================="
echo ""

# Prompt for admin details
read -p "Email de l'administrateur: " ADMIN_EMAIL
read -s -p "Mot de passe (min. 6 caractères): " ADMIN_PASSWORD
echo ""
echo ""

# Validate input
if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Email et mot de passe requis"
    exit 1
fi

if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
    echo "❌ Le mot de passe doit contenir au moins 6 caractères"
    exit 1
fi

# Create admin user
echo "🔄 Création de l'utilisateur admin..."

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"secretKey\": \"AKIPRISAYE_BOOTSTRAP_2025\"
  }")

# Check if response contains success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Utilisateur admin créé avec succès!"
    echo ""
    echo "📋 Détails de connexion:"
    echo "   Email: $ADMIN_EMAIL"
    echo "   URL Admin: https://$PROJECT_ID.web.app/admin.html"
    echo ""
    echo "🚀 Déploiement du site web..."
    
    if firebase deploy --only hosting; then
        echo "✅ Site web déployé avec succès!"
        echo ""
        echo "🎉 Configuration terminée!"
        echo "   Accédez à l'interface admin: https://$PROJECT_ID.web.app/admin.html"
    else
        echo "❌ Erreur lors du déploiement du site"
        echo "   Déployez manuellement avec: firebase deploy --only hosting"
    fi
else
    echo "❌ Erreur lors de la création de l'utilisateur admin"
    echo "Réponse du serveur: $RESPONSE"
    echo ""
    echo "💡 Vérifiez que:"
    echo "   - Les Cloud Functions sont bien déployées"
    echo "   - La configuration Firebase est correcte"
    echo "   - L'email n'existe pas déjà"
fi

echo ""
echo "📚 Pour plus d'informations, consultez README_ADMIN.md"