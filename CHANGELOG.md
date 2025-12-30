# Changelog
Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et ce projet adhère à la [sémantique de versionnage](https://semver.org/lang/fr/).

## [Unreleased]
### Added
- Feature flags Vite: `VITE_FEATURE_FUZZY_SEARCH` (par défaut true), `VITE_FEATURE_TRENDING` (par défaut false).
- Règles d'alerting Prometheus initiales (taux d'erreurs, latence p95, zero-results spike).

### Changed
- (à compléter)

### Fixed
- (à compléter)

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
