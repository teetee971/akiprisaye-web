# Diagnostic exhaustif du repo — A KI PRI SA YÉ

> Généré le : 2026-03-20  
> Périmètre : dépôt complet, aucun fichier exclu volontairement  
> Méthode : inspection statique fichier par fichier, sans exécution de code  

---

## 1. Inventaire

### 1.1 Métriques globales

| Indicateur | Valeur |
|---|---|
| Fichiers totaux (hors node_modules, .git, dist) | 2 351 |
| Fichiers TypeScript / TSX | 1 517 |
| Fichiers JavaScript / JSX (frontend) | ~45 |
| Pages frontend | 186 |
| Composants frontend | ~180 |
| Services frontend | ~90 |
| Hooks frontend | ~55 |
| Workflows GitHub Actions actifs | 24 |
| Workflows archivés | 26 |
| Fichiers de test frontend (vitest) | 93 (déclarés dans allowlist) |

### 1.2 Structure des répertoires principaux

```
akiprisaye-web/
├── .github/
│   ├── workflows/          ← 24 workflows actifs
│   └── workflows-archived/ ← 26 workflows archivés (inactifs)
├── android/                ← Capacitor Android (non utilisé en CI)
├── backend/                ← API Express/Prisma/PostgreSQL (autonome)
├── data/                   ← Données JSON brutes (non versionné typé)
├── docs/                   ← Documentation (nombreux fichiers MD)
├── extension/              ← Extension navigateur (non auditée ici)
├── frontend/               ← Application React principale (Vite/TS)
│   ├── scripts/            ← Scripts de build/CI/Lighthouse/deployment
│   ├── src/
│   │   ├── App.tsx         ← Point d'entrée React (787 lignes)
│   │   ├── auth/           ← State machine auth (6 modules)
│   │   ├── billing/        ← Entitlements/plans (frontend seulement)
│   │   ├── components/     ← ~180 composants
│   │   ├── context/        ← Contextes React (doublons .jsx/.tsx)
│   │   ├── contexts/       ← AuthContext.tsx (Firebase)
│   │   ├── hooks/          ← ~55 hooks custom
│   │   ├── pages/          ← 186 pages (mélange .jsx/.tsx)
│   │   ├── services/       ← ~90 services
│   │   └── types/          ← ~50 fichiers de types
├── functions/              ← Firebase Cloud Functions
├── price-api/              ← Cloudflare Worker D1 (API prix)
├── public/                 ← Assets statiques déployés
├── scripts/                ← Scripts root (hétérogènes)
├── shared/                 ← Types partagés (3 fichiers seulement)
└── tools/                  ← Outils non audités
```

### 1.3 Points d'entrée

- **Frontend** : `frontend/src/main.tsx` → `frontend/src/App.tsx`
- **Backend** : `backend/src/app.ts` (Express, port 3001)
- **Price-API** : `price-api/src/` (Cloudflare Worker)
- **Functions** : `functions/src/` (Firebase Cloud Functions)
- **CI/CD** : `.github/workflows/ci.yml` (lint/typecheck/test/build) + `deploy-pages.yml` (production GitHub Pages)

---

## 2. Audit fichier par fichier

### Racine

---

**Fichier : `.env.example`**
- **Rôle** : Template de configuration pour le développement local
- **État** : À surveiller
- **Constats** :
  1. Contient la clé API Firebase réelle (public par design Firebase) : `AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY`
  2. Présence du `messagingSenderId` (`187272078809`) et `appId` complets
  3. Version `APP_VERSION=4.6.1` alignée avec `package.json` version `4.6.1` (corrigé)
  4. Nombreux feature flags avec `false` comme valeur par défaut — 40+ variables non documentées dans le contexte prod
- **Risques** : Risque de désalignement futur si la version n'est pas mise à jour à chaque release. Les clés Firebase étant publiques, pas de risque sécurité direct, mais toute rotation de clé nécessite de synchroniser `.env.example` et les secrets CI.
- **Action minimale** : Maintenir la synchronisation `APP_VERSION` ↔ `package.json` à chaque release. Documenter quels flags sont actifs en production.

---

**Fichier : `robots.txt`**
- **Rôle** : Contrôle du crawl par les moteurs de recherche
- **État** : À surveiller
- **Constats** :
  1. `Disallow: /mon-compte` — URL inexacte : la route réelle dans App.tsx est `/mon-compte` (OK)
  2. `Disallow: /stats-dashboard` — Route réelle est `/stats-dashboard` (OK)
  3. `Disallow: /admin/` — Correct
  4. `Sitemap:` pointe vers `teetee971.github.io` — incohérent si déploiement Cloudflare Pages (`akiprisaye-web.pages.dev`)
  5. `Crawl-delay: 1` — non reconnu par Google (ignoré)
- **Risques** : Si Cloudflare Pages devient l'URL canonique, les robots.txt/sitemap.xml devront être mis à jour.
- **Action minimale** : Ajouter une URL de sitemap pour Cloudflare Pages, ou centraliser sur un seul domaine.

---

**Fichier : `sitemap.xml`**
- **Rôle** : Sitemap SEO statique (387 lignes, 77 URLs)
- **État** : Problématique
- **Constats** :
  1. Fichier statique, généré manuellement — aucun mécanisme de mise à jour automatique en prod
  2. Le script `scripts/generate-sitemap.mjs` existe mais n'est pas appelé dans le pipeline de build/deploy
  3. 77 URLs listées vs 186 pages dans le code — au moins 100+ pages non référencées dans le sitemap
  4. URLs avec query string (`?territory=GP`) dans le sitemap — Google recommande les URLs canoniques sans paramètres ou avec canonical tag
  5. Pas d'entrée `/produit/:slug` ni `/categorie/:slug` pour les pages SEO dynamiques
- **Risques** : Pages SEOProductPage et SEOCategoryPage non indexées (non présentes dans sitemap). Manque à gagner significatif pour le trafic organique.
- **Preuves** : `grep "<loc>" sitemap.xml | wc -l` = 77 vs `ls frontend/src/pages | wc -l` = 186
- **Action minimale** : Exécuter `scripts/generate-sitemap.mjs` dans le `postbuild` ou dans `deploy-pages.yml`.

---

**Fichier : `service-worker.js` (racine)**
- **Rôle** : Service Worker enregistré depuis la racine
- **État** : À surveiller
- **Constats** :
  1. Fichier distinct de `public/service-worker.js` et `public/sw.js` — risque de doublon/confusion
  2. Pas de precache de `index.html` (intentionnel, documenté)
  3. La logique network-first pour navigate/document est correcte
  4. Version `v2` hardcodée — toute invalidation de cache nécessite un changement de code
  5. `CORE_ASSETS = ['/', '/manifest.json']` — `/` renvoie sur `index.html` mais l'URL GitHub Pages est `/akiprisaye-web/`
- **Risques** : Si l'URL de base est `/akiprisaye-web/`, le cache `'/'` ne correspond pas à la page d'accueil réelle.
- **Preuves** : `const CORE_ASSETS = ['/', '/manifest.json']` ; base configurée comme `/akiprisaye-web/` dans CI.
- **Action minimale** : Vérifier que `CORE_ASSETS` est cohérent avec `BASE_PATH`. Utiliser une variable plutôt qu'un string hardcodé.

---

**Fichier : `manifest.webmanifest`**
- **Rôle** : Manifest PWA
- **État** : À surveiller
- **Constats** :
  1. `start_url: "/"` — incohérent avec le base path `/akiprisaye-web/` en production GitHub Pages
  2. `scope: "/"` — idem, devrait être `/akiprisaye-web/`
  3. Raccourcis (`shortcuts`) pointent vers `/comparateur`, `/scan`, `/carte` sans le prefix
  4. `screenshots: []` — tableau vide, nuit au score PWA
  5. Icônes `/Assets/icon_*.webp` avec capital A — sensible à la casse en environnement Linux
- **Risques** : L'install PWA peut échouer ou pointer vers la mauvaise URL sur GitHub Pages.
- **Action minimale** : Injecter `start_url` et `scope` dynamiquement au build selon `BASE_PATH`, ou générer depuis Vite.

---

**Fichier : `firebase.json`**
- **Rôle** : Configuration Firebase Hosting
- **État** : À surveiller
- **Constats** :
  1. `hosting.public: "."` — pointe vers la racine du repo, pas vers `frontend/dist`
  2. Les règles d'ignorance excluent `**/dist/**` — ainsi, le build Vite serait EXCLU du déploiement Firebase Hosting
  3. Pas de CSP (Content-Security-Policy) dans les headers
  4. Le header `Permissions-Policy` restreint `camera=()` — en contradiction avec les features de scan de l'app
  5. Les fonctions Firebase pointent vers `functions/` (correct)
  6. Fichier de configuration utilisé aussi pour le déploiement Firebase, mais le déploiement principal est GitHub Pages
- **Risques** : Si `firebase deploy --only hosting` est exécuté, le build de production ne serait pas déployé correctement.
- **Preuves** : `"public": "."` + `"**/dist/**"` dans la liste d'ignorance.
- **Action minimale** : Corriger `hosting.public` vers `frontend/dist`, retirer `**/dist/**` des ignores si Firebase Hosting est utilisé. Ajouter un header CSP.

---

**Fichier : `firestore.rules`**
- **Rôle** : Règles de sécurité Firestore
- **État** : OK (avec réserves)
- **Constats** :
  1. Règles bien structurées, lecture publique pour les prix/produits
  2. Création de `price_observations` nécessite `request.auth != null` — correct
  3. Règles `users/{userId}` : l'utilisateur ne peut pas modifier `role`, `roleUpdatedAt`, `roleUpdatedBy` — sécurisé
  4. `auditLogs` : écriture bloquée côté client — correct
  5. `contact_messages` : validation de structure documentaire présente
  6. Pas de règle default `allow read, write: if false` explicite pour les collections non déclarées
- **Risques** : Collections non listées dans les règles sont bloquées par défaut en Firestore — acceptable mais mérite une règle explicite.
- **Action minimale** : Ajouter une règle catch-all `match /{document=**} { allow read, write: if false; }` pour documenter l'intention.

---

**Fichier : `akiprisaye-web/` (sous-répertoire)**
- **Rôle** : Inconnu — répertoire imbriqué avec `package.json` et `frontend/package.json`
- **État** : Suspect / mort
- **Constats** :
  1. Répertoire `akiprisaye-web/` à la racine du repo `akiprisaye-web` — structure récursive
  2. Contient `package.json` et `akiprisaye-web/frontend/package.json`
  3. Non référencé par aucun workflow actif
  4. Semble être un artefact d'une ancienne tentative de déploiement ou de clonage imbriqué
- **Risques** : Confusion lors des opérations git/npm. Risque de conflit avec les scripts qui cherchent `frontend/package.json`.
- **Action minimale** : Supprimer ce répertoire après vérification qu'il est bien mort.

---

**Fichier : `scripts/add-preload.` (extension vide)**
- **Rôle** : Inconnu — fichier vide avec nom invalide (extension = point)
- **État** : Mort / inutile
- **Constats** : Taille 0 octet. Même situation pour `scripts/optimize-public-assets.`
- **Risques** : Confusion, bruit dans `ls`. Peut déclencher des faux positifs dans des scripts qui globent `scripts/*`.
- **Action minimale** : Supprimer ces deux fichiers.

---

**Fichier : `capacitor.config.ts`**
- **Rôle** : Configuration Capacitor pour le build Android
- **État** : À surveiller
- **Constats** : Présent mais le build Android n'est plus dans les workflows actifs (archivé dans `workflows-archived/android-play.yml`).
- **Action minimale** : Documenter si Android est abandonné ou en attente.

---

### .github/workflows

---

**Fichier : `.github/workflows/ci.yml`**
- **Rôle** : Pipeline CI principal (lint, typecheck, test, build, verify-pages, lighthouse)
- **État** : OK (bien structuré)
- **Constats** :
  1. 8 jobs parallèles bien découpés
  2. Job `build-test` de compatibilité ascendante — documenté, justifié
  3. Lighthouse avec `@lhci/cli@0.15.1` — version hardcodée dans `run:`, risque de désynchronisation avec les dépendances npm
  4. La vérification Firebase API key (`firebase-config` test) est exécutée deux fois : dans `test` job ET dans `check:firebase` script root
  5. Seuil de warnings ESLint hardcodé à 17 dans `eslint-warning-check.mjs` — dette technique figée
  6. Le job `price-api` utilise `npm install` (pas `npm ci`) — non déterministe
  7. TypeScript CI utilise `tsconfig.ci.json` qui **désactive** `strict`, `strictNullChecks`, `noImplicitAny` — la typecheck CI est significativement moins stricte que la config locale
- **Risques** : La CI peut passer avec des erreurs TypeScript qui échoueraient localement.
- **Preuves** : `tsconfig.ci.json` → `"strict": false`, `"strictNullChecks": false`, `"noImplicitAny": false`.
- **Action minimale** : Utiliser `npm ci` pour price-api. Aligner `tsconfig.ci.json` sur `tsconfig.json` progressivement.

---

**Fichier : `.github/workflows/deploy-pages.yml`**
- **Rôle** : Déploiement production sur GitHub Pages
- **État** : OK (robuste)
- **Constats** :
  1. Logique de déploiement bien gardée (double condition `if: github.ref == 'refs/heads/main'`)
  2. Validation `verify-live` avec 36 tentatives × 10s = 6 minutes max — acceptable
  3. Badge LIVE mis à jour via git push — peut créer des conflits si plusieurs workflows commitent en même temps
  4. La validation post-deploy (`validate`) lance `scripts/validate-deployment.mjs` 3 fois avec 30s de délai — redondant mais sécuritaire
  5. `VITE_FIREBASE_*` secrets sont injectés — si non définis, le fallback hardcodé s'applique (documenté)
- **Action minimale** : Protéger le push du badge avec `--no-verify` ou un token dédié pour éviter les boucles.

---

**Fichier : `.github/workflows/auto-merge.yml`**
- **Rôle** : Auto-merge des PRs Copilot/Dependabot
- **État** : À surveiller
- **Constats** :
  1. Utilise `pull_request_target` — trigger avec accès aux secrets du dépôt, potentiellement dangereux
  2. Auto-merge activé pour toutes les PRs commençant par `copilot/` — inclut cette PR
  3. Condition basée uniquement sur le préfixe de branche, pas sur les labels ni sur le résultat des checks
- **Risques** : Un attaquant créant une branche `copilot/malicious` depuis un fork peut déclencher l'auto-merge si les checks passent.
- **Action minimale** : Restreindre à `github.actor == 'github-actions[bot]'` (Copilot officiel) et exiger que tous les checks CI soient verts.

---

**Fichier : `.github/workflows/security-audit.yml`**
- **Rôle** : Vérification des vulnérabilités npm et de `docs/security/SECURITY_AUDIT.md`
- **État** : OK
- **Constats** :
  1. Baseline HIGH vulnérabilités = 0 (mis à jour 2026-03-13)
  2. Vérifie l'existence de `docs/security/SECURITY_AUDIT.md` — bonne pratique
  3. Utilise `npm install --package-lock-only` pour créer le lockfile avant audit — fragile si lockfile absent

---

**Fichier : `.github/workflows/auto-scraping.yml`**
- **Rôle** : Scraping automatique quotidien des prix DOM-TOM
- **État** : À surveiller
- **Constats** :
  1. Nécessite `FIREBASE_SERVICE_ACCOUNT` (secret) et `OPENAI_API_KEY` (optionnel)
  2. Commite les données directement sur `main` — risque de conflits avec des PRs ouvertes
  3. Le workflow `auto-update-prices.yml` s'exécute à 6h30 UTC, juste après `auto-scraping.yml` à 6h00 — risque de condition de course
  4. Les deux workflows partagent le groupe de concurrence `auto-update-prices` — seul `auto-update-prices.yml` le déclare explicitement
- **Risques** : Si les deux workflows s'exécutent simultanément et commitent sur main, risque de conflit git.
- **Action minimale** : Unifier le groupe de concurrence ou chaîner les workflows via `workflow_run`.

---

**Fichier : `.github/workflows/backend-ci.yml`**
- **Rôle** : CI backend (lint, build, test)
- **État** : À surveiller
- **Constats** :
  1. Déclenché uniquement sur modifications dans `backend/**` — pas inclus dans le CI principal
  2. Utilise `actions/checkout@v4` alors que tous les autres workflows utilisent `@v5` — incohérence
  3. Pas de test de migration Prisma ni de validation du schéma
- **Action minimale** : Aligner sur `@v5`. Ajouter `prisma validate` dans le CI.

---

**Fichier : `.github/workflows/codeql.yml`**
- **Rôle** : Analyse statique CodeQL
- **État** : OK
- **Constats** : Deux cron différents (lundi et mardi) — doublon apparent. Analyse `javascript-typescript` et `actions`. Correct.

---

**Fichier : `.github/workflows/repo-guard.yml`**
- **Rôle** : Vérification de l'absence de pointeurs LFS et de fichiers indésirables
- **État** : OK (avec lacune)
- **Constats** : Ne détecte pas les fichiers à extension vide comme `add-preload.` et `optimize-public-assets.`.

---

### frontend

---

**Fichier : `frontend/src/main.tsx`**
- **Rôle** : Point d'entrée React
- **État** : OK
- **Constats** :
  1. Bootstrap monitoring (crash probe, error tracker) avant render — correct
  2. Sentry et web-vitals différés via `requestIdleCallback` — correct
  3. `window.__BUILD_SHA__` exposé globalement — acceptable pour le debugging
  4. Import dynamique de `priceCacheService` non-bloquant — correct

---

**Fichier : `frontend/src/App.tsx`**
- **Rôle** : Routeur principal React (787 lignes)
- **État** : À surveiller
- **Constats** :
  1. 787 lignes — fichier très long, difficile à maintenir
  2. ~60 imports de pages lazy avec `lazyPage()` — correct pour la performance
  3. Plusieurs pages importées mais peut-être jamais routées (vérification exhaustive impossible ici)
  4. Pattern de pré-chargement parallèle (`_langProviderImport`, `_authProviderImport`, `_entitImport`) — correct
  5. `ErrorBoundary` importé depuis `./components/ErrorBoundary` qui est un fichier `.jsx` — pas de types TypeScript
- **Action minimale** : Décomposer App.tsx en fichiers de routes séparés.

---

**Fichier : `frontend/src/lib/firebase.ts`**
- **Rôle** : Initialisation Firebase SDK
- **État** : OK (sécurité bien gérée)
- **Constats** :
  1. Clé API hardcodée en fallback (`AIzaSyDf_m8BzMVHFWoFhVLyThuKwWTMhB7u5ZY`) — justifié (clés Firebase publiques)
  2. Détection de l'ancienne mauvaise clé (transposition `B8`→`8B`) via `charAt()` — intelligent
  3. Détection des secrets manquants (`missingCriticalEnvKeys`) — bon pour le debugging
  4. Firebase Analytics conditionnelle sur la présence de `window` — correct pour Vitest/SSR
  5. Module lazy-loaded dans App.tsx — correct pour le bundle splitting

---

**Fichier : `frontend/src/context/authHook.ts`**
- **Rôle** : Contexte React léger (zero import Firebase runtime)
- **État** : OK
- **Constats** :
  1. Design correct : sépare le contexte de l'implémentation Firebase
  2. Bien documenté avec le rationnel de performance

---

**Fichier : `frontend/src/context/AuthContext.tsx` (barrel)**
- **Rôle** : Re-export de `authHook` — barrel file
- **État** : OK

---

**Fichier : `frontend/src/context/AuthContext.jsx` (shim)**
- **Rôle** : Shim de compatibilité `.jsx` → re-exporte `../contexts/AuthContext`
- **État** : À surveiller
- **Constats** :
  1. Crée une confusion : `context/AuthContext.jsx` re-exporte `contexts/AuthContext` (avec 's')
  2. Certains composants importent `useAuth` depuis `@/context/AuthContext` (sans 's') → résout vers ce shim → résout vers `AuthContext.tsx` (contexts) → importe tout Firebase
  3. Cela court-circuite le pattern de bundle splitting de `authHook.ts`

- **Preuves** : `SocialLoginButtons.tsx:15`, `AuthDebugPanel.tsx:22`, `Login.tsx:8`, `MonCompte.tsx:5`, `Inscription.tsx:11`, `usePlan.ts:2`, `useQuota.ts:2`, `SignalerAbus.tsx:3`, `SyncDashboard.tsx:7` importent tous `useAuth` depuis `@/context/AuthContext` au lieu de `@/context/authHook`
- **Risques** : Firebase SDK potentiellement présent dans des chunks critiques à cause de ces imports indirects.
- **Action minimale** : Corriger les 15 fichiers concernés pour importer depuis `@/context/authHook`.

---

**Fichier : `frontend/src/contexts/AuthContext.tsx`**
- **Rôle** : Provider Firebase complet (485 kB gzip)
- **État** : OK
- **Constats** : Logique d'authentification complète, bien structurée. Lazy-loaded dans App.tsx.

---

**Fichier : `frontend/src/context/ThemeContext.jsx`**
- **Rôle** : Shim de compatibilité pour ThemeContext
- **État** : OK (avec dette)
- **Constats** : Re-exporte depuis `ThemeContext.tsx`. Le shim `.jsx` est nécessaire car certains fichiers anciens l'importaient. Devrait être supprimé quand tous les imports sont migrés.

---

**Fichier : `frontend/src/components/ui/GlassCard.d.ts`**
- **Rôle** : Déclaration de types pour `GlassCard`
- **État** : Problématique
- **Constats** :
  1. Déclare tous les exports comme `any` : `declare const GlassCard: any;`, `export const GlassCardHeader: any;`
  2. Coexiste avec `GlassCard.jsx`, `glass-card.tsx`, `glass-card.jsx`, `GlassContainer.jsx`
  3. 5 fichiers distincts pour la même entité conceptuelle — pas de source de vérité unique
  4. Les pages admin (`AdminDashboard.tsx`, `StoreList.tsx`, etc.) importent `GlassCard` depuis des chemins différents
- **Risques** : Perte totale des types pour tous les consommateurs de `GlassCard`. Breakage possible si l'implémentation change.
- **Preuves** : `GlassCard.d.ts` line 1; pages admin utilisant à la fois `import GlassCard from` (default) et `import { GlassCard } from` (named)
- **Action minimale** : Supprimer `GlassCard.d.ts`. Choisir un seul fichier source (`glass-card.tsx` est le mieux typé). Rediriger tous les imports.

---

**Fichier : `frontend/src/components/Layout.jsx`**
- **Rôle** : Layout principal (Header, Footer, Outlet)
- **État** : À surveiller
- **Constats** :
  1. Fichier `.jsx` dans un contexte TypeScript — pas de types
  2. Inclut `usePriceAlertEvaluator`, `usePrivacyConsent` — logique métier dans le layout
  3. Pas de Suspense boundary au niveau du Layout pour les erreurs

---

**Fichier : `frontend/src/components/ErrorBoundary.jsx`**
- **Rôle** : Error boundary React (catch d'erreurs de rendu)
- **État** : À surveiller
- **Constats** : Fichier `.jsx` (pas TypeScript). Manque un `import PropTypes` ou types TS. `console.error` laissé dans le code (Terser le drop en prod).

---

**Fichier : `frontend/src/pages/` (186 pages)**
- **Rôle** : Pages de l'application
- **État** : À surveiller (mix JSX/TSX)
- **Constats** :
  1. 19 pages sont en `.jsx` : `AIDashboard.jsx`, `APropos.jsx`, `Actualites.jsx`, `AdminDashboard.jsx`, `AiMarketInsights.jsx`, `AlerteDetail.jsx`, `Alertes.jsx`, `BudgetReelMensuel.jsx`, `BudgetVital.jsx`, `Carte.jsx`, `Comparateur.jsx`, `DossierMedia.jsx`, `EvaluationCosmetique.jsx`, `HistoriquePrix.jsx`, `IEVR.jsx`, `IaConseiller.jsx`, `MentionsLegales.jsx`, `TiPanie.jsx` + fichiers de test
  2. `pages/index.ts` est auto-généré (2026-01-03) et ne liste que 20 pages sur 186 — largement incomplète
  3. SEOHead est présent dans 142/186 pages — 44 pages sans meta tags SEO
  4. Pages critiques sans SEOHead : non vérifiable exhaustivement en statique, mais plusieurs pages `.jsx` ne l'ont pas
  5. Plusieurs pages apparemment orphelines (non routées dans App.tsx) : `AiMarketInsights.jsx`, `ModuleAuditPage.tsx`, `Perimetre.tsx`, `Versions.tsx`, `ChecklistProduction.tsx`

---

**Fichier : `frontend/src/pages/SEOProductPage.tsx`**
- **Rôle** : Page produit SEO dynamique (`/produit/:slug`)
- **État** : OK
- **Constats** :
  1. JSON-LD Product schema, breadcrumb, FAQ — correct
  2. Lazy-loaded PriceHistory et SmartSignal — correct
  3. `noIndex` conditionnel selon la disponibilité des données — correct
  4. Utilise `trackProductView` et `trackRetailerClick` — analytics localStorage, RGPD-safe

---

**Fichier : `frontend/src/pages/SEOCategoryPage.tsx`**
- **Rôle** : Page catégorie SEO dynamique (`/categorie/:slug`)
- **État** : OK

---

**Fichier : `frontend/src/utils/seoHelpers.ts`**
- **Rôle** : Génération de meta tags, JSON-LD, slugs
- **État** : OK
- **Constats** : `SITE_URL` hardcodé en `teetee971.github.io` — devrait être une constante configurable pour supporter Cloudflare Pages.

---

**Fichier : `frontend/src/utils/retailerLinks.ts`**
- **Rôle** : URLs UTM enrichies des enseignes
- **État** : À surveiller
- **Constats** :
  1. `affiliateEnabled: false` dans `bookingLinks.ts` — pas de revenus d'affiliation actifs
  2. `RETAILER_URLS` liste 13 enseignes, sans les spécifiques DOM-TOM (Maxi, Générale Alimentaire…)
  3. `E.Leclerc` → `https://www.e.leclerc/` — URL invalide (domaine incorrect)
- **Preuves** : `'E.Leclerc': 'https://www.e.leclerc/'` — `.e.leclerc` n'est pas un TLD valide, devrait être `e.leclerc` ou `courses.leclerc`
- **Action minimale** : Corriger l'URL E.Leclerc. Ajouter les enseignes DOM-TOM manquantes.

---

**Fichier : `frontend/src/utils/priceClickTracker.ts`**
- **Rôle** : Tracker analytique localStorage (RGPD-safe)
- **État** : OK
- **Constats** : Bien conçu. Cap à 50 entrées, TTL 30 jours, aucune sortie réseau.

---

**Fichier : `frontend/src/billing/plans.ts`**
- **Rôle** : Définition des plans d'abonnement
- **État** : OK
- **Constats** :
  1. 7 plans définis (`FREE`, `FREEMIUM`, `CITIZEN_PREMIUM`, `PRO`, `BUSINESS`, `INSTITUTION`, `CREATOR`)
  2. Plans définis côté frontend uniquement — pas de vérification backend des droits
  3. `EntitlementProvider` lit depuis Firestore — correct mais sans token de vérification serveur

---

**Fichier : `frontend/src/billing/EntitlementProvider.tsx`**
- **Rôle** : Provider React pour les droits d'accès
- **État** : À surveiller
- **Constats** :
  1. Importe `useAuth` depuis `@/contexts/AuthContext` (avec 's') — pull Firebase dans son chunk
  2. Pas de cache local — requête Firestore à chaque mount du Provider
- **Action minimale** : Importer `useAuth` depuis `@/context/authHook`.

---

**Fichier : `frontend/src/services/smartShoppingListService.ts`**
- **Rôle** : Service de liste de courses intelligente
- **État** : Problématique (stub)
- **Constats** :
  1. 4 méthodes avec `// TODO: Implement real optimization algorithm`
  2. `optimizeRoute` retourne une liste non triée avec commentaire `// TODO: Implement nearest neighbor TSP algorithm`
  3. `getSimilarProducts` retourne tableau vide avec `// TODO: Implement product similarity search`
  4. `exportToPDF` retourne `null` avec `// TODO: Implement PDF export with jspdf`
- **Risques** : Fonctionnalités affichées à l'utilisateur mais non implémentées. Risque UX et réputation.
- **Action minimale** : Soit implémenter, soit désactiver ces features via feature flags.

---

**Fichier : `frontend/src/services/invoiceOCRService.ts`**
- **Rôle** : Service OCR de factures
- **État** : Problématique (stub)
- **Constats** :
  1. `processInvoice()` → `// TODO: Implémenter OCR réel avec Tesseract.js`
  2. `extractFromPDF()` → `// TODO: Implémenter extraction PDF avec pdf.js`
  3. Les deux méthodes retournent des données simulées en dur
- **Risques** : Idem — feature annoncée non implémentée.

---

**Fichier : `frontend/src/services/catalogueService.ts`**
- **Rôle** : Service de catalogue produits
- **État** : À surveiller
- **Constats** : `// TODO: implement real fetching (HTTP, cloud storage, etc.)` — retourne un tableau mocké.

---

**Fichier : `frontend/src/services/alertService.ts`**
- **Rôle** : Gestion des alertes prix
- **État** : À surveiller
- **Constats** :
  1. `// TODO: Send notification based on notificationMethod` (ligne 272)
  2. `// TODO: Implement server-side alert checking` (ligne 331)
  3. Les alertes sont entièrement gérées côté client (localStorage) — pas de persistence serveur

---

**Fichier : `frontend/src/services/featureFlagsService.ts`**
- **Rôle** : Service de feature flags
- **État** : À surveiller
- **Constats** : `// TODO: In the future, check user subscription in database` — les feature flags sont actuellement basés sur les variables d'environnement, pas sur un système serveur dynamique.

---

**Fichier : `frontend/src/types/` (~50 fichiers)**
- **Rôle** : Types TypeScript
- **État** : À surveiller
- **Constats** :
  1. `fuelComparison.d.ts` (déclaration `.d.ts`) ET `fuelComparison.ts` (implémentation) coexistent — doublon probable
  2. `catalogueService.d.ts` coexiste avec l'implémentation — idem
  3. `service-comparison.d.ts` avec `.d.ts` explicit
  4. `global.d.ts` présent — acceptable
  5. 404 occurrences de `any` dans le code frontend, dont `GlassCard.d.ts: any` sur tous ses exports

---

**Fichier : `frontend/vitest.config.ts`**
- **Rôle** : Configuration Vitest
- **État** : À surveiller
- **Constats** :
  1. Allowlist explicite de 93 fichiers de tests — tout nouveau test doit être ajouté manuellement
  2. `functions/**/__tests__/*.test.ts` (glob) dans la liste — mais le répertoire `functions/` est à la racine, non dans `frontend/` — peut ne jamais matcher
  3. `testTimeout: 10_000` — acceptable
  4. `unstubGlobals: false` — peut laisser des stubs entre tests si mal gérés

---

**Fichier : `frontend/vite.config.ts`**
- **Rôle** : Configuration Vite/Rollup
- **État** : OK (bien optimisé)
- **Constats** :
  1. `manualChunks` correctement commenté avec le rationnel de performance
  2. `modulePreload: { polyfill: false }` — correct pour les navigateurs cibles
  3. `drop_console: true` + `drop_debugger: true` en production — correct
  4. `chunkSizeWarningLimit: 1000` (1 MB) — seuil élevé qui peut masquer des chunks trop gros
- **Action minimale** : Réduire `chunkSizeWarningLimit` à 500 kB pour mieux contrôler la taille des chunks.

---

**Fichier : `frontend/src/components/ui/SEOHead.tsx`**
- **Rôle** : Composant meta tags SEO centralisé
- **État** : OK
- **Constats** :
  1. `SITE_URL` hardcodé en `https://teetee971.github.io/akiprisaye-web/` — incohérent avec Cloudflare Pages
  2. `ogImage` default pointe vers `/icon-512.png` (sans suffix `.webp`) — à vérifier si le fichier existe
  3. Support complet : og:*, twitter:*, JSON-LD, canonical, noIndex

---

**Fichier : `frontend/src/components/analytics/LiveOnlineBadge.tsx`**
- **Rôle** : Badge visiteurs en ligne (Firestore)
- **État** : OK
- **Constats** : Correctement lazy-loadé dans Footer.tsx — Firebase hors du chemin critique.

---

**Fichier : `frontend/scripts/verify-version-json-fields.mjs`**
- **Rôle** : Vérification des champs de `dist/version.json`
- **État** : OK

---

**Fichier : `frontend/scripts/lighthouse-guard.mjs`**
- **Rôle** : Seuils Lighthouse et comparaison baseline
- **État** : OK
- **Constats** : `MIN_PERFORMANCE = 90` (configurable via env). Logique de verdict bien structurée.

---

### backend

---

**Fichier : `backend/src/app.ts`**
- **Rôle** : Application Express principale
- **État** : À surveiller
- **Constats** :
  1. Route `/api/products` montée deux fois : `productsRoutes` + `historyRoutes` + `signalRoutes` — conflit potentiel de routes
  2. 22 routes montées sur `/api/*` — risque de conflit de chemins si non isolés
  3. CORS depuis `process.env.CORS_ORIGINS?.split(',')` — correct pour la prod mais pas pour les tests
  4. Pas de validation de l'origine de la requête en dehors de CORS
  5. `setupSwagger()` active Swagger UI en prod — risque d'exposition d'API interne
  6. `syncScheduler` démarré au lancement — pas de guard `NODE_ENV`

---

**Fichier : `backend/src/api/middlewares/rateLimit.middleware.ts`**
- **Rôle** : Rate limiting Express
- **État** : Problématique (en production distribuée)
- **Constats** :
  1. Commentaire explicite : `⚠️ PRODUCTION WARNING: Dans un déploiement distribué/clusterisé, le stockage en mémoire ne fonctionne pas correctement`
  2. Pas de store Redis configuré — chaque instance a ses propres compteurs
  3. `authLimiter` à 5 tentatives/15 min — correct en théorie mais inefficace en cluster
- **Action minimale** : Configurer un store Redis partagé pour la production. Sinon, documenter que le backend est single-instance.

---

**Fichier : `backend/src/api/middlewares/auth.middleware.ts`**
- **Rôle** : Vérification JWT
- **État** : À surveiller
- **Constats** :
  1. Crée une nouvelle instance `PrismaClient()` dans le middleware — devrait utiliser l'instance singleton de `database/prisma.ts`
  2. Pas de gestion du token expiré vs token invalide — retourne toujours 401

---

**Fichier : `backend/prisma/schema.prisma`**
- **Rôle** : Schéma base de données PostgreSQL
- **État** : OK
- **Constats** : Schéma bien structuré avec enums, relations. Le backend utilise JWT (pas Firebase) pour son auth propre — système d'authentification distinct du frontend Firebase.

---

**Fichier : `backend/src/firebase.ts`**
- **Rôle** : Admin SDK Firebase pour le backend
- **État** : À surveiller
- **Constats** : Nécessite `FIREBASE_SERVICE_ACCOUNT` ou un compte de service — dépendance externe non documentée dans le README backend.

---

### shared

---

**Fichier : `shared/src/api.ts`, `shared/src/price.ts`, `shared/src/product.ts`**
- **Rôle** : Types partagés entre frontend et backend
- **État** : Inutile / mort
- **Constats** :
  1. Seulement 3 fichiers dans `shared/src/` — sous-utilisé
  2. `shared/realtimeFallback.ts` — 1 fichier à la racine de shared
  3. Les types sont dupliqués entre `frontend/src/types/` (50 fichiers) et `shared/src/` (3 fichiers)
  4. Pas de mécanisme pour s'assurer que les types shared sont effectivement utilisés par les deux projets
- **Risques** : Divergence silencieuse entre les contrats API frontend/backend.
- **Action minimale** : Soit supprimer `shared/` et tout centraliser, soit enforcer son usage dans les deux projets.

---

### scripts

---

**Fichier : `scripts/generate-sitemap.mjs`**
- **Rôle** : Génération du sitemap.xml
- **État** : Inutile / mort
- **Constats** : Existe mais n'est pas appelé par le build ni le CI. Le `sitemap.xml` à la racine est donc stale.

---

**Fichier : `scripts/validate-deployment.mjs`**
- **Rôle** : Validation post-déploiement (HTTP checks)
- **État** : OK
- **Constats** : Logique de fallback Firebase bundle bien implémentée (vérification dans le lazy chunk).

---

**Fichier : `scripts/auto-scraper/` (répertoire)**
- **Rôle** : Scraper multi-sources (carburants, alimentation, BQP, services)
- **État** : À surveiller
- **Constats** :
  1. Les sources de scraping (`bqp.mjs`, `food.mjs`, `fuel.mjs`, `retailers.mjs`) sont des fichiers `.mjs` sans types
  2. Pas de test unitaire pour le scraper
  3. Les données sont commitées directement dans le repo (JSON dans `public/data/`)

---

**Fichier : `scripts/lettre-jour/`, `scripts/lettre-hebdo/`**
- **Rôle** : Génération de newsletters quotidienne et hebdomadaire
- **État** : À surveiller
- **Constats** : Nécessitent `OPENAI_API_KEY` — si absent, le workflow échoue silencieusement ou produit un contenu vide.

---

**Fichier : `scripts/carte-google.js`, `scripts/load-map.js`, `scripts/map-init.js`**
- **Rôle** : Anciens scripts de carte (HTML vanille)
- **État** : Suspects / morts
- **Constats** : Scripts JavaScript vanilla pour Google Maps, probablement liés aux anciens fichiers HTML dans `public/` (`observatoire.html`, `comparateur.html`, etc.). Non référencés par le build Vite.

---

## 3. Problèmes classés par gravité

### P0 — Bloque ou risque de bloquer build/deploy/prod

| # | Fichier(s) | Problème | Impact |
|---|---|---|---|
| P0-1 | `firebase.json` | `hosting.public: "."` + `**/dist/**` dans ignore — Firebase Hosting déploierait la racine du repo, pas le build Vite | Si `firebase deploy --only hosting` est exécuté, les utilisateurs verraient le repo brut, pas l'app |
| P0-2 | `manifest.webmanifest` | `start_url: "/"` et `scope: "/"` incorrects sur GitHub Pages (`/akiprisaye-web/`) | L'install PWA peut échouer ou rediriger vers une URL 404 |
| P0-3 | `service-worker.js` (racine) | `CORE_ASSETS: ['/']` ne correspond pas à la base path `/akiprisaye-web/` | Les navigateurs cachent `'/'` (domaine racine) qui n'est pas la SPA |

### P1 — Risque élevé / régression probable

| # | Fichier(s) | Problème | Impact |
|---|---|---|---|
| P1-1 | 15 fichiers (SocialLoginButtons, Login, MonCompte, etc.) | `useAuth` importé depuis `@/context/AuthContext` au lieu de `@/context/authHook` | Firebase SDK potentiellement dans des chunks critiques — régression performance |
| P1-2 | `backend/src/api/middlewares/rateLimit.middleware.ts` | Rate limiting in-memory — inefficace en déploiement multi-instance | Protection brute force illusoire en production distribuée |
| P1-3 | `backend/src/api/middlewares/auth.middleware.ts` | Nouvelle instance `PrismaClient()` dans chaque appel middleware | Pool de connexions DB épuisé sous charge |
| P1-4 | `.github/workflows/auto-merge.yml` | `pull_request_target` + auto-merge sur préfixe `copilot/` uniquement | Vecteur d'attaque potentiel depuis un fork |
| P1-5 | `frontend/src/components/ui/GlassCard.d.ts` | Tous les exports typés `any` | Perte complète du typage pour les consommateurs — bugs silencieux |
| P1-6 | `frontend/tsconfig.ci.json` | `strict: false`, `strictNullChecks: false`, `noImplicitAny: false` en CI | Des erreurs TypeScript graves passent en CI et arrivent en prod |
| P1-7 | `akiprisaye-web/` (sous-répertoire) | Répertoire imbriqué avec `package.json` non référencé | Confusion npm, risque d'installer les mauvaises dépendances |

### P2 — Amélioration importante

| # | Fichier(s) | Problème | Impact |
|---|---|---|---|
| P2-1 | `sitemap.xml` | Statique, 77 URLs sur 186 pages, `/produit/:slug` absent | Manque à gagner SEO significatif |
| P2-2 | `frontend/src/services/smartShoppingListService.ts` | 4 TODOs majeurs — features non implémentées | UX dégradée, fonctionnalités annoncées non fonctionnelles |
| P2-3 | `frontend/src/services/invoiceOCRService.ts` | OCR non implémenté (retourne mock) | Idem |
| P2-4 | `frontend/src/utils/retailerLinks.ts` | `E.Leclerc` URL invalide (`https://www.e.leclerc/`) | Lien cassé vers E.Leclerc — manque à gagner monétisation |
| P2-5 | `shared/` | Types partagés (3 fichiers) ignorés par les 2 projets | Divergence silencieuse des contrats API |
| P2-6 | `firebase.json` | Absence de CSP (Content-Security-Policy) | Vulnérabilité XSS potentielle |
| P2-7 | `backend/src/api/docs/swagger.ts` | Swagger UI actif en production | Exposition de la documentation interne de l'API |
| P2-8 | `frontend/src/App.tsx` | 787 lignes, ~60 imports — monolithique | Maintenabilité dégradée |
| P2-9 | `scripts/generate-sitemap.mjs` | Non exécuté dans le pipeline de build | Sitemap jamais mis à jour automatiquement |
| P2-10 | `robots.txt` | `Sitemap:` pointe uniquement vers GitHub Pages | Si Cloudflare Pages est l'URL principale, les robots ignorent le sitemap |

### P3 — Dette faible / hygiène

| # | Fichier(s) | Problème |
|---|---|---|
| P3-1 | `scripts/add-preload.`, `scripts/optimize-public-assets.` | Fichiers vides (0 octet) avec extension invalide |
| P3-2 | 19 pages `.jsx` | Pas de types TypeScript — dette à migrer |
| P3-3 | `frontend/src/pages/index.ts` | Auto-généré en jan 2026, seulement 20 pages sur 186 — obsolète |
| P3-4 | `.env.example` | ✅ Corrigé : `APP_VERSION=4.6.1` aligné avec `package.json@4.6.1` |
| P3-5 | `frontend/vitest.config.ts` | Glob `functions/**/__tests__/*.test.ts` pointe hors du `root` Vitest |
| P3-6 | `.github/workflows/backend-ci.yml` | `actions/checkout@v4` au lieu de `@v5` |
| P3-7 | 30+ TODOs dans services frontend | Dette fonctionnelle accumulée |
| P3-8 | `frontend/context/ThemeContext.jsx` | Shim `.jsx` toujours présent — devrait être supprimé |
| P3-9 | 26 workflows archivés | Maintenus dans `.github/workflows-archived/` — lisibilité |
| P3-10 | `frontend/src/utils/seoHelpers.ts` + `SEOHead.tsx` | `SITE_URL` hardcodé GitHub Pages — incompatible Cloudflare Pages |
| P3-11 | `scripts/carte-google.js`, `load-map.js`, `map-init.js` | Scripts vanilla probablement morts |

---

## 4. Fichiers morts / suspects / doublons

| Fichier | Raison de suspicion |
|---|---|
| `akiprisaye-web/` (répertoire) | Imbrication récursive, non référencé |
| `scripts/add-preload.` | 0 octet, extension vide |
| `scripts/optimize-public-assets.` | 0 octet, extension vide |
| `frontend/src/context/ThemeContext.jsx` | Shim de compat, à supprimer après migration |
| `frontend/src/context/AuthContext.jsx` | Shim crée une confusion avec `contexts/AuthContext.tsx` |
| `frontend/src/components/ui/GlassCard.d.ts` | Typages `any` — devrait être supprimé |
| `frontend/src/components/ui/GlassCard.jsx` | Doublonné avec `glass-card.tsx` |
| `frontend/src/components/ui/glass-card.jsx` | Doublonné avec `glass-card.tsx` |
| `frontend/src/pages/index.ts` | Auto-généré jan 2026, 20/186 pages — obsolète |
| `frontend/src/types/fuelComparison.d.ts` | Coexiste avec `fuelComparison.ts` |
| `frontend/src/types/catalogueService.d.ts` | Coexiste avec l'implémentation |
| `frontend/src/types/service-comparison.d.ts` | Déclaration `.d.ts` orpheline |
| `scripts/carte-google.js` | Script HTML vanille, non référencé par Vite |
| `scripts/load-map.js` | Idem |
| `scripts/map-init.js` | Idem |
| `shared/` (3 fichiers) | Types partagés non utilisés par les deux projets |
| Pages non routées : `AiMarketInsights.jsx`, `ModuleAuditPage.tsx`, `Perimetre.tsx`, `Versions.tsx`, `ChecklistProduction.tsx` | Non trouvées dans App.tsx |

---

## 5. Correctifs minimaux recommandés

### Ordre d'exécution recommandé

**Étape 1 — Correctifs P0 (production bloquée ou dégradée)**

1. **`firebase.json`** : Corriger `hosting.public: "frontend/dist"` et retirer `**/dist/**` des ignores. Désactiver Swagger UI en prod.
2. **`manifest.webmanifest`** : Générer dynamiquement `start_url` et `scope` avec `BASE_PATH` au build, ou injecter dans `postbuild`.
3. **`service-worker.js`** : Remplacer `CORE_ASSETS: ['/']` par la base path dynamique.

**Étape 2 — Correctifs P1 (sécurité et intégrité)**

4. **15 imports `useAuth`** : Migrer vers `@/context/authHook` dans : `SocialLoginButtons.tsx`, `AuthDebugPanel.tsx`, `Login.tsx`, `MonCompte.tsx`, `Inscription.tsx`, `AuthCallbackPage.tsx`, `SignalerAbus.tsx`, `ContribuerPrix.tsx`, `EspaceCreateur.tsx`, `ActivationCreateur.tsx`, `SyncDashboard.tsx`, `usePlan.ts`, `useQuota.ts`, `EntitlementProvider.tsx`.
5. **`GlassCard.d.ts`** : Supprimer le fichier `.d.ts`. Choisir `glass-card.tsx` comme source canonique. Migrer tous les imports.
6. **`auto-merge.yml`** : Restreindre à `github.actor == 'github-actions[bot]'` uniquement. Exiger un check CI réussi.
7. **`rateLimit.middleware.ts`** : Documenter explicitement la contrainte single-instance ou implémenter un store Redis.
8. **`auth.middleware.ts`** : Remplacer `new PrismaClient()` par l'import du singleton `prisma`.
9. **`tsconfig.ci.json`** : Réactiver `strict: true` progressivement (au minimum `strictNullChecks: true`).
10. **`akiprisaye-web/` (répertoire)** : Supprimer après vérification.

**Étape 3 — Correctifs P2 (SEO, fonctionnel, maintenabilité)**

11. **Sitemap** : Appeler `scripts/generate-sitemap.mjs` dans le `postbuild` de `frontend/package.json`.
12. **E.Leclerc URL** : Corriger `'https://www.e.leclerc/'` → `'https://www.courses.leclerc.fr/'`.
13. **Features stub** : Ajouter feature flags pour désactiver `smartShoppingListService` optimisation TSP et OCR `invoiceOCRService` jusqu'à implémentation réelle.
14. **CSP** : Ajouter `Content-Security-Policy` dans `firebase.json` headers.

**Étape 4 — Dette P3 (hygiène)**

15. Supprimer `scripts/add-preload.` et `scripts/optimize-public-assets.`.
16. Migrer les 19 pages `.jsx` vers `.tsx`.
17. Synchroniser `APP_VERSION` dans `.env.example`.
18. Corriger le glob `functions/` dans `vitest.config.ts`.
19. Supprimer les shims `.jsx` de contexte après migration.

---

## 6. Conclusion factuelle

### Ce qui est solide

- **Pipeline CI** : Bien découpé (8 jobs), Lighthouse intégré, badge LIVE vérifié après chaque déploiement.
- **Bundle splitting Vite** : Correctement configuré. Firebase, i18n, leaflet, charts sont hors du chemin critique. Pattern documenté avec rationnel.
- **Pattern authHook** : Architecture correcte (contexte léger séparé du Provider Firebase) — mais mal appliqué par ~15 fichiers.
- **Firestore rules** : Bien structurées, protection des champs de rôle, validation documentaire sur contact_messages.
- **Service Worker** : Logique réseau bien pensée (network-first navigation, cache-first assets).
- **Tracking analytique** : RGPD-safe (localStorage uniquement, cap 50 entrées, TTL 30 jours).
- **Tests** : 93 fichiers de test avec allowlist explicite, couvrant les services critiques, les hooks, la CI elle-même, Firebase config.
- **Accessibilité** : `jsx-a11y` intégré, `SkipLinks` dans le layout, A11ySettingsPanel disponible.

### Ce qui est fragile

- **Double système d'authentification** : Frontend Firebase Auth + Backend JWT sans pont explicite — risque de dérive.
- **15 composants court-circuitent le bundle splitting** en important `useAuth` depuis le mauvais fichier.
- **Rate limiting en mémoire** non scalable en multi-instance backend.
- **tsconfig.ci.json** trop permissif — les erreurs TypeScript peuvent passer en CI.
- **Sitemap statique** — plus de 100 pages non référencées, aucune mise à jour automatique.
- **Services stub** : ~8 services retournent des données mockées pour des features annoncées (OCR, TSP, PDF).
- **GlassCard** : 5 implémentations parallèles, `any` dans les types déclarés.

### Ce qui est inutile

- `akiprisaye-web/` (répertoire imbriqué récursif)
- `scripts/add-preload.` et `scripts/optimize-public-assets.` (0 octet)
- `frontend/src/pages/index.ts` (20/186 pages, auto-généré début 2026)
- `shared/` (3 fichiers non utilisés par les deux projets)
- `scripts/carte-google.js`, `load-map.js`, `map-init.js` (scripts HTML vanille)
- `frontend/src/context/AuthContext.jsx` (shim confus)
- `frontend/src/components/ui/GlassCard.d.ts` (any total)

### Ce qui doit être corrigé en priorité

1. **P0** : `firebase.json` (hosting.public), `manifest.webmanifest` (start_url), `service-worker.js` (CORE_ASSETS)
2. **P1** : 15 imports `useAuth` erronés, `GlassCard.d.ts` (any), `auto-merge.yml` (sécurité), `auth.middleware.ts` (PrismaClient singleton)
3. **P2** : Sitemap automatique, URL E.Leclerc, CSP header, désactivation des features stub

### Ordre d'exécution recommandé des correctifs

```
1. firebase.json (P0) — 5 min
2. manifest.webmanifest (P0) — 30 min
3. service-worker.js CORE_ASSETS (P0) — 15 min
4. 15 imports useAuth → authHook (P1) — 20 min
5. GlassCard : choisir glass-card.tsx, supprimer .d.ts et doublons (P1) — 45 min
6. auto-merge.yml sécurisation (P1) — 10 min
7. auth.middleware.ts : singleton Prisma (P1) — 5 min
8. tsconfig.ci.json : réactivation strictNullChecks (P1) — 30 min + fix des erreurs
9. URL E.Leclerc (P2) — 1 min
10. Sitemap automatique dans postbuild (P2) — 30 min
11. CSP dans firebase.json (P2) — 20 min
12. Suppression fichiers morts (P3) — 10 min
13. Migration pages .jsx → .tsx (P3) — plusieurs sessions
```
