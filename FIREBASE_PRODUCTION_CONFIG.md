# Configuration Firebase pour Production

## Variables d'environnement requises (Cloudflare Pages)

Pour que l'authentification fonctionne en production, vous devez configurer les variables d'environnement suivantes dans **Cloudflare Pages → Settings → Environment variables** :

### Variables obligatoires :

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Configuration Firebase Console

1. **Activer Email/Password Authentication** :
   - Firebase Console → Authentication → Sign-in method
   - Activer "Email/Password"

2. **Autoriser les domaines** :
   - Firebase Console → Authentication → Settings → Authorized domains
   - Ajouter les domaines suivants :
     - `akiprisaye-web.pages.dev` (domaine Cloudflare Pages)
     - Votre domaine personnalisé si vous en avez un
     - `localhost` (pour le développement local)

### Où trouver ces valeurs ?

1. Allez dans Firebase Console : https://console.firebase.google.com/
2. Sélectionnez votre projet
3. Cliquez sur l'icône d'engrenage (Settings) → Project settings
4. Dans la section "Your apps", sélectionnez votre app web
5. Vous trouverez toutes les valeurs dans `firebaseConfig`

### Test de la configuration

Si Firebase n'est pas correctement configuré, vous verrez :
- Un message d'erreur dans la console du navigateur
- Un message d'erreur dans le formulaire de connexion : "Service d'authentification non disponible"

### Vérification des variables en production

Vous pouvez vérifier si les variables sont correctement configurées en regardant la console du navigateur :
- ✅ Si Firebase est initialisé : "✅ Firebase initialized successfully"
- ❌ Si la config est manquante : "❌ Firebase configuration incomplete. Missing variables: ..."
- ⚠️ Si l'initialisation échoue : "⚠️ Firebase initialization failed: ..."
