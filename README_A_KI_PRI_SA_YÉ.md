# A KI PRI SA YÉ – PWA Déploiement Firebase

## Description
Application en mode sombre avec :
- Synthèse vocale
- Reconnaissance vocale (micro)
- Connexion à une IA locale (via Ollama localhost)
- Interface responsive

## Déploiement Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init (si nécessaire)
firebase deploy
```

## Structure

- index_ai_sombre_final.html – Interface IA
- firebase.json – Configuration pour SPA (Single Page App)
- .firebaserc – Lien vers le projet Firebase `a-ki-pri-sa-ye`