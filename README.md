# A KI PRI SA YÉ - Site Web

Application web progressive (PWA) pour le catalogue de produits A KI PRI SA YÉ.

## 🚀 Technologies

- **React** - Bibliothèque UI
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Cloudflare Pages** - Hébergement

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`

## 🌐 Déploiement

### Déploiement automatique (Recommandé)

Le site est automatiquement déployé sur Cloudflare Pages à chaque push sur la branche `main` via GitHub Actions.

**Prérequis :**
- Configurer les secrets GitHub suivants :
  - `CLOUDFLARE_API_TOKEN` : Token API Cloudflare
  - `CLOUDFLARE_ACCOUNT_ID` : ID du compte Cloudflare

### Déploiement manuel

Vous pouvez également utiliser le script de déploiement manuel :

```bash
./deploy.sh
```

Ce script :
1. Nettoie et prépare le projet
2. Build l'application
3. Commit et push les changements sur GitHub
4. Déploie sur Cloudflare Pages (si wrangler est installé)

## 📋 Structure du projet

```
akiprisaye-web/
├── data/           # Données JSON des produits
├── public/         # Assets statiques
├── src/            # Code source React
│   ├── components/ # Composants React
│   ├── App.jsx     # Composant principal
│   └── main.jsx    # Point d'entrée
├── deploy.sh       # Script de déploiement manuel
├── wrangler.toml   # Configuration Cloudflare
└── package.json    # Dépendances npm
```

## 🔧 Configuration

La configuration Cloudflare Pages est définie dans `wrangler.toml` :
- Projet : `akiprisaye-web`
- Dossier de build : `dist`
- Commande de build : `npm run build`

## 📝 License

Propriétaire privé
