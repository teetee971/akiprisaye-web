# 🚀 CI/CD Pipeline Industriel - Documentation Complète

## Vue d'ensemble

Ce document décrit le pipeline CI/CD complet mis en place pour **A KI PRI SA YÉ**, garantissant des déploiements robustes, automatisés et sans régression.

## 🎯 Objectifs du Pipeline

- ✅ **Zéro déploiement partiel** - Tout ou rien
- ✅ **Zéro écran blanc** - Validation post-déploiement obligatoire
- ✅ **Zéro régression silencieuse** - Tests de qualité automatiques
- ✅ **Zéro erreur 404 en production** - Vérification du routing SPA
- ✅ **Rollback automatique** - Restauration en cas d'échec
- ✅ **Traçabilité complète** - Logs et versions horodatés

## 🏗️ Architecture du Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                     1️⃣ PREFLIGHT CHECK                      │
│  • Vérification Node.js version                             │
│  • Vérification secrets (sans les logger)                   │
│  • Lint YAML                                                 │
│  • Vérification structure projet                            │
│                     ❌ SI ÉCHEC → STOP                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   2️⃣ INSTALL & BUILD                        │
│  • npm ci (frontend directory)                              │
│  • Generate version.json                                    │
│  • npm run build                                            │
│  • Vérification dist/ et fichiers critiques                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              3️⃣ STATIC INTEGRITY CHECK (CRITIQUE)           │
│  • Parse index.html                                         │
│  • Vérification existence de tous les assets référencés     │
│  • Vérification casse (assets ≠ Assets)                     │
│  • Détection localhost/références invalides                 │
│                     ❌ SI ÉCHEC → STOP                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   4️⃣ SPA ROUTING GUARD                      │
│  • Vérification _redirects généré                           │
│  • Validation configuration SPA fallback                    │
│  • Tests des routes critiques                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  5️⃣ LIGHTHOUSE CI (QUALITÉ)                 │
│  • Performance (mobile)                                     │
│  • Accessibilité                                            │
│  • SEO                                                       │
│  • Best practices                                           │
│               ⚠️ Mode WARN (non-bloquant)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            6️⃣ CLOUDFLARE PAGES DEPLOYMENT                   │
│  • Preview pour Pull Requests                               │
│  • Production pour main branch                              │
│  • Déploiement uniquement si étapes 1-4 OK                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│          7️⃣ POST-DEPLOY VALIDATION (OBLIGATOIRE)            │
│  • Attente propagation (30s)                                │
│  • Fetch URL production avec retries                        │
│  • Vérification HTTP 200                                    │
│  • Vérification contenu attendu (React app)                 │
│  • Vérification routes critiques (/comparateur, etc.)       │
│  • Vérification absence page Vite par défaut                │
│                                                              │
│            ✅ SI OK → Déploiement validé                     │
│            ❌ SI KO → Trigger rollback                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              8️⃣ ROLLBACK AUTOMATIQUE (si échec)             │
│  • Identification du dernier déploiement stable             │
│  • Restauration automatique                                 │
│  • Notification admin                                       │
│  • Log incident avec horodatage                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  9️⃣ MONITORING & LOGS                       │
│  • Logs build complets                                      │
│  • Logs déploiement                                         │
│  • Horodatage UTC                                           │
│  • Version affichée en footer                               │
│  • Badge "Last successful deploy"                           │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Scripts de Validation

### 1. `scripts/preflight-check.sh`
**Objectif:** Vérifications avant le build (bloquant)

Vérifie:
- Version Node.js (>= 20.19.0)
- Présence des secrets requis (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- Structure du projet (package.json, src/, public/, etc.)
- Configuration _redirects pour SPA
- Absence de pointeurs Git LFS
- node_modules non tracké

**Usage:**
```bash
./scripts/preflight-check.sh
```

### 2. `scripts/verify-build.sh`
**Objectif:** Validation de la sortie du build

Vérifie:
- Existence du dossier dist/
- Présence d'index.html avec `<div id="root">`
- Présence d'assets JavaScript et CSS
- Copie du fichier _redirects dans dist/
- Taille raisonnable du build (<50MB)

**Usage:**
```bash
./scripts/verify-build.sh
```

### 3. `scripts/check-asset-integrity.sh`
**Objectif:** Vérification critique de l'intégrité des assets

Vérifie:
- Tous les assets référencés dans index.html existent
- Pas de problèmes de casse (Assets vs assets)
- Pas de références localhost
- Pas de page Vite par défaut
- Cohérence des chemins

**Usage:**
```bash
./scripts/check-asset-integrity.sh
```

### 4. `scripts/generate-version.sh`
**Objectif:** Génération du fichier version.json

Crée un fichier JSON contenant:
- Version (depuis package.json)
- Commit SHA
- Branch name
- Tag Git
- Build timestamp
- Build number (GitHub Actions)
- URL du build

**Usage:**
```bash
./scripts/generate-version.sh frontend/public/version.json
```

### 5. `scripts/post-deploy-validation.sh`
**Objectif:** Validation post-déploiement (bloquant)

Vérifie:
- HTTP 200 sur URL production
- Contenu attendu présent (A KI PRI SA YÉ)
- React app charge correctement
- Routes critiques accessibles (/, /comparateur, /scanner, /carte, /alertes)
- Pas de page Vite par défaut
- Pas de contenu fallback
- Service Worker présent
- Headers de sécurité

**Usage:**
```bash
./scripts/post-deploy-validation.sh https://akiprisaye.pages.dev 3 15
# Args: URL, max_retries, retry_delay
```

### 6. `scripts/rollback-deployment.sh`
**Objectif:** Rollback automatique en cas d'échec

Actions:
- Identifie le dernier déploiement stable
- Prépare le rollback
- Loge l'incident
- Notifie l'équipe admin
- Fournit instructions manuelles

**Usage:**
```bash
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy ./scripts/rollback-deployment.sh
```

## 🔐 Sécurité

### Secrets Requis
Les secrets suivants doivent être configurés dans GitHub Actions:
- `CLOUDFLARE_API_TOKEN` - Token API Cloudflare Pages
- `CLOUDFLARE_ACCOUNT_ID` - ID du compte Cloudflare

### Bonnes Pratiques Appliquées
- ✅ Secrets jamais loggés
- ✅ Permissions minimales
- ✅ Branches protégées (main)
- ✅ Déploiement production uniquement depuis main
- ✅ Concurrency control (un seul déploiement à la fois)
- ✅ Validation obligatoire avant déploiement

## 🚦 Environnements

### Preview (Pull Requests)
- URL: `https://<branch-name>.akiprisaye.pages.dev`
- Déclencheur: Push sur PR
- Validation complète appliquée
- Pas de rollback automatique

### Production (Main Branch)
- URL: `https://akiprisaye.pages.dev`
- Déclencheur: Push sur main
- Validation complète + post-deploy obligatoire
- Rollback automatique en cas d'échec

## 📊 Monitoring & Traçabilité

### Logs
Chaque étape du pipeline produit des logs détaillés:
- ✅ Préflight check results
- ✅ Build output
- ✅ Asset integrity report
- ✅ Lighthouse scores
- ✅ Deployment URL
- ✅ Post-deploy validation results

### Version Information
Chaque build génère un `version.json` avec:
```json
{
  "version": "3.0.1",
  "commit": "a1b2c3d",
  "branch": "main",
  "tag": "v3.0.1",
  "buildTimestamp": "2026-02-07T18:45:00Z",
  "buildNumber": "123",
  "buildUrl": "https://github.com/user/repo/actions/runs/123"
}
```

Cette information est:
- Visible dans le footer de l'application
- Accessible via `/version.json`
- Utilisée pour le debugging

### GitHub Actions Summary
Chaque run produit un résumé Markdown avec:
- Status de chaque étape
- URL de déploiement
- Timestamp
- Branch et commit

## 🔧 Configuration Locale

### Prérequis
```bash
# Node.js version
node --version  # doit être >= 20.19.0

# Installation des dépendances
cd frontend
npm ci
```

### Tests Locaux
```bash
# Preflight check
./scripts/preflight-check.sh

# Build + vérification
cd frontend
npm run build
cd ..
./scripts/verify-build.sh
./scripts/check-asset-integrity.sh

# Preview local
cd frontend
npm run preview
```

## 🆘 Dépannage

### Échec de Preflight
**Symptôme:** Pipeline s'arrête à l'étape 1

**Solutions:**
1. Vérifier version Node.js: `node --version`
2. Vérifier secrets GitHub: Settings → Secrets → Actions
3. Vérifier structure projet: tous les fichiers requis présents?

### Échec d'Asset Integrity
**Symptôme:** Assets manquants après build

**Solutions:**
1. Vérifier `vite.config.ts` - configuration publicDir
2. Vérifier que `_redirects` est dans `frontend/public/`
3. Nettoyer: `rm -rf frontend/dist frontend/node_modules && npm ci`

### Échec Post-Deploy
**Symptôme:** Validation post-déploiement échoue

**Solutions:**
1. Attendre propagation CDN (peut prendre jusqu'à 2 minutes)
2. Vérifier URL dans navigateur
3. Vérifier console browser pour erreurs JS
4. Vérifier Network tab pour 404s

### Rollback Manuel
Si le rollback automatique échoue:

1. Aller sur Cloudflare Dashboard
2. Pages → akiprisaye-web → Deployments
3. Trouver le dernier déploiement "Success"
4. Cliquer "Rollback to this deployment"

## 🎯 Critères de Succès

Un déploiement est considéré réussi si:
- ✅ Tous les checks preflight passent
- ✅ Build réussit sans erreur
- ✅ Tous les assets sont intègres
- ✅ Routing SPA fonctionne
- ✅ Lighthouse scores acceptables (mode warn)
- ✅ Déploiement Cloudflare réussit
- ✅ **Validation post-deploy passe (CRITIQUE)**
- ✅ Aucun rollback déclenché

## 📞 Support

En cas de problème:
1. Consulter les logs GitHub Actions
2. Exécuter les scripts de validation localement
3. Vérifier la documentation Cloudflare Pages
4. Contacter l'équipe DevOps

## 📚 Références

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Version:** 1.0  
**Dernière mise à jour:** 2026-02-07  
**Auteur:** Pipeline CI/CD - A KI PRI SA YÉ
