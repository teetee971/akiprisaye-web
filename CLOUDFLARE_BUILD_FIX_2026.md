# Fix Cloudflare Pages Deployment - Février 2026

## 🐛 Problème

Cloudflare Pages servait une page statique de fallback ("Le site est en ligne…") au lieu de l'application React buildée.

### Cause racine

Cloudflare exécutait le build depuis la racine du repository, et Vite utilisait `/public/index.html` (à la racine) comme point d'entrée au lieu de `frontend/index.html` (le bon fichier React).

Résultat : le build se terminait avec succès mais déployait le mauvais index.html.

## ✅ Solution implémentée

### 1. Configuration Cloudflare Pages (`.cloudflare-pages.json`)

```json
{
  "root_directory": "frontend",
  "build_command": "npm ci && npm run build",
  "build_output_directory": "dist"
}
```

**Explications :**
- `root_directory: "frontend"` → Cloudflare change le contexte d'exécution vers le dossier `frontend/`
- `build_command: "npm ci && npm run build"` → S'exécute dans `frontend/`, utilise son `package.json`
- `build_output_directory: "dist"` → Relatif à `frontend/`, donc pointe vers `frontend/dist`

### 2. Nettoyage des fichiers conflictuels

- ❌ Supprimé : `public/index.html` (à la racine du repository)
  - Ce fichier créait une confusion car Vite aurait pu le prendre comme point d'entrée
  - Renommé en `public/index.html.bak` par sécurité (ignoré par `.gitignore`)

### 3. Vérification des headers

Le fichier `frontend/public/_headers` était déjà correct :
- ✅ Utilise `/*` comme pattern de chemin (pas comme commentaire)
- ✅ Pas de ligne `*/` de fermeture (qui serait invalide en syntaxe Cloudflare)

## 📝 Architecture du projet

```
akiprisaye-web/
├── .cloudflare-pages.json    ← Configuration Cloudflare
├── frontend/                  ← ROOT DIRECTORY pour le build
│   ├── index.html            ← Point d'entrée React (le bon)
│   ├── package.json          ← Dépendances frontend
│   ├── vite.config.ts        ← Configuration Vite
│   ├── src/
│   │   └── main.jsx          ← Entry point React
│   └── public/
│       ├── _headers          ← Headers HTTP pour Cloudflare
│       └── ...               ← Assets statiques copiés vers dist/
└── public/                    ← ⚠️ Dossier legacy (ne pas utiliser)
    ├── index.html.bak        ← Ancien fichier (ignoré par git)
    └── ...
```

## 🔍 Vérification du déploiement

### Sur mobile (Chrome Android)

1. **Voir le source de la page**
   ```
   view-source:https://akiprisaye-web.pages.dev/
   ```
   - ❌ Si vous voyez "Le site est en ligne…" → Fallback encore servi
   - ✅ Si vous voyez `<script type="module" src="/assets/...">` → React OK

2. **Tester un fichier de build**
   ```
   https://akiprisaye-web.pages.dev/assets/
   ```
   - Vérifier qu'au moins un fichier JS/CSS est accessible

### Sur ordinateur

1. **Vérifier les logs Cloudflare Pages**
   - Aller dans Cloudflare Pages → votre site → Deployments
   - Vérifier que le build utilise bien `frontend/` comme root
   - Vérifier la sortie du build : doit mentionner `dist/index.html` avec des assets JS/CSS

2. **Console navigateur**
   - Ouvrir DevTools → Console
   - ✅ Pas d'erreurs 404 sur les fichiers `/assets/*.js`
   - ✅ L'app React se charge correctement

## 🔧 Problème de cache : "Le site est en ligne..." persiste

### Diagnostic

Si après le déploiement vous voyez encore le message "Le site est en ligne...", c'est un **problème de cache** :

**Test rapide avec curl :**
```bash
curl -s https://akiprisaye-web.pages.dev/ | grep -E "(root|script)"
```

Si vous voyez `<div id="root"></div>` et `<script type="module"`, le site est correctement déployé mais votre navigateur affiche une version cachée.

### ✅ Solution DÉFINITIVE appliquée (v4 - 2026-02-06)

**Corrections critiques :**

1. **Fichiers fallback éliminés**
   - Tous les HTML racine renommés `.old` (ignorés par git)
   - Plus aucun fallback ne peut être servi

2. **Service Worker v4 - STRICT network-first**
   - `fetch(request, {cache: 'no-store'})` pour HTML
   - Réponses HTML JAMAIS mises en cache
   - Cache version v3 → v4 pour forcer update

3. **Headers HTTP anti-cache**
   - HTML : `Cache-Control: no-store, no-cache, must-revalidate`
   - Assets : `Cache-Control: public, max-age=31536000, immutable`

**Résultat :** Aucune possibilité de servir du contenu obsolète.

**Documentation complète :** Voir [docs/DEPLOYMENT_TROUBLESHOOTING.md](docs/DEPLOYMENT_TROUBLESHOOTING.md)

### Solution pour utilisateurs : Purge des caches

#### 1. Cache Cloudflare (si accès admin)
- Dashboard Cloudflare Pages → Caching → Purge Everything
- Ou : Redeploy latest commit

#### 2. Service Worker (cause principale)
Le site utilise un Service Worker qui peut cacher l'ancienne version.

**Chrome/Edge (Desktop) :**
1. DevTools (F12) → Application → Service Workers
2. Cliquer "Unregister" sur tous les workers actifs
3. Application → Clear storage → Clear site data
4. Recharger avec Ctrl+Shift+R (hard refresh)

**Chrome Android :**
1. Ouvrir le site
2. Menu ⋮ → Paramètres du site → Stockage → Effacer les données
3. Si PWA installée : Désinstaller la PWA depuis les paramètres Android
4. Revenir sur le site

**Safari iOS :**
1. Réglages → Safari → Effacer historique et données
2. Ou : Réglages → Safari → Avancé → Données de sites → Supprimer akiprisaye-web.pages.dev

#### 3. Cache navigateur classique
**Tous navigateurs :**
- Windows/Linux : Ctrl+Shift+R ou Ctrl+F5
- Mac : Cmd+Shift+R
- Mobile : Menu → Effacer cache et données

### Correctif Service Worker (v3)

Le Service Worker a été mis à jour pour :
1. **Network-first pour HTML** : Les pages HTML sont toujours récupérées depuis le réseau
2. **Cache invalidé** : Version bump v2 → v3 force tous les clients à rafraîchir
3. **Pas de précache HTML** : `/index.html` n'est plus précaché

**Après un redéploiement, le nouveau Service Worker :**
- Supprime automatiquement les anciens caches (v1, v2)
- Utilise network-first pour tous les documents HTML
- Garde cache-first uniquement pour assets statiques (JS, CSS, images)

## 📚 Références

- [Cloudflare Pages Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- Issue #XXX (à compléter)

## 🚀 Pour déployer

Après avoir mergé cette PR, Cloudflare Pages rebuild automatiquement avec la nouvelle configuration.

**Aucune action manuelle nécessaire** dans l'interface Cloudflare Pages - le fichier `.cloudflare-pages.json` est lu automatiquement.

## 🐛 Troubleshooting

### Problème : Users still see old content after deployment

**Symptômes :**
- Curl shows correct React HTML but browser shows old content
- DevTools Console shows old bundle hashes
- "Le site est en ligne..." message visible

**Cause :** Service Worker cache

**Solution pour les utilisateurs :**
1. **Méthode automatique :** Le nouveau Service Worker (v3) devrait se mettre à jour automatiquement après 24h maximum
2. **Méthode manuelle :** Suivre les étapes de purge cache ci-dessus

**Solution pour les développeurs :**
```javascript
// Dans DevTools Console, forcer la mise à jour du SW :
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
}).then(() => location.reload());
```

### Problème : Build fails on Cloudflare

**Vérifier :**
1. `.cloudflare-pages.json` contient `root_directory: "frontend"`
2. `frontend/package.json` existe et contient les scripts build
3. `frontend/package-lock.json` existe (nécessaire pour `npm ci`)

### Problème : 404 sur les assets après build

**Cause probable :** Mauvaise configuration du `build_output_directory`

**Vérifier :**
- Doit être `"dist"` (relatif à `frontend/`)
- PAS `"frontend/dist"` (car root_directory = frontend)

---

**Date :** 6 février 2026  
**Auteur :** GitHub Copilot Agent  
**Status :** ✅ Implémenté et testé  
**Dernière mise à jour :** Fix Service Worker cache strategy (v3)
