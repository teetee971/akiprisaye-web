#!/data/data/com.termux/files/usr/bin/bash
# =====================================================
# 🚀 Script complet de déploiement auto vers Cloudflare Pages
# - git add + commit + push
# - surveillance du déploiement Cloudflare Pages
# - notification sonore sur succès ou échec
# =====================================================

# Message par défaut si aucun n’est fourni
MESSAGE=${1:-"🔄 Mise à jour auto"}

# Nom du projet Cloudflare Pages
PROJECT="akiprisaye"

# -----------------------------------------------------
# Étape 1 : Push GitHub
# -----------------------------------------------------
echo "📂 Ajout des fichiers..."
git add .

echo "📝 Commit en cours..."
git commit -m "$MESSAGE" || echo "⚠️ Aucun changement à valider."

echo "⬆️ Push vers GitHub..."
git push origin main

# -----------------------------------------------------
# Étape 2 : Vérification des outils
# -----------------------------------------------------
if ! command -v wrangler &> /dev/null
then
    echo "❌ Wrangler n’est pas installé. Installe-le avec : npm install -g wrangler"
    exit 1
fi

if ! command -v jq &> /dev/null
then
    echo "❌ jq n’est pas installé. Installe-le avec : pkg install jq -y"
    exit 1
fi

# -----------------------------------------------------
# Étape 3 : Surveillance du déploiement
# -----------------------------------------------------
echo "⏳ Récupération du dernier déploiement Cloudflare Pages..."

DEPLOY_ID=$(wrangler pages deployments $PROJECT --limit 1 --json | jq -r '.[0].id')

if [ -z "$DEPLOY_ID" ]; then
    echo "❌ Impossible de récupérer l’ID du déploiement."
    exit 1
fi

echo "🆔 Dernier déploiement ID : $DEPLOY_ID"
echo "👀 Surveillance en cours..."

# -----------------------------------------------------
# Étape 4 : Boucle de suivi
# -----------------------------------------------------
while true; do
    STATUS=$(wrangler pages deployments $PROJECT --limit 1 --json | jq -r '.[0].latest_stage.status')

    if [[ "$STATUS" == "success" ]]; then
        echo "✅ Déploiement terminé avec succès !"
        termux-vibrate -d 500 2>/dev/null || true
        termux-toast "✅ Déploiement Cloudflare réussi !" 2>/dev/null || true
        termux-notification -t "Cloudflare Deploy" -c "✅ Déploiement réussi !" 2>/dev/null || true
        exit 0
    elif [[ "$STATUS" == "failure" ]]; then
        echo "❌ Déploiement échoué !"
        termux-vibrate -d 1000 2>/dev/null || true
        termux-toast "❌ Déploiement échoué !" 2>/dev/null || true
        termux-notification -t "Cloudflare Deploy" -c "❌ Déploiement échoué !" 2>/dev/null || true
        exit 1
    else
        echo "⏳ En cours... (statut actuel : $STATUS)"
    fi

    sleep 10
done
