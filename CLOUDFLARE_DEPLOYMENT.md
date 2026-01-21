# Configuration Cloudflare Pages

Pour que le site fonctionne correctement sur https://akiprisaye.pages.dev/, les paramètres suivants doivent être configurés dans le dashboard Cloudflare Pages :

## Paramètres de Build

1. **Framework preset** : Vite
2. **Build command** : `npm run build`
3. **Build output directory** : `dist`
4. **Root directory** : `/` (racine du projet)
5. **Node version** : 20

## Variables d'environnement

Aucune variable d'environnement spéciale n'est requise pour le build basique.

## Vérification du Build

Pour vérifier localement que le build fonctionne :

```bash
npm install
npm run build
```

Cela devrait créer un dossier `dist/` avec :
- `index.html` - Page d'accueil complète avec header, hero, et cartes de fonctionnalités
- Tous les fichiers HTML liés (comparateur.html, scanner.html, etc.)
- `assets/` - Icônes et images optimisées
- Fichiers JavaScript et CSS nécessaires
- `manifest.json` et `service-worker.js`

## Structure Attendue

```
dist/
├── index.html (page principale avec interface complète de l'application)
├── comparateur.html
├── scanner.html
├── upload-ticket.html
├── modules.html
├── carte.html
├── historique.html
├── ia-conseiller.html
├── mon-compte.html
├── faq.html
├── contact.html
├── mentions.html
├── partenaires.html
├── *.js (fichiers JavaScript nécessaires)
├── style.css
├── assets/
│   ├── icon_192.png
│   ├── icon_256.png
│   ├── icon_512.png
│   └── autres ressources optimisées
├── manifest.json
└── service-worker.js
```

## Cohérence avec Firebase Hosting

La configuration Vite a été mise à jour pour assurer que le déploiement Cloudflare Pages serve exactement le même contenu que Firebase Hosting :
- L'entrée principale est maintenant `./index.html` (racine du projet) au lieu de `./public/index.html`
- Tous les fichiers HTML liés depuis l'index sont inclus dans le build
- Les fichiers JavaScript et CSS sont copiés via le plugin `vite-plugin-static-copy`

## Dépannage

Si le site affiche une page blanche :
1. Vérifier que la build command est bien `npm run build`
2. Vérifier que le output directory est bien `dist`
3. Vérifier les logs de déploiement dans Cloudflare Pages
4. S'assurer qu'aucune erreur n'apparaît lors du build
5. Vérifier que le fichier `dist/index.html` contient bien l'interface complète de l'application (pas seulement un carrousel)
