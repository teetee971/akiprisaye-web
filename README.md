# A KI PRI SA YÉ – Module Chat IA Local

Instructions :

1. `npm install`
2. `npm run dev` pour tester localement
3. Connectez Firebase avec vos clés dans `firebase_config.js`
4. Déployez sur Vercel ou Firebase Hosting

## Nouvelles Fonctionnalités

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

**Note importante :** Les règles ci-dessus protègent l'écriture directe dans Firestore. En production, utilisez Firebase Cloud Functions ou Admin SDK pour gérer les écritures de prix et la modération des tickets.

### Tests Automatiques

Des tests de smoke sont exécutés automatiquement toutes les heures pour vérifier :
- Accessibilité de la page d'accueil
- Accessibilité du comparateur
- Fonctionnement de l'API

Voir `.github/workflows/smoke.yml` pour plus de détails.

