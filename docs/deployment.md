# Runbook de Déploiement & Rollback

> Déploiement public : **GitHub Pages** → `https://teetee971.github.io/akiprisaye-web/`

---

## 🚀 Déploiement standard

Le déploiement est **automatique** à chaque merge sur `main` via le workflow GitHub Actions [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml).

```bash
# Pour déclencher un déploiement manuel
# Aller sur : https://github.com/teetee971/akiprisaye-web/actions
# → Sélectionner "Deploy to GitHub Pages" → "Run workflow"
```

### Étapes du pipeline

1. `preflight-check.sh` — Vérification des pré-requis
2. `npm run build` (dans `frontend/`) — Build Vite de production
3. `scripts/prerender-routes.mjs` — Génération des routes statiques
4. Publication sur GitHub Pages (branche `gh-pages`)
5. `post-deploy-validation.sh` — Validation du site live

---

## 🔄 Procédure de rollback

En cas de régression détectée après déploiement :

### Option 1 — Rollback via GitHub Actions (recommandé)

```bash
# 1. Identifier le commit stable précédent
git log --oneline main | head -10

# 2. Lancer le rollback automatique
bash scripts/rollback-deployment.sh <commit-sha>
```

### Option 2 — Revert manuel

```bash
# Créer un PR de revert sur main
git revert <commit-sha> --no-edit
git push origin main
# Le déploiement se relance automatiquement
```

### Option 3 — Republier une version précédente via Actions

1. Aller sur [GitHub Actions](https://github.com/teetee971/akiprisaye-web/actions)
2. Sélectionner un run précédent réussi
3. Utiliser "Re-run jobs"

---

## 🆘 Dépannage

### Site affiche l'ancien contenu (cache)

```bash
# Forcer le rechargement sans cache
# Ctrl+Shift+R (navigateur)

# Ou incrémenter la version du Service Worker
# frontend/public/service-worker.js → CACHE_VERSION
```

### Build échoue

```bash
cd frontend
npm ci
npm run lint       # Vérifier les erreurs ESLint
npm run test       # Vérifier les tests
npm run build      # Build local pour reproduire l'erreur
```

### Routes 404 après déploiement

Le SPA utilise un fallback 404 → index.html sur GitHub Pages.
Si des routes sont cassées, vérifier `scripts/prerender-routes.mjs` et `frontend/public/sitemap.xml`.

---

## 📋 Scripts de validation

| Script | Objectif | Usage |
|--------|----------|-------|
| `scripts/preflight-check.sh` | Vérifie les pré-requis avant build | Avant chaque déploiement |
| `scripts/verify-build.sh` | Valide la sortie du build | Après `npm run build` |
| `scripts/check-asset-integrity.sh` | Vérifie l'intégrité des assets | Post-build |
| `scripts/post-deploy-validation.sh` | Valide le site live | Post-déploiement |
| `scripts/rollback-deployment.sh` | Restauration automatique | En cas d'incident |

---

## 🔗 Liens utiles

- [GitHub Actions — Historique des workflows](https://github.com/teetee971/akiprisaye-web/actions)
- [GitHub Pages — Site live](https://teetee971.github.io/akiprisaye-web/)
- [docs/DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md) — Résolution des problèmes courants
- [docs/security/SECURITY_AUDIT.md](security/SECURITY_AUDIT.md) — Audit de sécurité des dépendances
