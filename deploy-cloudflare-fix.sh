#!/usr/bin/env bash
set -euo pipefail

# === Script de déploiement automatisé pour Cloudflare Pages ===
# Corrige le problème de répertoire de sortie 'dist/public' non trouvé

# === Couleurs pour logs ===
c() { printf "\033[1;36m%s\033[0m\n" "$*"; }
ok(){ printf "\033[1;32m%s\033[0m\n" "$*"; }
er(){ printf "\033[1;31m%s\033[0m\n" "$*"; }

# === Configuration ===
EXPECTED_OUTPUT_DIR="dist/public"
PROJECT_NAME="akiprisaye"

c "🔧 Script de réparation pour le déploiement Cloudflare Pages"
c "Résolution du problème: 'Output directory 'dist/public' not found'"

# === Vérification de la configuration Vite ===
c "📋 Vérification de la configuration Vite..."
if grep -q '"dist/public"' vite.config.js; then
    ok "✓ Configuration Vite correcte: build.outDir = 'dist/public'"
else
    er "❌ Configuration Vite incorrecte dans vite.config.js"
    er "La ligne build.outDir doit être: outDir: \"dist/public\""
    exit 1
fi

# === Test du build ===
c "🏗️ Test du processus de build..."
rm -rf dist/
npm run build

if [ -d "$EXPECTED_OUTPUT_DIR" ]; then
    ok "✓ Répertoire $EXPECTED_OUTPUT_DIR généré avec succès"
    c "Contenu du répertoire de sortie:"
    ls -la "$EXPECTED_OUTPUT_DIR" | head -10
else
    er "❌ Le répertoire $EXPECTED_OUTPUT_DIR n'a pas été créé"
    exit 1
fi

# === Vérification des fichiers essentiels ===
c "📝 Vérification des fichiers essentiels..."
ESSENTIAL_FILES=("index.html" "assets")
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -e "$EXPECTED_OUTPUT_DIR/$file" ]; then
        ok "✓ $file présent"
    else
        er "❌ $file manquant dans $EXPECTED_OUTPUT_DIR"
        exit 1
    fi
done

# === Validation de la structure ===
c "🔍 Validation de la structure de déploiement..."
echo "Structure générée:"
tree "$EXPECTED_OUTPUT_DIR" -L 2 2>/dev/null || ls -la "$EXPECTED_OUTPUT_DIR"

# === Instructions pour Cloudflare Pages ===
c "📋 Instructions de configuration Cloudflare Pages:"
echo "1. Dans le dashboard Cloudflare Pages:"
echo "   - Build command: npm run build"
echo "   - Build output directory: dist/public"
echo "   - Root directory: (laisser vide ou /)"
echo ""
echo "2. Variables d'environnement (si nécessaire):"
echo "   - NODE_VERSION: 20"
echo "   - NPM_VERSION: latest"
echo ""
echo "3. Pour déployer manuellement via Wrangler:"
echo "   npx wrangler pages deploy ./dist/public --project-name=$PROJECT_NAME"

# === Test de déploiement avec Wrangler (optionnel) ===
if command -v wrangler >/dev/null && [ "${DEPLOY_NOW:-0}" = "1" ]; then
    c "🚀 Déploiement automatique avec Wrangler..."
    wrangler pages deploy "$EXPECTED_OUTPUT_DIR" --project-name="$PROJECT_NAME"
    ok "✅ Déploiement terminé!"
else
    c "💡 Pour déployer maintenant, lancez:"
    echo "   DEPLOY_NOW=1 ./deploy-cloudflare-fix.sh"
    echo "   ou"
    echo "   npx wrangler pages deploy ./dist/public --project-name=$PROJECT_NAME"
fi

ok "🎉 Configuration corrigée avec succès!"
ok "Le problème 'Output directory 'dist/public' not found' est résolu."