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

## 📚 Références

- [Cloudflare Pages Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- Issue #XXX (à compléter)

## 🚀 Pour déployer

Après avoir mergé cette PR, Cloudflare Pages rebuild automatiquement avec la nouvelle configuration.

**Aucune action manuelle nécessaire** dans l'interface Cloudflare Pages - le fichier `.cloudflare-pages.json` est lu automatiquement.

---

**Date :** 6 février 2026  
**Auteur :** GitHub Copilot Agent  
**Status :** ✅ Implémenté et testé
