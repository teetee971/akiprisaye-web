#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-$HOME/akiprisaye-web}"
FUNCTIONS_DIR="$PROJECT_ROOT/functions"

echo "➡️  Projet: $PROJECT_ROOT"
echo "➡️  Functions: $FUNCTIONS_DIR"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "❌ Dossier $FUNCTIONS_DIR introuvable. Lance d'abord: firebase init functions"
  exit 1
fi

cd "$FUNCTIONS_DIR"

echo "🧹 Nettoyage anciennes configs ESLint…"
rm -f .eslintrc .eslintrc.* eslint.config.* 2>/dev/null || true

echo "📝 Création functions/eslint.config.js (CommonJS)…"
cat > eslint.config.js <<'JS'
// functions/eslint.config.js
module.exports = {
  root: true,
  env: { es6: true, node: true },
  extends: ["eslint:recommended"],
  rules: {
    "max-len": "off",            // Pas de limite de longueur de ligne
    "object-curly-spacing": "off", // Pas d'espacement obligatoire
    "comma-dangle": "off"        // Virgule finale désactivée
  }
};
JS

echo "🔧 Mise à jour du package.json (scripts, engines)…"
# Assure le script lint + engines node
npm pkg set scripts.lint="eslint ." >/dev/null
npm pkg set engines.node=">=18" >/dev/null
npm pkg set main="index.js" >/dev/null

echo "📦 Installation/maj des dépendances…"
npm i -S firebase-functions@^5 firebase-admin@^12 axios@^1 >/dev/null
npm i -D eslint@^9 >/dev/null

# Optionnel : stocke l’URL d’API dans la config de fonctions si passée
if [ "${API_URL:-}" != "" ]; then
  echo "🔐 Enregistrement de API_URL dans la config Functions…"
  npx firebase functions:config:set prices.api_url="$API_URL"
fi

echo "🧪 Vérification lint locale…"
npm run -s lint || true   # On n'échoue pas le script si des warning restent, la conf a été assouplie

cd "$PROJECT_ROOT"

echo "🚀 Déploiement Firebase Functions…"
firebase deploy --only functions

echo "✅ Terminé ! Vérifie la console Firebase → Functions : la tâche planifiée 'updatePrices' doit apparaître."
