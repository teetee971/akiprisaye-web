# 🚀 Mega Repair & Build Script - A KI PRI SA YÉ

## Description

Script de méga réparation et de build complet pour le projet A KI PRI SA YÉ, spécialement conçu pour l'environnement Termux avec Node.js v22+ et compatible avec le déploiement Cloudflare Pages.

## Fonctionnalités

### 🧹 Nettoyage Complet
- Suppression de `node_modules`, `package-lock.json`, et autres fichiers de cache
- Nettoyage des caches npm (`~/.npm/_cacache`, `~/.npm/_npx`)
- Nettoyage des fichiers de build (`dist`, `.vite`, `.next`, etc.)
- Nettoyage spécifique Termux (`$PREFIX/tmp/npm-*`)

### 📦 Correction des Dépendances
- Résolution automatique des conflits de versions React (18 vs 19)
- Installation avec `--legacy-peer-deps` pour éviter les erreurs peer dependency
- Correction automatique des versions incompatibles
- Sauvegarde automatique du `package.json` original

### ⚙️ Configuration Optimisée
- Configuration Vite optimisée pour Termux
- Configuration Tailwind CSS avec présets optimisés
- Configuration PostCSS automatique
- Optimisation des chunks pour la production

### 🏗️ Build Production
- Build optimisé avec esbuild
- Génération de chunks séparés (vendor, charts, maps)
- Vérification automatique du build
- Diagnostic en cas d'échec

## Utilisation

### Installation et Exécution

```bash
# Cloner le projet (si pas déjà fait)
git clone https://github.com/teetee971/akiprisaye-web.git
cd akiprisaye-web

# Rendre le script exécutable
chmod +x mega_repair_build.sh

# Exécution complète (nettoyage + installation + build)
./mega_repair_build.sh

# Ou avec bash (pour compatibilité)
bash mega_repair_build.sh
```

### Options Disponibles

```bash
# Afficher l'aide
./mega_repair_build.sh --help

# Nettoyage seulement (sans build)
./mega_repair_build.sh --clean-only

# Build seulement (sans nettoyage)
./mega_repair_build.sh --build-only

# Spécifier un répertoire de projet différent
./mega_repair_build.sh --project-root /path/to/project
```

### Variables d'Environnement

```bash
# Définir le répertoire du projet
export PROJECT_ROOT="/path/to/akiprisaye-web"

# Lancer le script
./mega_repair_build.sh
```

## Prérequis

### Environnement Termux
```bash
# Mise à jour des paquets
pkg update && pkg upgrade

# Installation de Node.js (v22+ recommandé)
pkg install nodejs

# Installation de Git (optionnel mais recommandé)
pkg install git

# Installation d'outils utiles
pkg install dos2unix jq
```

### Vérification des Prérequis
Le script vérifie automatiquement :
- ✅ Présence de Node.js
- ✅ Présence de npm
- ✅ Version Node.js (v22+ recommandée)
- ⚠️ Présence de Git (optionnel)

## Résolution des Problèmes Courants

### Conflits de Dépendances React
Le script résout automatiquement les conflits entre :
- `react@^18.3.1` vs `react@^19.0.0`
- `react-dom@^18.3.1` vs `react-dom@^19.0.0`
- `react-leaflet@^5.0.0` (incompatible) → `react-leaflet@^4.2.1` (compatible)

### Erreurs d'Installation npm
- Utilise `--legacy-peer-deps` en premier recours
- Fallback sur `--force` si nécessaire
- Correction automatique des versions conflictuelles

### Erreurs de Build
- Diagnostic automatique des fichiers manquants
- Vérification des points d'entrée (`src/main.jsx`, `src/main.js`)
- Vérification de `index.html`

## Sortie du Script

### Build Réussi
```
🎉 Méga réparation terminée avec succès!

Prochaines étapes:
  • Test local: npm run preview
  • Développement: npm run dev
  • Production: Le dossier dist/ est prêt pour Cloudflare Pages
```

### Structure du Build
```
dist/
├── index.html                 # Page principale
├── assets/
│   ├── index-[hash].css      # Styles compilés
│   ├── index-[hash].js       # Code principal
│   ├── vendor-[hash].js      # React + React DOM
│   ├── charts-[hash].js      # Chart.js + react-chartjs-2
│   └── maps-[hash].js        # Leaflet + react-leaflet
├── _headers                   # Headers Cloudflare Pages
├── _redirects                 # Redirections
└── [autres assets statiques]
```

## Intégration avec le Workflow Existant

### Avec `setup_termux.sh`
```bash
# 1. Setup initial Termux
./setup_termux.sh

# 2. Réparation et build
./mega_repair_build.sh

# 3. Le push vers GitHub déclenchera Cloudflare Pages
```

### Avec les Scripts de Déploiement
```bash
# Réparation + build + vérification
./mega_repair_build.sh
./scripts/mega_check.sh
```

## Compatibilité

- ✅ Termux (Android)
- ✅ Linux standard
- ✅ Node.js v18+ (v22+ recommandé)
- ✅ npm v8+
- ✅ Cloudflare Pages
- ✅ Déploiement GitHub Pages (fallback)

## Dépannage

### Script ne démarre pas
```bash
# Vérifier les permissions
chmod +x mega_repair_build.sh

# Exécuter avec bash directement
bash mega_repair_build.sh

# Vérifier le shebang Termux
head -1 mega_repair_build.sh
```

### Erreurs de permissions Termux
```bash
# Donner les permissions termux-setup-storage si nécessaire
termux-setup-storage

# Vérifier l'accès au stockage
ls $HOME
```

### Build échoue avec Tailwind
Le script gère automatiquement les conflits Tailwind CSS v4+ avec une configuration optimisée.

## Support

Ce script fait partie du projet A KI PRI SA YÉ et est maintenu pour assurer la compatibilité avec :
- L'écosystème Termux
- Les dernières versions de Node.js
- Cloudflare Pages
- Les dépendances React modernes

Pour des problèmes spécifiques, consulter les logs détaillés du script qui incluent des diagnostics automatiques.