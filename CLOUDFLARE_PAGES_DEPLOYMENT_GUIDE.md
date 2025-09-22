# Guide de déploiement Cloudflare Pages - Configuration corrigée

Ce guide résout le problème "Output directory 'dist/public' not found" lors du déploiement Cloudflare Pages.

## Problème résolu

**Avant:** Vite générait le build dans `dist`, mais Cloudflare Pages attendait `dist/public`.  
**Après:** Vite génère maintenant le build directement dans `dist/public`.

## Configuration mise à jour

### 1. Configuration Vite (vite.config.js)
```javascript
export default defineConfig({
  // ...
  build: {
    outDir: "dist/public",  // ✅ Corrigé: était "dist"
    // ...
  },
});
```

### 2. Configuration Cloudflare Pages Dashboard

Dans votre dashboard Cloudflare Pages, utilisez ces paramètres :

- **Build command:** `npm run build`
- **Build output directory:** `dist/public`
- **Root directory:** _(laisser vide)_
- **Node.js version:** `20`

### 3. Scripts de déploiement mis à jour

Les scripts suivants ont été corrigés pour utiliser `dist/public` :

- `deploy-pages.sh` : Variable `BUILD_DIR` mise à jour
- `scripts/clear_cache.sh` : Chemin Wrangler corrigé
- `.github/workflows/deploy-cloudflare-pages.yml` : Répertoire de publication mis à jour

## Utilisation

### Déploiement automatique (GitHub Actions)
Les déploiements se font automatiquement à chaque push sur `main` via GitHub Actions.

### Déploiement manuel avec le script de réparation
```bash
# Teste et vérifie la configuration
./deploy-cloudflare-fix.sh

# Déploie immédiatement avec Wrangler
DEPLOY_NOW=1 ./deploy-cloudflare-fix.sh
```

### Déploiement manuel avec Wrangler
```bash
# Build du projet
npm run build

# Déploiement
npx wrangler pages deploy ./dist/public --project-name=akiprisaye
```

## Vérification

Pour vérifier que tout fonctionne :

1. **Build local :**
   ```bash
   npm run build
   ls -la dist/public/  # Doit contenir index.html et assets/
   ```

2. **Test avec le script :**
   ```bash
   ./deploy-cloudflare-fix.sh
   ```

3. **Structure attendue :**
   ```
   dist/
   └── public/
       ├── index.html
       ├── assets/
       ├── manifest.webmanifest
       └── [autres fichiers...]
   ```

## Résolution de problèmes

### Si l'erreur persiste

1. Vérifiez que `vite.config.js` contient `outDir: "dist/public"`
2. Supprimez le dossier `dist/` et relancez `npm run build`
3. Vérifiez la configuration dans le dashboard Cloudflare Pages

### Variables d'environnement Cloudflare Pages

Si nécessaire, ajoutez ces variables dans le dashboard :
- `NODE_VERSION`: `20`
- `NPM_VERSION`: `latest`

## Automatisation

Le script `deploy-cloudflare-fix.sh` automatise :
- ✅ Vérification de la configuration Vite
- ✅ Test du processus de build  
- ✅ Validation de la structure de sortie
- ✅ Instructions de déploiement
- ✅ Déploiement optionnel avec Wrangler

---

**Note :** Cette configuration garantit la cohérence entre la génération Vite et les attentes de Cloudflare Pages.