# Script de Déploiement A KI PRI SA YÉ

## Description

Le script `deploy_akiprisaye.sh` automatise le processus de déploiement pour l'application web "A KI PRI SA YÉ" vers Cloudflare Pages.

## Fonctionnalités

Le script effectue automatiquement les étapes suivantes :

1. **Synchronisation** : Bascule vers la branche `main` et récupère les dernières modifications
2. **Installation des dépendances** : Utilise `npm ci` si un lockfile existe, sinon `npm install`
3. **Vérification des dépendances critiques** : S'assure que les packages essentiels sont installés :
   - `vite`
   - `@vitejs/plugin-react`
   - `react`
   - `react-dom`
4. **Build** : Compile le projet avec `npm run build`
5. **Commit automatique** : Ajoute les lockfiles et le dossier `dist` au Git
6. **Push** : Envoie les modifications vers GitHub pour déclencher le déploiement Cloudflare Pages

## Utilisation

```bash
# Rendre le script exécutable
chmod +x deploy_akiprisaye.sh

# Lancer le déploiement
./deploy_akiprisaye.sh
```

## Prérequis

- Node.js v18+ installé
- npm 8+ installé
- Git configuré avec accès au repository
- Accès en écriture à la branche `main`
- Projet Cloudflare Pages configuré et connecté à la branche `main`

## Configuration

Le script utilise les configurations existantes du projet :
- `package.json` pour les dépendances et scripts
- `vite.config.js` pour la configuration de build
- `postcss.config.cjs` pour PostCSS et Tailwind CSS

## Sortie

Une fois le déploiement terminé, l'application est disponible à l'adresse :
**https://akiprisaye.pages.dev**

## Dépannage

Si le script échoue, vérifiez :
1. Que vous avez les droits d'écriture sur la branche `main`
2. Que toutes les dépendances sont correctement installées
3. Que le build Vite s'exécute sans erreur
4. Que le projet Cloudflare Pages est correctement configuré