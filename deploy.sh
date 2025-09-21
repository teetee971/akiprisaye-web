# 🚀 Codex Web — Déploiement Automatique A KI PRI SA YÉ

## 🎯 Objectif
Chaque commit poussé sur la branche principale déclenche automatiquement un build et un déploiement vers **Cloudflare Pages**.  
Ce document décrit le pipeline `deploy.sh` utilisable en local ou via CI.

---

## 📦 Pré-requis
- Node.js v20+
- npm 10+
- Git configuré avec un remote `origin` pointant vers GitHub
- Projet Cloudflare Pages connecté à la branche principale (généralement `main`)

---

## ⚙️ Script de déploiement (`deploy.sh`)

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement A KI PRI SA YÉ vers Cloudflare Pages..."

# Nettoyage
rm -rf node_modules dist package-lock.json

# Réinstallation propre
npm install

# Build du client
npm run build

# Ajout et push Git
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
git add .
git commit -m "auto: build & deploy"
git push origin "$CURRENT_BRANCH"

echo "✅ Push terminé — vérifie le dashboard Cloudflare Pages pour suivre le build"
