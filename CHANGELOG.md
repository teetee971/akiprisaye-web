# Changelog
Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et ce projet adhère à la [sémantique de versionnage](https://semver.org/lang/fr/).

## [3.1.9] - 2026-03-09

### Fixed — FuelComparator : horodatage réel de la donnée

- **`services/fuelComparisonService.ts`** — Nouveau type exporté `LiveFuelPricesResult { prices, fetchedAt }`.
  `fetchLiveFuelPrices()` retourne désormais `fetchedAt` (ISO 8601) issu de la réponse du proxy Cloudflare
  (champ `fetchedAt` déjà présent dans le payload de `functions/api/fuel-prices.ts`).

- **`pages/FuelComparator.tsx`** — Supprime l'affichage de `new Date()` (date du navigateur, jamais fraîche)
  dans le badge hero et la citation source. Affiche à la place la date+heure réelle de l'appel API gouvernemental :
  `🔄 Mis à jour le 9 mars 2026 à 17:30`. Fallback sur la date locale si la donnée live n'est pas encore chargée.

### Fixed — Erreurs console DevTools (CORB, crossorigin, accessibilité)

- **`components/home/StoreRankingWidget.tsx`** — Ajout de `crossOrigin="anonymous"` sur l'`<img>` Unsplash.
  Corrige le blocage CORB : le `<link rel="preconnect" crossorigin>` de `index.html` établit une connexion
  CORS vers Unsplash, et l'absence du flag correspondant sur l'`<img>` créait un mismatch de credentials.

- **`components/ui/HeroImage.tsx`** — Ajout conditionnel de `crossOrigin="anonymous"` sur l'`<img>` fallback
  dans `<picture>` pour toutes les URLs `images.unsplash.com`, assurant la cohérence CORS.

- **`components/home/HeroSearch.tsx`** — URL `HERO_IMG` mise à jour avec `fm=webp` inclus directement,
  évitant que `toWebP()` génère une URL différente (paramètre en fin au lieu du milieu) de celle utilisée
  dans `StoreRankingWidget` pour le même cliché.

- **`pages/FuelComparator.tsx`** — Ajout de `id`, `name` et `htmlFor` sur les 4 contrôles de formulaire
  (sélecteur territoire, sélecteur carburant × 2, filtre ville). Corrige 3 avertissements
  « A form field element should have an id or name attribute » dans le panneau Problèmes DevTools.

- **`pages/Comparateur.jsx`** — Ajout de `id`/`name` sur l'`<input>` recherche (`comp-query`) et
  le `<select>` de tri (`comp-sort`) + conversion de la `<label>` inline en `htmlFor` pour la
  liaison label/contrôle. Supprime les 2 avertissements d'accessibilité restants de la page comparateur.

---

## [3.1.8] - 2026-03-09

### Added — Octroi de Mer : enquête + conférence institutionnelle

- **`pages/EnqueteOctroiMer.tsx`** — Dossier d'investigation `/enquete-octroi-mer`, 7 onglets :

  | Onglet | Contenu | Sources |
  |---|---|---|
  | Histoire & origines | Frise 1670→2027 (Colbert, CJCE Legros, Loi 2004, Décision UE 2021) | Légifrance, EUR-Lex |
  | Mécanisme juridique | Architecture légale, assiette OM-R/OM-C, différentiel, collecte DGDDI | Loi 2004-639, DGDDI |
  | Taux par territoire | Tables GP/RE/MQ avec taux importé vs production locale | Délibérations Régionales 2022 |
  | Impact consommateur | Impact par catégorie + diagramme décomposition du surcoût | INSEE 2022, Autorité concurrence |
  | Financement collectivités | 1,2 Md€/an, table par DROM, risques budgétaires | DGDDI 2023, Cour des Comptes 2023 |
  | Acteurs | 6 acteurs clés (Commission UE, Régions, DGDDI, Autorité conc., Cour Comptes, associations) | Sources officielles |
  | Sources & réforme | Textes législatifs, données économiques, 4 scénarios réforme 2027 | Rapport Lurel-Hoibian 2019 |

- **`pages/ConferenceOctroiMer.tsx`** — Conférence institutionnelle ultra-expert `/conference-octroi-mer`, 9 diapositives :

  | Diapositive | Contenu | Sources |
  |---|---|---|
  | 1 — Panorama | 1,2 Md€/an, barres recettes 5 DROM | DGDDI 2023 |
  | 2 — Histoire 350 ans | Frise chronologique SVG 1670→2027, arrêt CJCE Legros 1992 | EUR-Lex, Légifrance |
  | 3 — Architecture juridique | Pyramide TFUE Art.349 → UE 2021/1657 → UE 2022/2 → Loi 2004 → délibérations | EUR-Lex |
  | 4 — Mécanisme | Formule OM-R + OM-C, circuit A→E collecte/redistribution | Loi 2004-639, DGDDI |
  | 5 — Analyse des taux | Double barres importé vs local, 8 secteurs, Guadeloupe 2026 | Délibérations CR GP 2022 |
  | 6 — Impact macroéconomique | Chaîne OM→prix rayon (effet multiplicateur ×2,4), décomposition surcoût | INSEE 2022, Autorité conc. |
  | 7 — Budget collectivités | Table 5 DROM recettes/budget/pct/communes, risque systémique | Cour des Comptes 2023 |
  | 8 — Horizon 2027 | 4 scénarios réforme avec probabilités et analyse pros/cons | Rapport Lurel-Hoibian, Commission UE 2024 |
  | 9 — Conclusion | 4 idées reçues déconstruites + 4 recommandations institutionnelles | — |

- **`config/imageAssets.ts`** — Nouvelles clés `enqueteOctroiMer` et `conferenceOctroiMer`

### Changed

- **`App.tsx`** — +2 lazy-imports + routes `/enquete-octroi-mer` et `/conference-octroi-mer`
- **`CalculateurOctroi.tsx`** — CTAs enrichis : « Enquête Octroi de Mer » + « Conférence institutionnelle »



### Added — Conférence expert carburants DOM-TOM (niveau contre-expert)

- **`pages/ConferenceCarburants.tsx`** — Nouvelle page `/conference-carburants` :
  présentation interactive en **9 diapositives** sur l'anatomie complète du prix des carburants
  dans les DOM-TOM. Niveau expert — données officielles vérifiables uniquement.

  | Diapositive | Thème | Données clés |
  |---|---|---|
  | 1 — Panorama | Prix SP95/Diesel par territoire | Arrêtés préfectoraux jan. 2026 |
  | 2 — Du puits à la pompe | 6 étapes d'approvisionnement | IEDOM / OPMR 2024 |
  | 3 — Marché du brut | Courbe Brent 2020-2026 (SVG) | EIA, OPEC, IEA |
  | 4 — SARA & raffinage | Capacité, brut traité, réseaux | IEDOM Martinique 2023 |
  | 5 — Fret maritime | Surcoût par île (+3 % à +17 %) | Armateurs de France 2023 |
  | 6 — Fiscalité comparée | DOM vs métro décomposition (SVG) | DGDDI / DGEC 2024-2025 |
  | 7 — Prix plafonnés | Mécanisme préfectoral mensuel | Code de l'énergie / DGEC |
  | 8 — Comparaison mondiale | 11 pays (barres SVG) | IEA / EIA jan. 2026 |
  | 9 — Conclusion | 4 idées reçues déconstruites | — |

  **Caractéristiques techniques :**
  - Graphique SVG inline du cours du Brent (14 points, 2020-2026, inflexions annotées)
  - Barres de décomposition du prix pump DOM vs métro
  - Photos Wikimedia Commons avec chargement différé et fallback sur erreur
  - Navigation clavier ← → + boutons + sélecteur de slide
  - `SourcePill` vers toutes les sources officielles (DGEC, IEDOM, EIA, OPEC, IEA, Légifrance)
  - SEO : `<Helmet>` avec titre et description optimisés

- **`config/imageAssets.ts`** — Nouvelle clé `PAGE_HERO_IMAGES.conferenceCarburants`
  (photo pétrole industriel, Unsplash)

### Changed — Liens inter-pages carburants

- **`FuelComparator.tsx`** — Barre de navigation enrichie :
  - « Enquête » (raccourci) + nouveau bouton **« Conférence expert »** (→ `/conference-carburants`)
  - Deux CTAs distincts en bas de résultats : enquête (orange) + conférence (amber)
- **`EnqueteCarburants.tsx`** — CTA bas de page enrichi :
  - Bouton secondaire **« Conférence expert »** en plus du comparateur



### Added — Transparence commissions & suivi analytique des comparateurs

- **`utils/bookingLinks.ts`** — utilitaire `buildBookingUrl(url, campaign)` qui :
  - Injecte des paramètres UTM standards sur tous les liens externes des comparateurs
    (`utm_source=akiprisaye`, `utm_medium=comparateur`, `utm_campaign=<nom-du-comparateur>`).
  - Centralise la gestion des commissions d'affiliation via `BOOKING_CONFIG`.
    Par défaut, `affiliateEnabled: false` → **aucune commission active**.
  - Expose `getCommissionStatus()` pour récupérer le libellé et la couleur à afficher.
- **`components/comparateur/BookingLinkBadge.tsx`** — badge React dynamique :
  - 🟢 « Lien direct · Aucune commission » quand `affiliateEnabled = false`.
  - 🟡 « Lien partenaire » quand l'affiliation est activée.
  - Tooltip explicatif au clic (détail du mode de rémunération).
  - Remplace les anciens disclaimers texte éparpillés dans chaque comparateur.
- **Tests unitaires** `src/test/bookingLinks.test.ts` — 12 cas couvrant :
  - Injection UTM (source, medium, campaign), préservation des params existants.
  - Traitement des URLs non-parseable (relatives, `#`, vides).
  - Absence du paramètre `ref` quand `affiliateEnabled = false`.
  - Valeurs par défaut de `BOOKING_CONFIG`.
  - Labels, couleur et libellé de `getCommissionStatus()`.

### Changed — Tous les comparateurs spécialisés

Chaque comparateur enroule ses fonctions de construction d'URL avec `buildBookingUrl()`
et remplace les disclaimers texte par `<BookingLinkBadge />` :

| Comparateur | Campagne UTM |
|---|---|
| `FlightComparator` | `comparateur-vols` |
| `BoatComparator` | `comparateur-bateaux` |
| `CarRentalComparator` | `comparateur-voiture` |
| `FuelComparator` | *(liens Google Maps exclus)* |
| `InsuranceComparator` | `comparateur-assurances` |
| `AbonnementsInternet` | `comparateur-internet` |
| `AbonnementsMobile` | `comparateur-mobile` |

### Fixed

- **`InsuranceComparator`** — `ComparisonSummary` recevait des props inexistantes
  (`minPrice`, `maxPrice`, `priceRange`, `priceRangePercentage`) au lieu de l'interface
  réelle (`bestPrice`, `worstPrice`, `savingsPercentage`, `bestProvider`, `totalObservations`).
- **`InsuranceComparator`** — `ShareButton` était appelé sans le prop obligatoire
  `description`, provoquant un avertissement React en mode développement.
- **`AbonnementsMobile`** — suppression du commentaire `// @ts-nocheck` qui masquait
  les erreurs TypeScript potentielles.



### Added — Itinéraires manquants & ComparateursHub complet

- **Itinéraires manquants ajoutés dans `App.tsx`** pour quatre pages qui n'avaient aucun
  itinéraire React Router :
  - `EnhancedComparator` → route `/comparateur-avance`
  - `Compare` → route `/compare`
  - `Comparateurs` → route `/comparateurs-prix`
  - `AIDashboard` → route `/ai-dashboard`
- **`ComparateursHub.tsx` enrichi** : ajout de liens vers TOUS les comparateurs,
  y compris les comparateurs généraux précédemment absents :
  - **Comparateur Avancé** (`/comparateur-avance`) — comparateur enrichi avec
    géolocalisation et scores de fiabilité.
  - **Comparaison Rapide** (`/compare`) — comparaison express par enseigne et distance.
  - **Comparateurs par Territoire** (`/comparateurs-prix`) — vue comparative
    multi-territoire par catégorie de produit.
  - **Tableau de Bord IA** (`/ai-dashboard`) ajouté à la section IA & Analyses.
- **Versions alignées** : tous les `package.json` (racine, frontend, backend, functions,
  price-api) passent à `3.1.5` (3.1.3 → 3.1.4 → 3.1.5).

### Fixed

- Alignement des versions `package.json` : la version `3.1.4` publiée dans le CHANGELOG
  n'était pas reflétée dans les manifestes npm — tous les paquets sont maintenant à
  `3.1.5`.

## [3.1.4] - 2026-03-08

### Added — Checklist Production

- **`ChecklistProduction.tsx`** (route `/checklist-prod`) : page de vérification des tâches
  avant mise en production. Couvre 9 sections (sécurité, frontend, performance, tests,
  conformité RGPD, accessibilité, infrastructure, documentation, IA responsable) avec
  statut par tâche (Fait / En cours / À faire / Critique), priorité (haute/moyenne/basse),
  barre de progression globale et affichage multi-sections. Répond à l'issue
  « Vérifie siriste à faire donne logiciel pour la production ».
- **`PAGE_HERO_IMAGES.checklistProduction`** ajouté dans `imageAssets.ts`.

---

## [3.1.3] - 2026-03-08

### Removed — Nettoyage complet des fichiers obsolètes

#### Pages `frontend/src/pages/` supprimées (23 fichiers)
- **Anciennes versions de la page d'accueil** : `HOME_v3.tsx`, `HOME_v4.tsx`, `HomePage.tsx`,
  `Home_old.tsx` — supersédées par `Home.tsx` (anciennement `HOME_v5.tsx`, maintenant consolidé).
- **Ancienne page de tarifs** : `PricingDetailed_old.tsx` — supersédée par `PricingDetailed.tsx`.
- **Pages scan legacy** : `ScanPage.tsx` (simple wrapper de ScannerHub), `ScanFlow.tsx` (page
  non routée), `ProductScanPage.tsx` (composant legacy `@ts-nocheck`).
- **Comparateurs obsolètes** : `ComparaisonPage.tsx` (@ts-nocheck, non routée),
  `ComparisonEnseignes.tsx` (doublon de `ComparaisonEnseignes.tsx`),
  `ComparateurTerritoires.tsx` (@ts-nocheck, non routée), `TerritoryComparateurs.tsx` (stub).
- **Pages stubs « en développement »** : `AlertesPrix.jsx`, `ComparateurFormats.jsx`,
  `FauxBonsPlan.jsx`, `ListeCourses.jsx`, `News.tsx`, `ComingSoon.tsx`, `NotFound.jsx`.

#### Fichiers racine supprimés (19 fichiers + 2 répertoires)
- **Scripts prototype** : `app.js`, `interpreteur_local.js`, `score_utilisateur.js`,
  `firebase_log_service.js`, `vwapei_voice.js`.
- **Doublons / legacy** : `BarcodeScanner.tsx` (doublon de `frontend/src/components/`),
  `exportComparisons.ts`.
- **Scripts comparateur legacy** : `comparateur-autofill.js`, `comparateur-fetch.js`,
  `product-search.js`, `detecteur_contexte.js`, `entraide_local.js`, `repondeur_intelligent.js`,
  `scanner.js`, `signalement_auto.js`.
- **CSS partagé legacy** : `cookie-consent.css`, `cookie-consent.js`,
  `shared-nav.css`, `shared-nav.js`.
- **Répertoires UI prototype** : `ui_components/` (composants Vue), `chat_ia_local/`.

#### Artefacts de build supprimés (`Assets/`, 87 fichiers)
- Répertoire `Assets/` contenant d'anciens bundles JS/sourcemaps générés, désormais
  correctement ignoré par `.gitignore` (entrée `Assets/` pré-existante).

### Fixed
- **TypeScript TS2307** dans `frontend/src/pages/index.ts` : suppression des exports
  `Home_old`, `News` et `PricingDetailed_old` qui pointaient vers des fichiers maintenant supprimés.
- **TypeScript TS1261** (conflit de casse) : suppression de `frontend/src/types/priceObservation.ts`
  (minuscule), un fichier de compatibilité legacy avec `// @ts-nocheck` qui n'était importé par aucun
  fichier mais provoquait un conflit de casse avec `PriceObservation.ts`. Compilation TypeScript : **0 erreur**.

### Changed
- **`Home.tsx`** : consolidé directement avec le contenu de `HOME_v5.tsx` — suppression de
  l'indirection `export { default } from './HOME_v5'`. La page d'accueil est maintenant auto-contenue.
- **Alignement versions** → `3.1.3` sur tous les `package.json` du monorepo.

---

## [3.1.2] - 2026-03-08

### Added

- **Itinéraires manquants — 7 nouvelles routes** dans `App.tsx` pour les pages fonctionnelles
  précédemment sans itinéraire :
  - `/perimetre` → `Perimetre.tsx` — couverture territoriale et limites de l'observatoire
  - `/predictions` → `Predictions.tsx` — prédictions de prix IA par produit et enseigne
  - `/ia-conseiller` → `IaConseiller.jsx` — conseiller budget IA personnalisé
  - `/ai-insights` → `AiMarketInsights.jsx` — tableau de bord IA sur les tendances de marché
  - `/territoire/:territory` → `TerritoryHub.tsx` — hub d'accès rapide par territoire
  - `/territoire/:territory/scanner` → `TerritoryScanner.tsx` — scanner territorial
- **ComparateursHub — liens exhaustifs** : ajout de 3 nouvelles fiches dans la section
  « Comparateurs généraux » :
  - `/historique-prix` — Évolution des Prix (graphes HistoriquePrix)
  - `/comparatif-concurrence` — Comparatif Concurrence (positionnement vs alternatives)
  - `/recherche-avancee` — Recherche Avancée (moteur multi-critères)
- **Icônes `Scale` et `SlidersHorizontal`** (Lucide React) ajoutées dans `ComparateursHub.tsx`
  pour les nouvelles fiches.

### Fixed

- **TypeScript TS2367** dans `scanHubClassifier.ts` (ligne 117) : remplacé `forEach` par `for…of`
  pour éviter que TypeScript 5.4+ ne rétrécisse le type `ScanHubType` de `bestType` à `'unknown'`
  dans la boucle de classification OCR. La compilation TypeScript est désormais sans erreur.

---

## [3.1.1] - 2026-03-07

### Added

- **ComparateursHub — liens complets** : ajout de 3 nouvelles fiches dans la section « Recherche & Tarifs »
  (`/recherche-prix/delais-logistiques`, `/recherche-prix/indice-logistique`,
  `/recherche-prix/pourquoi-delais-produit`) et d'une nouvelle section « Ressources & Comprendre »
  (5 fiches : `/comprendre-prix`, `/ressources/questions-logistique-dom`,
  `/ressources/glossaire-logistique-dom`, `/ressources/comprendre-promotions-prix-barres`,
  `/ressources/pourquoi-prix-varie-sans-changement`). Le hub liste désormais la totalité des
  comparateurs et ressources disponibles dans l'application.
- **Icônes `BookOpen` et `FileText`** (Lucide React) importées dans `ComparateursHub.tsx` pour les
  nouvelles fiches documentation.

### Changed

- **Alignement des versions** : tous les `package.json` du monorepo sont maintenant à `3.1.1` :
  - `backend/package.json` : 1.0.0 → 3.1.1
  - `functions/package.json` : ajout du champ `version: 3.1.1`
  - `price-api/package.json` : 0.1.0 → 3.1.1
- **README.md** : section Navigation mise à jour avec les nouvelles rubriques Ressources, liste
  exhaustive des comparateurs corrigée (29 → 34+ liens dans le hub), date de dernier audit.
- CHANGELOG.md mis à jour avec toutes les fonctionnalités déployées depuis v2.1.0.

### Fixed

- Aucun lien interne brisé détecté : audit exhaustif des `to="…"` dans les composants vs routes
  définies dans `App.tsx` — 0 lien orphelin.

---

## [3.1.0] - 2026-03-07

### Added

- **Messagerie interne** : système de messagerie sécurisé Firebase (Firestore + `onSnapshot`) entre
  citoyens, enseignes et institutions — accessible depuis Mon Compte et le Footer, route `/messagerie`.
- **Indice Panier Vital** (`PanierVitalWidget`) : calcul du temps de travail au SMIC net (9,12 €/h)
  nécessaire pour acheter un panier de 6 produits essentiels (lait, riz, eau, pâtes, sucre, huile)
  par territoire, alimenté par les snapshots Observatoire mensuels.
- **Comparaison internationale** (`internationalComparisonService`) : indices de coût de la vie basés
  sur Eurostat 2024, OECD PPP 2024 et INSEE DOM 2023 — couvre 40+ pays et 8 territoires DOM.
- **Gamification** : système de points, badges et classement contributeurs — route `/gamification`.
- **Snapshots Observatoire mars 2026** : couverture mensuelle complète de nov. 2025 à mars 2026
  pour les 11 territoires actifs (32 snapshots au total).
- **Validation EAN GS1** (`lib/eanValidator.ts`) : nouveau moteur GS1 avec
  `validateEAN13` / `validateEAN8` / `validateUPCA` / `validateGTIN` / `getGS1CountryLabel` /
  `computeCheckDigit`.
- **Territoire France métropolitaine** (`fr`) ajouté comme référence de comparaison dans
  `territories.ts` (type `Metro`).

### Changed

- Version `frontend/package.json` : 3.0.1 → **3.1.0**.
- Version `package.json` (root) : ajout du champ `version: 3.1.0`.
- README.md mis à jour : fonctionnalités manquantes ajoutées, liste des territoires complétée,
  commentaire parasite de fin de fichier supprimé, date d'audit de performance actualisée.
- CHANGELOG aligné avec les versions réelles du projet (3.0.1 manquait dans le journal).

### Fixed

- Commentaire HTML parasite en fin de `README.md` supprimé
  (`<- name: PR smoke test extra: 2026-02-26T17:24:31Z -->`).

### Security

- Messagerie chiffrée bout-en-bout via Firestore Security Rules.
- OCR 100 % local (Tesseract.js WASM) — aucune transmission serveur.
- `auth` et `db` Firebase gérés en mode `null`-safe si les variables d'environnement manquent.

---

## [3.0.1] - 2026-02-26

### Fixed

- Correction du timeout de readiness Vite preview et de la race condition du listener dans
  `verify-pages-runtime.mjs`.
- Stabilisation du pipeline CI/CD : déploiement Cloudflare Pages toujours précédé d'une validation
  post-déploiement bloquante.

---

## [2.1.0] - 2026-01-02
### Added
- **v1.5.0 - Product Insight System**: Analyse complète des produits à partir de photos d'étiquettes avec OCR, analyse des ingrédients et interprétation nutritionnelle
- **v1.6.0 - Product Dossier**: Suivi longitudinal persistant avec historisation, détection automatique des reformulations et analyse comparative avancée
- **v1.7.0 - Ingredient Evolution**: Comparaison temporelle des formulations multi-marques avec détection des changements factuels uniquement
- **v1.8.0 - Open Data Export**: Export de données publiques en formats CSV et JSON avec métadonnées obligatoires
- **v1.9.0-v1.10.0 - Product History**: Historique des produits et des prix avec suivi temporel
- **v2.1.0 - Cost of Living / IEVR**: Indice d'Écart de Vie Réelle pour les territoires DROM-COM avec calculs budgétaires
- Feature flags pour toutes les nouvelles fonctionnalités (désactivés par défaut en production)
- Support TypeScript strict pour tous les nouveaux services
- Documentation méthodologique complète pour chaque module

### Changed
- Version du projet mise à jour de 1.0.0 à 2.1.0
- Configuration des feature flags étendue avec support de v1.5.0 à v2.1.0
- Amélioration de la configuration .gitignore et ajout de .eslintignore

### Security
- Toutes les fonctionnalités sont en lecture seule uniquement
- Aucune recommandation médicale ni conseil nutritionnel
- Aucun score propriétaire
- Toutes les données ont des sources traçables
- Feature flags désactivés par défaut pour sécurité maximale

## [Unreleased]
### Added
- Feature flags Vite: `VITE_FEATURE_FUZZY_SEARCH` (par défaut true), `VITE_FEATURE_TRENDING` (par défaut false), `VITE_FEATURE_PRICE_COMPARISON` (par défaut false).
- **v1.4.0 - Comparateur de Prix Citoyen**: Comparaison multi-enseignes par territoire avec correspondance EAN, agrégation transparente, classement du moins cher au plus cher, et calculs d'écarts en pourcentage.
- Types TypeScript stricts pour la comparaison de prix (`src/types/priceComparison.ts`).
- Service de comparaison de prix production-ready (`src/services/priceComparisonService.ts`).
- Documentation méthodologique complète (`METHODOLOGIE_COMPARATEUR_v1.4.0.md`).
- Tests unitaires complets pour le service de comparaison (41 tests).
- Règles d'alerting Prometheus initiales (taux d'erreurs, latence p95, zero-results spike).

### Changed
- (à compléter)

### Fixed
- **Cloudflare Pages - Redirection SPA**: Correction de la configuration `_redirects` pour éliminer les boucles de redirection infinies
  - Validation de la règle de fallback SPA unique: `/*    /index.html   200`
  - Élimination de toute redirection conflictuelle
  - Navigation SPA stable sur toutes les routes (/, /scan, /comparateur, /faq)
  - Rafraîchissement de page fonctionnel
  - Chargement correct des modules selon la route

## [0.4.1] - 2025-11-10
### Added
- Linting Markdown via `markdownlint` + workflow CI.
- Section Maintenance/Versioning dans README.

### Changed
- Normalisation paragraphe docs (120 colonnes).

## [0.4.0] - 2025-11-10
### Added
- Observabilité: `/metrics` (Prometheus), logs JSON hashés.
- Métriques: `search_requests_total`, `search_errors_total`, `search_zero_results_total`, `search_duration_ms`.

### Security
- Recommandations de protection `/metrics`.

## [0.3.0] - 2025-11-10
### Added
- Trending & sélection produits (Redis ZSET + HASH), endpoints `POST /api/products/select`, `GET /api/products/trending`.
- UI historique + suggestions populaires (activable via `VITE_FEATURE_TRENDING`).

## [0.2.0] - 2025-11-10
### Added
- Recherche texte produits (Open Food Facts) avec debounce 250ms (≥3 caractères).
- Accessibilité WCAG 2.1 AA (combobox/listbox, navigation clavier, live regions).
- Fuzzy re-ranking client (Fuse.js) + normalisation (NFD, suppression diacritiques).
- Utilitaire `normalizeText()`.

### Performance
- Re-ranking local ≤ 5ms p95 pour ≤ 50 items.

[Unreleased]: https://github.com/teetee971/akiprisaye-web/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/teetee971/akiprisaye-web/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/teetee971/akiprisaye-web/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/teetee971/akiprisaye-web/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/teetee971/akiprisaye-web/compare/v0.1.0...v0.2.0
