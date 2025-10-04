# A KI PRI SA YÉ – Firebase Premium

## Fonctionnalités

- Connexion anonyme ✅
- Bouton visible pour devenir premium
- Détection du rôle utilisateur Firebase (`customClaims`)
- Modules Premium visibles uniquement pour les comptes vérifiés
- Préparation 2FA

## Déploiement

```bash
firebase login
firebase init hosting
firebase deploy
```

## Pour attribuer le rôle premium (à faire via admin SDK)

```js
admin.auth().setCustomUserClaims(uid, { premium: true });
```