# A KI PRI SA YÉ — Démo enrichie

Cette démo **sans secrets** te permet de tester rapidement :
- Comparaison de prix (mock)
- Prévision IA (mock)
- Vwa Peyi (synthèse vocale navigateur)
- Radar de cherté (seuil d'alerte)

## Démarrer en local
Ouvre `index.html` dans le navigateur. Tout est static.

## Déployer sur Firebase Hosting
```bash
firebase init hosting   # (si besoin)
firebase deploy --only hosting
```
Le fichier `firebase.json` est déjà prêt.

## Déployer sur GitHub Pages
```bash
bash deploy_github_pages.sh
```

## Secrets réels
- Les clés/API réelles ne sont **pas** incluses (sécurité). Utilise `.env.local`.
- Exemple : `FIREBASE_API_KEY=xxx` → consommer dans un build frontend.

Généré le 2025-08-27T13:57:18.737230Z
