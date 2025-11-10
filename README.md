# A KI PRI SA YÉ – Application Citoyenne Anti-Vie Chère

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://akiprisaye.web.app)
[![Build Status](https://img.shields.io/badge/build-passing-success.svg)]()
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)]()

Application citoyenne pour lutter contre la vie chère dans les DROM-COM
(Départements et Régions d'Outre-Mer et Collectivités d'Outre-Mer).

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Production

```bash
npm run build
npm run preview
```

### Déploiement

```bash
# Firebase
firebase deploy

# Cloudflare Pages
npm run build
# puis déployez le dossier dist/
```

## ✨ Nouvelles Fonctionnalités (v1.1.0)

### 🌍 Sélecteur de Territoires DROM-COM

Nouveau composant `TerritorySelector` avec support complet des 12 territoires :

- 🇬🇵 Guadeloupe
- 🇲🇶 Martinique
- 🇬🇫 Guyane
- 🇷🇪 La Réunion
- 🇾🇹 Mayotte
- 🇵🇲 Saint-Pierre-et-Miquelon
- 🇧🇱 Saint-Barthélemy
- 🇲🇫 Saint-Martin
- 🇼🇫 Wallis-et-Futuna
- 🇵🇫 Polynésie française
- 🇳🇨 Nouvelle-Calédonie
- 🇹🇫 Terres australes et antarctiques françaises

### 📰 Widget Actualités

Nouveau composant `NewsWidget` avec :

- Fil d'actualités dynamique
- Filtres par territoire et catégorie
- Connexion API avec fallback mock
- Page dédiée `/actualites`

### 🗺️ Carte Interactive

Page `/carte` améliorée avec :

- Liste des magasins par territoire
- Structure prête pour intégration Leaflet
- Géolocalisation (à venir)
- Comparaison de prix par localisation

### 🔍 Comparateur Amélioré

Le comparateur de prix intègre maintenant :

- Connexion à l'API `/api/prices`
- Fallback avec données mock
- Interface responsive optimisée
- Indicateur du meilleur prix
- Badges promotions

### 📄 Mentions Légales

Nouvelle page `/mentions-legales` conforme RGPD avec :

- Informations éditeur
- Politique de confidentialité
- Gestion des cookies
- Droits utilisateurs

### 📱 PWA Améliorée

Manifest PWA enrichi avec :

- ✅ Shortcuts pour accès rapide (Comparateur, Scanner, Actualités, Carte)
- ✅ Share Target API
- ✅ Catégories et screenshots
- ✅ Icons 192px et 512px optimisés
- ✅ Mode offline complet

Service Worker v4 avec :

- ✅ Cache stratégique (Cache First pour statique, Network First pour API)
- ✅ Synchronisation en arrière-plan
- ✅ Support offline pour pages principales
- ✅ Gestion dynamique du cache

### 🎨 Responsive Design

Nouveau fichier `responsive.css` avec :

- ✅ Safe areas pour Samsung S24+, iPhone notch
- ✅ Touch targets minimum 44px (WCAG 2.1 AA)
- ✅ Grilles responsives mobile-first
- ✅ Typographie fluide (clamp)
- ✅ Support prefers-reduced-motion
- ✅ Mode sombre/clair automatique

### 🔧 Backend API (Structure AdonisJS)

Nouvelle structure backend dans `/backend` :

#### Routes API disponibles

**Prices API**

- `GET /api/prices` - Récupérer les prix par EAN et territoire
- `POST /api/prices` - Ajouter un nouveau prix
- `GET /api/prices/compare` - Comparer plusieurs produits

**News API**

- `GET /api/news` - Récupérer les actualités
- `GET /api/news/:id` - Récupérer une actualité spécifique
- `POST /api/news` - Créer une nouvelle actualité (admin)

**Contact API**

- `POST /api/contact` - Envoyer un message de contact
- `GET /api/contact` - Lister les messages (admin)
- `PATCH /api/contact/:id` - Mettre à jour le statut (admin)

**Placeholders (à venir)**

- `GET /api/ai/tips` - Conseils IA personnalisés
- `GET /api/history` - Historique utilisateur
- `POST /api/scan` - Upload et OCR de tickets

#### CRON Jobs

- `price-refresh.ts` - Mise à jour quotidienne des prix (2h00)

Voir `backend/README.md` pour la documentation complète de l'API.

## 🎯 Fonctionnalités Existantes

### Système de Prix Automatique

Ce projet inclut maintenant un système complet de récupération et vérification automatique des prix :

- **Comparateur de prix** (`comparateur.html`) : Recherchez et comparez les prix par code EAN
- **Upload de tickets** (`upload-ticket.html`) : Téléchargez des tickets de caisse pour extraction OCR automatique
- **API de prix** (`/api/prices`) : Endpoint REST pour récupérer les prix par EAN et localisation
- **Base de données Firestore** : Collections pour produits, magasins, prix et tickets

Consultez `Docs/REAL_PRICE_PIPELINE.md` pour la documentation complète.

### Scripts Disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Aperçu du build
- `npm run check-assets` - Vérification d'intégrité des assets

### Règles de Sécurité Firestore

Pour sécuriser votre base de données Firestore, appliquez les règles suivantes via la Console Firebase :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: lecture seule pour tous
    match /products/{ean} {
      allow read: if true;
      allow write: if false; // Seulement via admin/cloud functions
    }
    
    // Stores: lecture seule pour tous
    match /stores/{storeId} {
      allow read: if true;
      allow write: if false; // Seulement via admin/cloud functions
    }
    
    // Prices: lecture seule pour tous
    match /prices/{docId} {
      allow read: if true;
      allow write: if false; // Seulement via cloud functions
    }
    
    // Receipts: utilisateurs authentifiés peuvent créer
    match /receipts/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if false; // Seulement via admin/cloud functions
    }
  }
}
```

**Note importante :** Les règles ci-dessus protègent l'écriture directe dans Firestore. En production,
utilisez Firebase Cloud Functions ou Admin SDK pour gérer les écritures de prix et la modération des tickets.

### Tests Automatiques

Des tests de smoke sont exécutés automatiquement toutes les heures pour vérifier :

- Accessibilité de la page d'accueil
- Accessibilité du comparateur
- Fonctionnement de l'API

Voir `.github/workflows/smoke.yml` pour plus de détails.

## 📝 Maintenance et Versioning

Ce projet suit le [Semantic Versioning](https://semver.org/) et maintient un changelog détaillé.

- **CHANGELOG** : Voir [CHANGELOG.md](./CHANGELOG.md) pour l'historique complet des versions et des modifications
- **Contributions** : Avant de merger une PR, assurez-vous de mettre à jour la section `[Unreleased]` du CHANGELOG
  avec un résumé de vos changements
