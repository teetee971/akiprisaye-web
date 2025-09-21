# 🌍 A KI PRI SA YÉ — Comparateur de prix DROM-COM

Application web de comparaison de prix et suivi budget pour les territoires d'outre-mer français (DROM-COM).

---

## 📁 Organisation du dépôt

```
akiprisaye-web/
├── public/                 # Fichiers statiques pour Pages.dev
│   ├── index.html         # Page principale
│   ├── favicon.ico        # Icône du site
│   ├── icon.svg           # Icône SVG
│   ├── manifest.webmanifest
│   └── ...
├── src/                   # Code source de l'application
├── scripts/               # Scripts d'utilitaires et maintenance
│   ├── deploy_check.sh    # Vérification du déploiement
│   ├── mega_check.sh      # Tests complets
│   └── ...
├── install/               # Fichiers d'installation (.iss, .bat)
├── assets/                # Ressources (images promo, logos)
│   ├── promo/            # Images promotionnelles
│   ├── pwa_icon_*.png    # Icônes PWA
│   └── logo_*.webp       # Logos
├── deploy-pages.sh        # Script principal de déploiement
└── package.json
```

---

## 📌 Endpoints disponibles

### 1. API de comparaison de prix
- `/api/prices` - Récupération des prix par zone
- `/api/search` - Recherche de produits

---

## 🚀 Déploiement sur Pages.dev

### Installation rapide
```bash
npm install
npm run build
```

### Déploiement automatique
```bash
./deploy-pages.sh
```

Le script de déploiement :
1. Vérifie les pré-requis (Node.js, pnpm, git)
2. Installe les dépendances
3. Lance le build Vite
4. Commit et push vers GitHub
5. Cloudflare Pages déploie automatiquement

### Variables d'environnement
```bash
export BRANCH=main           # Branche de déploiement
export BUILD_DIR=dist        # Dossier de sortie
export CF_PROJECT=akiprisaye # Nom du projet Cloudflare
```

---

## 🛠️ Développement local

```bash
# Installation
npm install

# Serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualisation locale
npm run preview
```

---

## 🧹 Maintenance

- **Scripts utilitaires** : `scripts/`
- **Installation desktop** : `install/`
- **Vérification déploiement** : `./scripts/deploy_check.sh`
- **Tests complets** : `./scripts/mega_check.sh`

---

## 🌐 SEO & Infrastructure

- [x] Meta SEO et OpenGraph
- [x] robots.txt et sitemap.xml  
- [x] Service Worker PWA
- [x] Responsive mobile 
