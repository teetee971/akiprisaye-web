# 🚀 Pipeline CI/CD - Guide de Dépannage

## Table des Matières
- [Problèmes Courants](#problèmes-courants)
- [Étapes de Débogage](#étapes-de-débogage)
- [Erreurs Spécifiques](#erreurs-spécifiques)
- [Outils de Diagnostic](#outils-de-diagnostic)

## Problèmes Courants

### 1. Échec du Preflight Check

#### Symptôme
```
❌ PREFLIGHT CHECK FAILED
```

#### Causes Possibles
- Version Node.js incorrecte
- Secrets GitHub manquants ou invalides
- Fichiers projet manquants
- Pointeurs Git LFS présents

#### Solutions

**Vérifier Node.js:**
```bash
node --version  # Doit être >= 20.19.0
nvm use 20.19.0  # Si utilisation de nvm
```

**Vérifier les secrets:**
```bash
# Dans GitHub: Settings → Secrets → Actions
# Vérifier que ces secrets existent:
# - CLOUDFLARE_API_TOKEN
# - CLOUDFLARE_ACCOUNT_ID
```

**Vérifier la structure:**
```bash
# Tous ces fichiers/dossiers doivent exister:
ls -la frontend/package.json
ls -la frontend/package-lock.json
ls -la frontend/src/
ls -la frontend/public/
ls -la frontend/public/_redirects
```

**Nettoyer Git LFS:**
```bash
# Chercher pointeurs LFS
git grep -I "version https://git-lfs.github.com/spec/v1"

# Si trouvés, les remplacer par les vrais fichiers
```

### 2. Échec du Build

#### Symptôme
```
npm run build failed
```

#### Causes Possibles
- Dépendances manquantes
- Erreurs TypeScript
- Erreurs dans le code
- Problèmes de configuration Vite

#### Solutions

**Nettoyer et réinstaller:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Vérifier les erreurs TypeScript:**
```bash
cd frontend
npx tsc --noEmit
```

**Tester localement:**
```bash
cd frontend
npm run dev
# Vérifier qu'il n'y a pas d'erreurs console
```

### 3. Échec d'Asset Integrity

#### Symptôme
```
❌ ASSET INTEGRITY CHECK FAILED
❌ MISSING: /assets/index-xyz.js
```

#### Causes Possibles
- Assets non générés correctement
- Chemins incorrects dans index.html
- Problèmes de casse (Assets vs assets)
- Configuration Vite incorrecte

#### Solutions

**Vérifier la configuration Vite:**
```javascript
// vite.config.ts
export default defineConfig({
  publicDir: 'public',  // Doit être 'public'
  build: {
    outDir: 'dist',     // Doit être 'dist'
    assetsDir: 'assets' // Doit être 'assets' (lowercase)
  }
})
```

**Vérifier que _redirects est copié:**
```bash
# Après build
ls -la frontend/dist/_redirects
cat frontend/dist/_redirects
```

**Nettoyer et rebuilder:**
```bash
cd frontend
rm -rf dist
npm run build
ls -la dist/
ls -la dist/assets/
```

### 4. Échec du Routing

#### Symptôme
```
❌ _redirects file not properly configured
```

#### Solution

**Créer/Corriger _redirects:**
```bash
# frontend/public/_redirects doit contenir:
/*    /index.html   200
```

**Vérifier copie dans dist:**
```bash
cd frontend
npm run build
cat dist/_redirects
```

### 5. Échec Lighthouse

#### Symptôme
```
⚠️ Lighthouse checks in warn mode
Performance score below threshold
```

#### Solutions

**Optimiser les performances:**
```bash
# Analyser le bundle
cd frontend
npm run build
npx vite-bundle-visualizer

# Identifier les gros modules
# Lazy load les composants lourds
```

**Optimiser les images:**
```bash
# Compresser les images dans public/
# Utiliser WebP quand possible
# Lazy load les images
```

**Note:** Lighthouse est en mode "warn" donc non-bloquant pour l'instant.

### 6. Échec Post-Deploy

#### Symptôme
```
❌ POST-DEPLOYMENT VALIDATION FAILED
❌ Root page returned HTTP 404
```

#### Causes Possibles
- Propagation CDN incomplète
- Déploiement Cloudflare échoué
- Configuration projet incorrecte
- Assets manquants

#### Solutions

**Attendre la propagation:**
```bash
# Attendre 2-3 minutes puis retester
sleep 180
./scripts/post-deploy-validation.sh https://akiprisaye.pages.dev
```

**Vérifier Cloudflare Dashboard:**
```
1. Ouvrir https://dash.cloudflare.com
2. Pages → akiprisaye-web
3. Vérifier que le déploiement est "Active"
4. Vérifier l'URL
```

**Tester manuellement:**
```bash
# Test HTTP
curl -I https://akiprisaye.pages.dev/

# Test contenu
curl -s https://akiprisaye.pages.dev/ | head -50

# Test routes
curl -I https://akiprisaye.pages.dev/comparateur
```

**Vérifier les logs Cloudflare:**
```
Dashboard → Pages → akiprisaye-web → Deployment → View logs
```

### 7. Routes Retournent 404

#### Symptôme
```
❌ /comparateur - HTTP 404
```

#### Cause
Le fichier `_redirects` n'est pas présent ou mal configuré.

#### Solution

**Vérifier _redirects en production:**
```bash
curl -I https://akiprisaye.pages.dev/_redirects
# Doit retourner 200
```

**Si 404, rebuilder avec _redirects:**
```bash
cd frontend
# Vérifier que public/_redirects existe
cat public/_redirects

# Rebuilder
rm -rf dist
npm run build

# Vérifier que _redirects est copié
ls -la dist/_redirects
```

### 8. Page Vite Par Défaut Détectée

#### Symptôme
```
❌ Default Vite page detected!
```

#### Cause
Le build n'a pas été exécuté ou a échoué silencieusement.

#### Solution

**Vérifier le contenu de index.html:**
```bash
cat frontend/dist/index.html | grep "Vite + React"
# Ne doit rien retourner
```

**Rebuilder proprement:**
```bash
cd frontend
rm -rf dist node_modules
npm ci
npm run build
cat dist/index.html | head -20
```

## Étapes de Débogage

### Débogage Local

1. **Exécuter les scripts localement:**
```bash
# Preflight
./scripts/preflight-check.sh

# Build
cd frontend && npm run build && cd ..

# Vérifications
./scripts/verify-build.sh
./scripts/check-asset-integrity.sh

# Preview local
cd frontend
npm run preview
# Ouvrir http://localhost:4173
```

2. **Vérifier les logs détaillés:**
```bash
# Build avec logs verbeux
cd frontend
npm run build -- --debug

# Lighthouse local
npx @lhci/cli autorun --config=../lighthouserc.json
```

3. **Tester le déploiement simulé:**
```bash
# Servir le dossier dist comme Cloudflare le ferait
cd frontend/dist
python3 -m http.server 8080

# Tester
curl http://localhost:8080/
curl http://localhost:8080/comparateur
```

### Débogage CI/CD

1. **Consulter les logs GitHub Actions:**
```
GitHub → Actions → [workflow run] → Cliquer sur chaque job
```

2. **Re-run avec debug:**
```
GitHub Actions → Re-run jobs → Enable debug logging
```

3. **Télécharger les artifacts:**
```
GitHub Actions → [workflow run] → Artifacts → Download 'dist'
```

## Erreurs Spécifiques

### "CLOUDFLARE_API_TOKEN not set"

**Solution:**
```bash
# Dans GitHub
Settings → Secrets → Actions → New repository secret
Name: CLOUDFLARE_API_TOKEN
Value: [votre token depuis Cloudflare]
```

### "Assets/ directory found (should be 'assets/')"

**Cause:** Problème de casse dans vite.config.ts

**Solution:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    assetsDir: 'assets'  // Tout en minuscule
  }
})
```

### "Service Worker v2 (ANCIEN) encore déployé"

**Solution:**
```bash
# Le Service Worker est caché
# 1. Redéployer depuis Cloudflare Dashboard
# 2. Purger le cache Cloudflare
# 3. Attendre 24h pour propagation complète
```

## Outils de Diagnostic

### Script de Diagnostic Complet

```bash
#!/bin/bash
# diagnostic.sh - Script de diagnostic complet

echo "=== DIAGNOSTIC CI/CD ==="

echo "1. Environment"
node --version
npm --version
git --version

echo "2. Project Structure"
ls -la frontend/package.json
ls -la frontend/src/
ls -la frontend/public/_redirects

echo "3. Build Test"
cd frontend
npm ci
npm run build
ls -la dist/

echo "4. Asset Check"
cd ..
./scripts/check-asset-integrity.sh

echo "5. Production Check"
./scripts/post-deploy-validation.sh https://akiprisaye.pages.dev

echo "=== END DIAGNOSTIC ==="
```

### Commandes Utiles

```bash
# Vérifier les secrets (sans les afficher)
env | grep CLOUDFLARE | sed 's/=.*/=***/'

# Taille du build
du -sh frontend/dist

# Liste des assets
find frontend/dist/assets -type f

# Vérifier les liens dans index.html
grep -o 'src="[^"]*"' frontend/dist/index.html
grep -o 'href="[^"]*"' frontend/dist/index.html

# Tester toutes les routes
for route in "" "comparateur" "scanner" "carte" "alertes"; do
  curl -I "https://akiprisaye.pages.dev/$route" | head -1
done
```

## Demander de l'Aide

Si le problème persiste:

1. **Rassembler les informations:**
   - Logs GitHub Actions complets
   - Message d'erreur exact
   - Étapes pour reproduire
   - Ce qui a déjà été tenté

2. **Créer une issue GitHub:**
   - Titre descriptif
   - Description détaillée
   - Logs pertinents
   - Label "bug" et "ci/cd"

3. **Contacter l'équipe:**
   - Slack/Discord
   - Email technique
   - Avec toutes les infos ci-dessus

---

**Version:** 1.0  
**Dernière mise à jour:** 2026-02-07
