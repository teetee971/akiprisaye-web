#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Vérifications…"
git rev-parse --is-inside-work-tree >/dev/null

# 0) Patterns sensibles à ignorer définitivement
echo "📝 Mise à jour .gitignore…"
cat >> .gitignore <<'EOF'
# Secrets / clés
serviceAccountKey.json
serviceAccountKey.json.json
*.secret.json
*.key.json
*.pem
*.p12
# Fichiers locaux
.env
.env.*
firebase-debug.log
EOF

git add .gitignore || true

# 1) Installe git-filter-repo si absent
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "📦 Installation git-filter-repo via pip…"
  if ! command -v python >/dev/null 2>&1 && ! command -v py >/dev/null 2>&1; then
    echo "❌ Python/pip introuvable. Installe Python (inclure pip), relance puis re-exécute ce script."
    exit 1
  fi
  # essaye py -m pip sinon pip direct
  if command -v py >/dev/null 2>&1; then
    py -m pip install --upgrade pip
    py -m pip install git-filter-repo
  else
    pip install --upgrade pip
    pip install git-filter-repo
  fi
fi

# 2) Purge des chemins sensibles de tout l’historique
echo "🧹 Purge des fichiers sensibles de l’historique…"
git filter-repo \
  --force \
  --invert-paths \
  --path serviceAccountKey.json \
  --path serviceAccountKey.json.json \
  --path "*.secret.json" \
  --path "*.key.json" \
  --path "*.pem" \
  --path "*.p12" || true

# 3) Nettoyage de blobs fantômes (optionnel mais utile)
echo "🪣 GC et nettoyage…"
git reflog expire --expire=now --all || true
git gc --prune=now --aggressive || true

# 4) Commit de mise à jour .gitignore si nécessaire
if ! git diff --cached --quiet; then
  git commit -m "chore(security): .gitignore secrets + purge historique"
fi

# 5) Push forcé
echo "🚀 Push forcé vers origin/main…"
git branch -M main
git push origin main --force

echo "✅ Terminé. Si GitHub bloquait pour un secret, le push doit maintenant passer."
