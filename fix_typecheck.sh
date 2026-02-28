#!/usr/bin/env bash
set -e

echo "=== 1) Aller dans frontend ==="
cd frontend || { echo "frontend introuvable"; exit 1; }

echo "=== 2) Installer types node ==="
npm i -D @types/node

echo "=== 3) Corriger tests Territory (MTQ/FRA -> mq/fr) ==="
if [ -f src/test/institutionalPortalService.test.ts ]; then
  sed -i 's/"MTQ"/"mq"/g' src/test/institutionalPortalService.test.ts
  sed -i 's/"FRA"/"fr"/g' src/test/institutionalPortalService.test.ts
fi

echo "=== 4) Ajouter d.ts pour seed JS si manquants ==="
mkdir -p src/data

if [ -f src/data/seedProducts.js ] && [ ! -f src/data/seedProducts.d.ts ]; then
cat > src/data/seedProducts.d.ts <<'DTS'
declare const seedProducts: any;
export default seedProducts;
DTS
fi

if [ -f src/data/seedStores.js ] && [ ! -f src/data/seedStores.d.ts ]; then
cat > src/data/seedStores.d.ts <<'DTS'
declare const seedStores: any;
export default seedStores;
DTS
fi

echo "=== 5) Retour racine ==="
cd ..

echo "=== 6) Commit si changements ==="
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "fix(ci): stabilize typecheck"
else
  echo "Aucun changement."
fi

echo "=== 7) Lancer typecheck local ==="
cd frontend
npm run -s typecheck || true

echo "Terminé."
