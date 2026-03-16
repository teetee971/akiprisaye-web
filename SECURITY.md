# Security Policy — A KI PRI SA YÉ

## Versions supportées

| Version | Support sécurité |
| ------- | ---------------- |
| main (3.x) | ✅ Supportée |
| < 3.0 | ❌ Non supportée |

## Signaler une vulnérabilité

Ouvrez une **issue privée** (GitHub → Security → Report a vulnerability) ou contactez directement le mainteneur du dépôt.

Nous vous répondrons sous 72 h et fournirons un calendrier de correction.

---

## Gestion des clés Firebase

Les clés API Firebase (`VITE_FIREBASE_*`) sont **publiques par conception** — la sécurité est assurée par les Firebase Security Rules, pas par leur confidentialité.  
Voir : https://firebase.google.com/docs/projects/api-keys

### Clé correcte pour le projet `a-ki-pri-sa-ye`

```
VITE_FIREBASE_API_KEY=AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY
```

⚠️ **Cette clé contient des caractères proches de l'ancienne clé erronée.** Toute modification doit être vérifiée visuellement **et** par les tests automatiques.

### Processus de rotation de clé Firebase

1. Mettre à jour la valeur dans **GitHub Secrets** (`VITE_FIREBASE_API_KEY`)
2. Mettre à jour la valeur dans `frontend/src/lib/firebase.ts` (fallback local)
3. Mettre à jour `frontend/.env.example` et `.env.example`
4. Mettre à jour `scripts/firebase-config.js` et `scripts/carte-google.js`
5. Mettre à jour `EXPECTED_FIREBASE_CONFIG.apiKey` dans `scripts/validate-deployment.mjs`
6. Mettre à jour `CORRECT_API_KEY` dans `frontend/scripts/firebase-config.test.ts`
7. Ajouter l'ancienne clé à `STALE_BUNDLE_NAMES` dans `scripts/validate-deployment.mjs`
8. Exécuter `npm run check:firebase` pour valider localement
9. Pousser, vérifier que CI passe, et exécuter `node scripts/validate-deployment.mjs` après déploiement

### Gardes-fous en place

| Garde-fou | Fichier | Déclenchement |
|-----------|---------|---------------|
| Validation pré-build (ancienne clé → exit 1) | `.github/workflows/deploy-pages.yml` | Chaque déploiement GitHub Pages |
| Validation pré-build (ancienne clé → exit 1) | `.github/workflows/deploy-cloudflare-pages.yml` | Chaque déploiement Cloudflare |
| Test régression clé (source files) | `frontend/scripts/firebase-config.test.ts` | Chaque `npm test` |
| Audit bundle post-déploiement | `scripts/validate-deployment.mjs` | Manuel ou post-déploiement |
| Détection bundle obsolète | `scripts/validate-deployment.mjs` (`STALE_BUNDLE_NAMES`) | Manuel ou post-déploiement |

### Vérification locale rapide

```bash
npm run check:firebase
```

---

## Bonnes pratiques de sécurité

1. **Ne jamais committer de secrets réels** dans `.env` (utiliser `.env.local` ignoré par git)
2. **Fragmenter les clés dans les tests** pour éviter les faux positifs GitGuardian :
   ```ts
   const KEY = 'AIzaSyDf_m8Bz' + 'MVHFWoFhVLyThuKwWTMhB7u5ZY';
   ```
3. **Utiliser `safeLocalStorage.getJSON<T>(key, fallback)`** à la place de `JSON.parse(localStorage.getItem(key))`
4. **Garder `console.log` sous `if (import.meta.env.DEV)`** pour éviter les fuites de données en production
5. **Maintenir `npm audit` à 0 vulnérabilités critiques** — audit automatique à chaque CI

---

## Incidents résolus

| Date | Incident | Statut |
|------|----------|--------|
| 2026-03-15 | `API_KEY_INVALID` — bundle obsolète avec clé Firebase transposée | ✅ Résolu — voir [`docs/FIREBASE_INCIDENT_POSTMORTEM.md`](docs/FIREBASE_INCIDENT_POSTMORTEM.md) |
| 2026-03-13 | CVE: flatted < 3.4.0, undici < 7.24.1 | ✅ Résolu — `npm audit fix` |
| 2026-02-07 | CVE: esbuild GHSA-67mh-4wv8-2f99 | ✅ Résolu — vite 7.3.1 |

---

## Audit de sécurité complet

Voir [`docs/security/SECURITY_AUDIT.md`](docs/security/SECURITY_AUDIT.md) pour l'historique détaillé des vulnérabilités et corrections.
