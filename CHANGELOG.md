# Changelog
Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et ce projet adhère à la [sémantique de versionnage](https://semver.org/lang/fr/).

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
