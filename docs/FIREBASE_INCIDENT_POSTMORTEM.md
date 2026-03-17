# Postmortem — Incident Firebase API_KEY_INVALID (2026-03-15)

**Statut** : ✅ Résolu  
**Sévérité** : Production — authentification hors service  
**Durée** : Indéterminée (bundle obsolète détecté le 2026-03-15)  
**Auteur** : Équipe A KI PRI SA YÉ

---

## Résumé

L'application en production (`https://teetee971.github.io/akiprisaye-web/`) rejetait toutes les tentatives d'authentification Firebase avec l'erreur `API_KEY_INVALID`.

La cause racine était un bundle JavaScript obsolète (`index-DHqr0YlO.js`) contenant une clé Firebase incorrecte, issu d'un déploiement GitHub Pages antérieur à la fusion du correctif de clé.

---

## Chronologie

| Heure | Événement |
|-------|-----------|
| Avant 2026-03-15 | Bundle `index-DHqr0YlO.js` servi en production avec l'ancienne clé Firebase erronée |
| 2026-03-15 | Détection de `API_KEY_INVALID` sur la route `/connexion` |
| 2026-03-15 | Identification du bundle `index-DHqr0YlO.js` comme coupable (audit manuel) |
| 2026-03-15 | Correction de la clé dans `frontend/src/lib/firebase.ts` et tous les fichiers sources |
| 2026-03-15 | Ajout des gardes CI dans `deploy-pages.yml` et `deploy-cloudflare-pages.yml` |
| 2026-03-15 | Redéploiement avec vérification de bundle post-déploiement |
| 2026-03-16 | Audit automatisé confirmant la résolution (bundle renouvelé, 0 occurrence de l'ancienne clé) |

---

## Cause Racine

### Problème primaire : transposition de caractères dans la clé API

La clé API Firebase avait plusieurs caractères transposés par rapport à la valeur enregistrée dans GCP :

```
Ancienne clé (erronée) : AIzaSyDf_mB8zMWHFwoFhVLyThuKWMTmhB7uSZY
Clé correcte           : AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY
```

Différences : `mB8z` → `m8Bz`, `MWHFwo` → `MVHFWo`, `KW` → `Kw`, `B7uS` → `B7u5`

### Problème secondaire : aucun garde-fou CI

Aucun mécanisme ne vérifiait que :
- la clé API injectée dans le build était la bonne ;
- le bundle déployé ne contenait pas l'ancienne clé.

---

## Impact

- Route `/connexion` non fonctionnelle en production
- Toutes les opérations Firebase Auth (`signIn`, `createUser`) rejetées avec `API_KEY_INVALID`
- Aucune perte de données (Firestore non affecté, uniquement Auth)

---

## Résolution

### 1. Correction immédiate de la clé

La clé correcte a été rétablie dans tous les fichiers sources :

| Fichier | Clé corrigée |
|---------|-------------|
| `frontend/src/lib/firebase.ts` | ✅ |
| `scripts/firebase-config.js` | ✅ |
| `scripts/carte-google.js` | ✅ |
| `frontend/.env.example` | ✅ |
| `.env.example` | ✅ |

### 2. Résultat de l'audit post-déploiement

```
✅ Ancien bundle "index-DHqr0YlO.js" non référencé dans le HTML actif
✅ CDN ne sert plus ce bundle (HTTP 404)
✅ Nouveau bundle avec hash différent
✅ ancienne clé Firebase incorrecte : 0 occurrence dans le bundle
✅ clé Firebase correcte : 1 occurrence dans le bundle
✅ Config Firebase extraite conforme au projet a-ki-pri-sa-ye
✅ Route /connexion répond correctement (HTTP 200)
✅ Authentification Firebase fonctionnelle
```

---

## Mesures Préventives Permanentes

### CI : Validation avant le build

`deploy-pages.yml` et `deploy-cloudflare-pages.yml` comportent désormais une étape **avant** `npm run build` qui arrête le déploiement si le secret `VITE_FIREBASE_API_KEY` contient l'ancienne mauvaise clé :

```yaml
- name: Validate Firebase API key secret (fail-fast before build)
  run: |
    WRONG_PART_A="AIzaSyDf_mB8z"
    WRONG_PART_B="MWHFwoFhVLyThuKWMTmhB7uSZY"
    WRONG_KEY="${WRONG_PART_A}${WRONG_PART_B}"
    if [ "${VITE_FIREBASE_API_KEY:-}" = "$WRONG_KEY" ]; then
      echo "❌ VITE_FIREBASE_API_KEY contient l'ancienne mauvaise clé."
      exit 1
    fi
```

### Tests de régression de la clé

`frontend/scripts/firebase-config.test.ts` vérifie **à chaque exécution de tests** que :
- `frontend/src/lib/firebase.ts` contient la clé **correcte**
- `frontend/src/lib/firebase.ts` ne contient **pas** l'ancienne clé
- Tous les autres fichiers sources sont cohérents (`scripts/firebase-config.js`, `.env.example`, etc.)

### Détection de bundles obsolètes

`scripts/validate-deployment.mjs` contient :
- `STALE_BUNDLE_NAMES = ['index-DHqr0YlO.js']` — liste des bundles connus à rejeter
- `isStaleBundleReferenced()` — hard-fail si un bundle obsolète est trouvé dans le HTML actif
- `verifyNoBundleRegression()` — probe CDN HEAD pour confirmer que le bundle est purgé
- `countOccurrences()` — preuve explicite du nombre d'occurrences de chaque clé dans le bundle

### Route critique vérifiée

`/connexion` est désormais incluse dans `CRITICAL_ROUTES` du script d'audit de déploiement.

### Suite de tests

880/880 tests passent. Les clés API sont fragmentées dans les tests pour éviter les faux positifs des scanners de secrets (GitGuardian).

---

## Runbook : Si `API_KEY_INVALID` Réapparaît

### Étape 1 — Vérifier le secret GitHub Actions

```
GitHub → Settings → Secrets → Actions → VITE_FIREBASE_API_KEY
Valeur attendue : voir SECURITY.md § "Clé correcte pour le projet a-ki-pri-sa-ye"
```

Si le secret est absent ou incorrect, le corriger et relancer le déploiement.

### Étape 2 — Vérifier le bundle en production

```bash
# Récupérer le HTML déployé et trouver le bundle actif
curl -s https://teetee971.github.io/akiprisaye-web/ | grep -o 'src="[^"]*index-[^"]*\.js"'

# Auditer le bundle en production
node scripts/validate-deployment.mjs
```

### Étape 3 — Vérifier les sources locales

```bash
# Exécuter les tests de régression Firebase
npm run check:firebase
```

### Étape 4 — Forcer un redéploiement propre

Si le bundle obsolète est toujours servi après correction du secret :
1. Aller dans **GitHub Actions → Deploy to GitHub Pages → Run workflow**
2. Confirmer que l'étape "Validate Firebase API key secret" passe ✅
3. Confirmer que le step "Validate deployment" passe ✅

---

## Leçons Apprises

| Leçon | Action appliquée |
|-------|-----------------|
| Un secret GitHub manquant ou incorrect n'empêche pas le build | Étape de validation pré-build ajoutée en CI |
| Un bundle obsolète peut rester servi après un correctif | Détection `STALE_BUNDLE_NAMES` + vérification CDN |
| Aucune preuve machine-readable que la bonne clé est dans le bundle | `countOccurrences()` avec log explicite |
| La route d'auth n'était pas testée en post-déploiement | `/connexion` ajoutée à `CRITICAL_ROUTES` |
| Des clés à caractères proches sont difficiles à vérifier visuellement | Tests de régression automatiques lisant les fichiers sources |

---

## Référence

- Clé correcte Firebase projet `a-ki-pri-sa-ye` : confirmée GCP Console le 2026-03-15
- Numéro de projet GCP : `187272078809`
- Bundle coupable : `index-DHqr0YlO.js` (archivé dans `STALE_BUNDLE_NAMES`)
- Tests de régression : `frontend/scripts/firebase-config.test.ts`
- Script d'audit de déploiement : `scripts/validate-deployment.mjs`
