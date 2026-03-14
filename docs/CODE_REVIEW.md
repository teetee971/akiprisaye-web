# Revues de Code — A KI PRI SA YÉ

Ce document décrit le processus de revue de code en vigueur dans ce dépôt, les critères de qualité attendus, et les outils automatisés mis en place.

---

## 1. Processus de revue

### Qui revoit ?

- **Propriétaire obligatoire :** `@teetee971` — toute PR doit être approuvée par le propriétaire du dépôt (voir [`.github/CODEOWNERS`](../CODEOWNERS)).
- Le fichier `CODEOWNERS` assigne automatiquement les réviseurs lors de l'ouverture d'une PR.

### Quand une PR est-elle prête ?

Une PR est prête à être soumise à revue quand :

1. ✅ La CI est verte (lint, typecheck, tests, build)
2. ✅ La checklist du template de PR est remplie
3. ✅ Le rapport de revue automatique ne signale aucun avertissement critique
4. ✅ La description explique clairement le contexte et les changements

---

## 2. Checklist de qualité

Avant chaque PR, vérifier systématiquement les points suivants.

### 🔒 Sécurité

| Critère | Règle |
|---------|-------|
| `JSON.parse` | Toujours protégé par `try/catch` ou via `safeLocalStorage.getJSON()` |
| `console.log` | Jamais en production — utiliser `if (import.meta.env.DEV) { console.log(...) }` |
| Données utilisateur | Aucune donnée sensible dans `localStorage` sans chiffrement ou TTL |
| Firestore | Toute nouvelle collection doit être couverte par des règles `firestore.rules` strictes |

### 🏷️ TypeScript

| Critère | Règle |
|---------|-------|
| `@ts-nocheck` | **Interdit** dans les nouveaux fichiers — corriger les erreurs TypeScript |
| `any` | Éviter — utiliser des types précis ou `unknown` avec guards |
| Erreurs `catch` | Utiliser `instanceof Error` plutôt que `catch (e: any)` |

### ⚛️ React

| Critère | Règle |
|---------|-------|
| `key={index}` | **Interdit** dans les listes mutables — utiliser un identifiant stable et unique |
| Dépendances `useEffect` | Toutes les dépendances utilisées dans le corps du hook doivent figurer dans le tableau |
| Promesses sans `.catch()` | Toujours gérer les erreurs asynchrones |

### 🚀 Performance

| Critère | Règle |
|---------|-------|
| Listes longues | Utiliser `useMemo` / `useCallback` pour les calculs coûteux |
| `useEffect` sans cleanup | Les abonnements, timers et listeners doivent être nettoyés |

---

## 3. Outils automatisés

### Workflow `code-review.yml`

Déclenché à chaque PR, ce workflow :

- Détecte les `@ts-nocheck` ajoutés
- Signale les `console.log` introduits dans le code de production
- Compte les `JSON.parse` non protégés ajoutés
- Identifie les `key={index}` dans les JSX
- Publie un commentaire de synthèse directement dans la PR

### CI (`ci.yml`)

- **Lint** : ESLint strict (`noImplicitAny`, `noUnusedLocals`)
- **Typecheck** : TypeScript en mode CI (`tsconfig.ci.json`)
- **Tests** : Vitest (mode `run`)
- **Build** : Vite (production)

### CodeQL (`codeql.yml`)

Analyse statique de sécurité sur `push:main` et `pull_request:main`.

---

## 4. Standards de commit

Format recommandé : **Conventional Commits**

```
type(scope): description courte

Corps optionnel expliquant le pourquoi.
```

**Types courants :**

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `perf` | Amélioration de performance |
| `test` | Ajout ou modification de tests |
| `chore` | Maintenance, dépendances, CI |
| `docs` | Documentation uniquement |
| `security` | Correction de vulnérabilité |

---

## 5. Points bloquants (rejet automatique)

Les PR suivantes sont rejetées automatiquement par la CI :

- ❌ Lint en échec
- ❌ TypeScript en erreur
- ❌ Tests échoués
- ❌ Build cassé
- ❌ Fichiers interdits détectés (voir `repo-guard.yml`)
- ❌ Vulnérabilités npm de niveau `high` ou `critical`

---

## 6. Bonnes pratiques

### Taille des PR

- **Idéal :** < 400 lignes modifiées
- **Maximum recommandé :** 800 lignes
- Au-delà, découper en PR plus petites et cohérentes

### Description

Une bonne description de PR contient :
1. **Contexte** — pourquoi ce changement est nécessaire
2. **Changements** — ce qui a été modifié et comment
3. **Tests** — comment les changements ont été vérifiés
4. **Impact** — effets de bord potentiels

### Réponse aux commentaires

- Répondre à chaque commentaire (même pour confirmer que c'est pris en compte)
- Utiliser "Resolve conversation" uniquement après avoir appliqué le changement demandé
- Si vous n'êtes pas d'accord, expliquer votre point de vue

---

*Document maintenu par `@teetee971` — mis à jour le 2026-03-14.*
