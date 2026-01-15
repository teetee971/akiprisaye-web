#  INSTRUCTIONS CLOUDFLARE PAGES - CONFIGURATION MANUELLE REQUISE

## Problème Actuel
Le site https://akiprisaye-web.pages.dev/ affiche une page blanche car **le build n'est pas exécuté**.

##  SOLUTION : Configuration dans le Dashboard Cloudflare

Allez sur https://dash.cloudflare.com/  Pages  akiprisaye-web  Settings  Builds & deployments

### Configuration Build Requise:

**Option 1 (Recommended):** Build from frontend subdirectory
```
Framework preset: Vite
Build command: cd frontend && npm ci && npm run build
Build output directory: frontend/dist
Root directory: (leave empty or /)
Node version: 20
```

**Option 2 (Alternative):** Build from root directory
```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (leave empty or /)
Node version: 20
```

**Note:** The `frontend/src` is a symlink to `../src` to enable building from the frontend directory.
See `CLOUDFLARE_BUILD_FIX.md` for detailed explanation.

### Variables d'Environnement (optionnel):
`
NODE_VERSION=20
NPM_VERSION=latest
`

##  Alternative Rapide : Déployer le Build Localement

Si vous ne pouvez pas accéder au dashboard, exécutez:

\\\ash
npm run build
git add dist -f
git commit -m "Deploy built dist folder"
git push
\\\

Puis dans Cloudflare Pages Settings:
- Build command: (leave empty)
- Build output directory: dist

##  Vérification

Après configuration, le site devrait afficher l'application React complète avec:
- Design glassmorphism moderne
- Navigation fonctionnelle
- Tous les modules actifs

---

**Dernière mise à jour:** 17 novembre 2025
**Commit actuel:** 8422f24b
