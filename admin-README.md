# Documentation Admin A KI PRI SA YÉ

## Page Admin Sécurisée (/admin)

### 🔐 Authentification

La page admin utilise Firebase Auth avec authentification email/mot de passe :

- **Mode Production** : Utilise Firebase Auth avec vérification des rôles
- **Mode Démo** : Fallback local pour les tests (admin@akiprisaye.com / admin123)

### 👤 Gestion des Rôles

Accès limité aux utilisateurs avec :
1. **Custom Claim** : `admin: true` dans Firebase
2. **Emails autorisés** : admin@akiprisaye.com, admin@a-ki-pri-sa-ye.firebaseapp.com

### 📸 Upload de Tickets

- **Formats supportés** : Images (JPG, PNG) et PDF
- **Méthodes** : Drag & drop ou sélection de fichiers
- **Stockage** : Firebase Storage (si disponible) ou local pour démo

### 🧠 Intégration OCR

- **Moteur** : Tesseract.js pour reconnaissance de texte français
- **Extraction** : Détection automatique des produits et prix
- **Patterns** : Reconnaissance des prix en euros (€) et produits courants

### 💾 Stockage Firestore

Collection `tickets` avec structure :
```javascript
{
  id: "timestamp",
  fileName: "nom_du_fichier",
  fileSize: 123456,
  fileType: "image/jpeg",
  uploadedAt: Date,
  uploadedBy: "email@utilisateur.com",
  downloadURL: "url_firebase_storage",
  ocrText: "texte_extrait_complet",
  extractedData: {
    products: ["banane", "lait", "pain"],
    prices: ["2.45€", "1.09€", "0.89€"],
    totalProducts: 3,
    totalPrices: 3
  },
  status: "processed"
}
```

### 🎨 Interface

- **Dashboard** : Vue d'ensemble avec statistiques
- **Upload** : Zone de drag & drop responsive
- **Tickets** : Grille avec aperçu et détails OCR
- **Thème** : Style dark cohérent avec le site

### 🚀 Déploiement

1. Configurer Firebase (optionnel pour mode démo)
2. Remplacer les clés dans `firebase-config-compat.js`
3. Définir les custom claims pour les admins
4. Deployer les fichiers sur votre hébergeur

### 📝 Fichiers

- `admin.html` : Page principale
- `admin-demo.html` : Version démo pure
- `firebase-config-compat.js` : Configuration Firebase
- `style.css` : Styles partagés

### 🔧 Maintenance

Pour ajouter un admin :
1. **Firebase** : Définir custom claim `admin: true`
2. **Local** : Ajouter l'email dans la fonction `isAdminEmail()`