# Configuration Firebase

Ce fichier explique comment configurer les variables d'environnement Firebase pour le projet.

## Étapes de configuration

1. Créer un fichier `.env.local` à la racine du projet
2. Copier le template ci-dessous
3. Remplacer les valeurs par vos vraies clés depuis Firebase Console

## Template .env.local

```bash
# Firebase Configuration
# Copier dans .env.local et remplir avec vos vraies clés Firebase
# NE PAS COMMITER .env.local dans Git (déjà dans .gitignore)

VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=a-ki-pri-sa-ye.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=a-ki-pri-sa-ye
VITE_FIREBASE_STORAGE_BUCKET=a-ki-pri-sa-ye.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Autres configurations (optionnel)
# VITE_API_BASE_URL=https://api.example.com
# VITE_ENABLE_ANALYTICS=true
```

## Où trouver ces clés ?

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ (Paramètres) → Paramètres du projet
4. Descendez jusqu'à "Vos applications" → Configuration SDK
5. Copiez les valeurs dans votre fichier `.env.local`

## Sécurité

⚠️ **Important:**
- Ne JAMAIS commiter `.env.local` dans Git
- `.env.local` est déjà dans `.gitignore`
- Les clés Firebase doivent rester privées
- En production, utiliser les variables d'environnement de votre plateforme (Cloudflare, Vercel, etc.)
