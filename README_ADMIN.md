# Configuration Admin - A KI PRI SA YÉ

## Fonctionnalités Admin

La page `/admin.html` fournit une interface sécurisée pour :

- ✅ Connexion avec email/mot de passe (Firebase Auth)
- ✅ Upload de tickets (images/PDF)
- ✅ Analyse OCR avec Tesseract.js
- ✅ Extraction automatique des prix et produits
- ✅ Stockage dans Firestore (collection `tickets`)
- ✅ Affichage de la liste des tickets analysés

## Configuration requise

### 1. Attribution du rôle admin

Pour donner le rôle admin à un utilisateur, utiliser le Firebase Admin SDK :

```javascript
const admin = require('firebase-admin');

// Attribuer le rôle admin à un utilisateur
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Rôle admin attribué avec succès');
  })
  .catch((error) => {
    console.error('Erreur:', error);
  });
```

### 2. Créer un utilisateur admin

```javascript
// Créer un nouvel utilisateur admin
admin.auth().createUser({
  email: 'admin@akiprisaye.com',
  password: 'mot_de_passe_securise',
  emailVerified: true
})
.then((userRecord) => {
  // Attribuer le rôle admin
  return admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
})
.then(() => {
  console.log('Utilisateur admin créé avec succès');
});
```

### 3. Configuration Firebase

Assurer que le fichier `firebase-config.js` contient les bonnes clés :

```javascript
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
  projectId: "a-ki-pri-sa-ye",
  storageBucket: "a-ki-pri-sa-ye.appspot.com",
  messagingSenderId: "123456789012",
  appId: "votre-app-id"
};
```

### 4. Règles Firestore

Les règles Firestore ont été mises à jour pour sécuriser l'accès :

- Collection `tickets` : accessible uniquement aux admins
- Collection `historique` : accessible aux utilisateurs authentifiés
- Collections publiques : `prices`, `stores`, `products`

## Utilisation

1. Aller sur `/admin.html`
2. Se connecter avec email/mot de passe d'un compte admin
3. Utiliser l'interface pour :
   - Uploader des tickets (images ou PDF)
   - Voir l'analyse OCR en temps réel
   - Consulter la liste des tickets traités
   - Voir les données extraites (prix, produits, total)

## Extraction de données

L'algorithme OCR extrait automatiquement :

- **Prices** : tous les montants détectés (€, format français)
- **Produits** : noms de produits détectés par heuristiques
- **Total** : montant total du ticket
- **Statistiques** : nombre de lignes, produits, prix

## Sécurité

- ✅ Authentification obligatoire
- ✅ Vérification du rôle admin
- ✅ Règles Firestore restrictives
- ✅ Validation côté client et serveur
- ✅ Gestion d'erreurs complète

## Structure des données Firestore

### Collection `tickets`

```javascript
{
  originalText: "texte brut OCR",
  extractedData: {
    prices: [{text: "12.50€", value: 12.50, line: "..."}],
    products: ["Bananes", "Pain", "Lait"],
    total: 45.80,
    lineCount: 25
  },
  fileName: "ticket_casino_20240121.jpg",
  fileSize: 245678,
  uploadedAt: firebase.firestore.Timestamp,
  uploadedBy: "admin_uid"
}
```

## Déploiement

1. Déployer les règles Firestore : `firebase deploy --only firestore:rules`
2. Créer les utilisateurs admin avec le script ci-dessus
3. Déployer l'application : `firebase deploy --only hosting`

## Support

Pour toute question technique, consulter la documentation Firebase ou contacter l'équipe de développement.