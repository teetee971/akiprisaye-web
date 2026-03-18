# Architecture RBAC — Authentification Créateur Niveau Entreprise

## Vue d'ensemble

L'application A KI PRI SA YÉ implémente un RBAC (Role-Based Access Control) à deux niveaux :

1. **Firebase Custom Claims** (JWT) — résolution instantanée à chaque requête, sans appel réseau
2. **Firestore `users/{uid}.role`** — fallback si les custom claims sont absents

Le composant `AuthContext` consulte les claims en priorité, puis Firestore si nécessaire.

---

## Hiérarchie des rôles

```
guest < citoyen < observateur < creator < admin
  0        1           2           3        4
```

| Rôle        | Description                                      |
|-------------|--------------------------------------------------|
| `guest`     | Non authentifié                                  |
| `citoyen`   | Authentifié, contributeur basique                |
| `observateur` | Observateur enrichi                           |
| `creator`   | Créateur / propriétaire du projet                |
| `admin`     | Administrateur système (accès total)             |

---

## Matrice de permissions

| Permission             | guest | citoyen | observateur | creator | admin |
|------------------------|:-----:|:-------:|:-----------:|:-------:|:-----:|
| `write:prices`         | ✗     | ✓       | ✓           | ✓       | ✓     |
| `write:alerts`         | ✗     | ✓       | ✓           | ✓       | ✓     |
| `read:creator-space`   | ✗     | ✗       | ✗           | ✓       | ✓     |
| `read:admin-space`     | ✗     | ✗       | ✗           | ✗       | ✓     |
| `read:analytics`       | ✗     | ✗       | ✗           | ✓       | ✓     |

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `frontend/src/auth/rbac.ts` | Types, hiérarchie, helpers purs (`hasRole`, `isCreator`, `isAdmin`, `roleFromClaims`) |
| `frontend/src/contexts/AuthContext.tsx` | Résolution claims → Firestore, `refreshClaims()`, dérivés `isCreator`/`isAdmin` |
| `frontend/src/components/auth/RequireAuth.tsx` | Guard d'authentification basique |
| `frontend/src/components/auth/RequireRole.tsx` | Guard générique de rôle (attend `authResolved`) |
| `frontend/src/components/auth/RequireCreator.tsx` | Guard créateur (`RequireRole role="creator"`) |
| `frontend/src/components/auth/RequireAdmin.tsx` | Guard admin (`RequireRole role="admin"`) |
| `frontend/src/App.tsx` | Routage — `/admin/*` wrappé `RequireAdmin`, `/espace-createur` wrappé `RequireCreator` |
| `scripts/set-user-role.mjs` | Script Admin SDK (Custom Claims + Firestore + audit log) |
| `scripts/set-creator-role.mjs` | Alias simplifié — attribue le rôle `creator` |
| `.github/workflows/set-creator-role.yml` | GitHub Actions — promotion via UI sans terminal |

---

## Dérivés dans AuthContext

```ts
isCreator: userRole === "creator" || userRole === "admin"
// → true pour les deux rôles pouvant accéder à l'espace créateur

isAdmin: userRole === "admin"
// → true uniquement pour les admins (accès à /admin/*)
```

> **Important :** `isCreator` et `rbac.ts/isCreator()` sont intentionnellement alignés.
> Un admin a toujours `isCreator = true`. N'utilisez pas `isAdmin` pour protéger
> l'espace créateur — utilisez `isCreator` ou le guard `RequireCreator`.

---

## Flux de résolution du rôle

```
User connecté
    │
    ▼
getIdTokenResult(false)   ← pas de réseau — JWT local
    │
    ├─ claims.role valide → retourner le rôle
    ├─ claims.admin=true  → "admin"
    ├─ claims.creator=true → "creator"
    │
    ▼ (si aucun claim)
Firestore users/{uid}
    │
    ├─ doc.role ∈ {citoyen,observateur,creator,admin} → retourner le rôle
    └─ sinon → "citoyen" (défaut sécurisé)
```

---

## `refreshClaims()` — Quand l'utiliser

Après avoir promu un utilisateur via script ou GitHub Actions, les custom claims
ne sont actifs qu'au prochain rafraîchissement du token Firebase (délai ~1h).

`refreshClaims()` force le rafraîchissement :

```ts
// Dans AuthContext
refreshClaims: async () => {
  await user.getIdTokenResult(true); // force-refresh
  const role = await resolveUserRole(user);
  setUserRole(role);
}
```

**Déclenché :**
- Automatiquement si l'utilisateur se déconnecte / reconnecte
- Manuellement via le bouton "Actualiser le rôle" dans `/espace-createur`
- Via l'API : `const { refreshClaims } = useAuth(); await refreshClaims();`

---

## Procédure de promotion Créateur / Admin

### Méthode 1 — GitHub Actions (recommandée, fonctionne sur mobile)

1. Aller dans l'onglet **Actions** du dépôt GitHub
2. Sélectionner le workflow **"✨ Attribuer un rôle utilisateur"**
3. Cliquer **"Run workflow"**
4. Remplir :
   - `email` : l'adresse Firebase du compte à promouvoir
   - `role` : `creator` ou `admin`
5. Lancer — le workflow appelle `scripts/set-user-role.mjs`
6. L'utilisateur doit ensuite cliquer **"Actualiser le rôle"** dans l'app
   (ou se déconnecter / reconnecter)

**Prérequis :** secret `FIREBASE_SERVICE_ACCOUNT` configuré dans :
`Dépôt → Settings → Secrets and variables → Actions`

---

### Méthode 2 — Terminal local

```bash
# À la racine du dépôt (serviceAccountKey.json déjà présent)
node scripts/set-user-role.mjs teetee971@gmail.com creator
node scripts/set-user-role.mjs admin@example.com admin
```

---

### Méthode 3 — Termux (Android, sans PC)

```bash
# Installer Node.js si absent
node --version 2>/dev/null || pkg install nodejs

# Télécharger le script
cd ~/downloads
curl -fsSL https://raw.githubusercontent.com/teetee971/akiprisaye-web/main/scripts/set-user-role.mjs \
  -o set-user-role.mjs

# Installer firebase-admin et promouvoir
npm install firebase-admin
node set-user-role.mjs teetee971@gmail.com creator
```

> Le script crée automatiquement un `auditLog` Firestore traçant l'action.

---

## Ce que le script `set-user-role.mjs` fait exactement

1. Authentifie via Admin SDK (`serviceAccountKey.json` ou `FIREBASE_SERVICE_ACCOUNT`)
2. Résout l'UID depuis l'email (`admin.auth().getUserByEmail(email)`)
3. Pose les **Custom Claims** : `{ role, creator, admin }` via `setCustomUserClaims(uid, claims)`
4. Met à jour **Firestore** `users/{uid}` : `{ role, updatedAt, updatedBy }`
5. Crée un **audit log** dans `auditLogs/{id}` avec `{ action, targetEmail, role, timestamp }`
6. Affiche un résumé coloré dans le terminal

---

## Guards — Résumé comportemental

| Situation | RequireAuth | RequireRole | RequireCreator | RequireAdmin |
|-----------|:-----------:|:-----------:|:--------------:|:------------:|
| loading=true | ⏳ spinner | ⏳ spinner | ⏳ spinner | ⏳ spinner |
| authResolved=false | ⏳ spinner | ⏳ spinner | ⏳ spinner | ⏳ spinner |
| user=null | → /login | → /login | → /login | → /login |
| citoyen | ✓ | → / | → / | → / |
| creator | ✓ | dépend du role | ✓ | → / |
| admin | ✓ | dépend du role | ✓ | ✓ |

---

## Tests

```bash
# Tests unitaires RBAC (helpers purs)
cd frontend && npx vitest run src/test/rbac.test.ts

# Tests des guards (RequireRole, RequireCreator, RequireAdmin)
npx vitest run src/test/requireRole.test.tsx

# Tests du composant EspaceCreateur (guard inline + route guard)
npx vitest run src/test/creatorGuard.test.tsx

# Suite complète
npx vitest run
```

---

## Risques connus

| Risque | Mitigation |
|--------|-----------|
| Claims expirés (~1h) | `refreshClaims()` manuel ou reconnexion |
| Firestore hors ligne | Fallback à `"citoyen"` (sécurisé par défaut) |
| Token volé | Custom claims inclus dans le JWT signé Firebase — invalidés à la révocation |
| Admin supprimé de Firebase mais claims encore actifs | Le token expire au max 1h ; révoquer via `admin.auth().revokeRefreshTokens(uid)` |

---

## Checklist de validation manuelle post-déploiement

- [ ] Se connecter avec un compte `citoyen` → `/espace-createur` redirige vers `/`
- [ ] Se connecter avec un compte `citoyen` → `/admin` redirige vers `/`
- [ ] Promouvoir le compte via GitHub Actions (`role=creator`)
- [ ] Cliquer "Actualiser le rôle" dans l'app → rôle change à `creator`
- [ ] `/espace-createur` accessible, heading "Espace Créateur" présent
- [ ] `/admin` toujours interdit (creator n'est pas admin)
- [ ] Promouvoir le compte via GitHub Actions (`role=admin`)
- [ ] Actualiser le rôle → `/admin` accessible
- [ ] `/espace-createur` accessible (admin a `isCreator=true`)
- [ ] Audit log présent dans Firestore `auditLogs/`
