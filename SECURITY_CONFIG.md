# Configuration de Sécurité - A KI PRI SA YÉ

## Variables d'Environnement

### Création du fichier .env.local

Pour sécuriser les clés Firebase, créez un fichier `.env.local` à la racine du projet :

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=votre_clé_api_ici
VITE_FIREBASE_AUTH_DOMAIN=a-ki-pri-sa-ye.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=a-ki-pri-sa-ye
VITE_FIREBASE_STORAGE_BUCKET=a-ki-pri-sa-ye.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Utilisation dans le Code

Modifiez `firebase-config.js` pour utiliser les variables d'environnement :

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
```

## Content Security Policy (CSP)

### Headers à Ajouter dans Tous les HTML

Ajoutez cette balise dans le `<head>` de chaque fichier HTML :

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.google-analytics.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https: http:; 
               font-src 'self' data:; 
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://www.google-analytics.com; 
               frame-src 'self' https://*.firebaseapp.com; 
               object-src 'none'; 
               base-uri 'self';">
```

**Note:** `unsafe-inline` et `unsafe-eval` sont temporaires. Dans une prochaine version, migrez vers des nonces ou hashes CSP.

## Checklist de Sécurité

### Avant Chaque Déploiement

- [ ] Aucune clé API en clair dans le code
- [ ] Fichier `.env.local` non commité (vérifié dans .gitignore)
- [ ] `npm audit` retourne 0 vulnérabilités
- [ ] CSP headers présents dans tous les HTML
- [ ] HTTPS activé (Firebase Hosting)
- [ ] Règles Firestore sécurisées (voir README.md)

### Configuration Firebase

#### Règles Firestore de Production

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products: lecture seule
    match /products/{ean} {
      allow read: if true;
      allow write: if false; // Admin uniquement
    }
    
    // Stores: lecture seule
    match /stores/{storeId} {
      allow read: if true;
      allow write: if false; // Admin uniquement
    }
    
    // Prices: lecture seule
    match /prices/{docId} {
      allow read: if true;
      allow write: if false; // Cloud Functions uniquement
    }
    
    // Receipts: utilisateurs authentifiés
    match /receipts/{docId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if false; // Admin uniquement
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Règles Storage

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Receipts: utilisateurs authentifiés uniquement
    match /receipts/{userId}/{receiptId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024 // 5MB max
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Assets publics: lecture seule
    match /assets/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Protection XSS

### Bonnes Pratiques Déjà Implémentées

✅ Fonction `escapeHtml()` dans `comparateur-fetch.js`
✅ Utilisation de `textContent` au lieu de `innerHTML` quand possible

### À Vérifier

Assurez-vous que TOUTES les données utilisateur passent par `escapeHtml()` avant affichage :

```javascript
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Utilisation
element.innerHTML = escapeHtml(userInput);
```

## Rate Limiting

### Firebase Cloud Functions

Ajoutez un rate limiter dans vos Cloud Functions :

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite à 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

// Appliquer à l'API prices
app.use('/api/prices', apiLimiter);
```

## Monitoring et Alertes

### Recommandations

1. **Sentry** pour le tracking d'erreurs
2. **Firebase Performance Monitoring** pour les performances
3. **Firebase App Check** pour protéger les backends contre les abus
4. **Google Cloud Armor** pour la protection DDoS (si nécessaire)

### Configuration Firebase App Check

```javascript
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('VOTRE_SITE_KEY_RECAPTCHA'),
  isTokenAutoRefreshEnabled: true
});
```

## Audit de Sécurité Mensuel

### Checklist

- [ ] Exécuter `npm audit` et corriger toutes les vulnérabilités
- [ ] Vérifier les logs Firebase pour activités suspectes
- [ ] Revoir les règles Firestore et Storage
- [ ] Tester la CSP avec l'outil CSP Evaluator de Google
- [ ] Vérifier les certificats SSL/TLS
- [ ] Analyser les headers HTTP avec securityheaders.com
- [ ] Scanner avec OWASP ZAP ou similaire

## Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web.dev Security](https://web.dev/secure/)

---

*Dernière mise à jour: Novembre 2025*
