# Intégration nationale — Carburants/Gaz (France métropolitaine + Outre-mer)

## Ce qui a été ajouté
- `public/data/fuel/regulated-prices-2026-04-france-scope.json`

Ce fichier étend l'intégration demandée à :
- France métropolitaine (`FR_METRO`),
- Guadeloupe (`GP`), Martinique (`MQ`), Guyane (`GF`), Réunion (`RE`), Mayotte (`YT`),
- Saint-Pierre-et-Miquelon (`PM`), Saint-Barthélemy (`BL`), Saint-Martin (`MF`).

## Modèle de données par territoire
Chaque entrée contient :
- `pricingModel` (prix observés vs maxima réglementés),
- `officialSources` (liens de référence),
- `regulatedMaxima` (si applicable),
- `verification` (niveau de complétude/opérations restantes).

## Différence métropole vs ultramarin
- **Métropole** : logique principale par prix observés station (`prix-carburants.gouv.fr` + API Économie).
- **DOM/COM** : logique possible de maxima réglementés mensuels selon arrêtés préfectoraux, variable selon territoire.

## Workflow de finalisation recommandé
1. Compléter les `officialSources.monthArticle` et `monthDecreePdf` pour chaque territoire ultramarin (hors GP déjà pré-rempli).
2. Remplir `regulatedMaxima` avec les chiffres officiels mensuels.
3. Passer `verification` de `todo`/`partial` à `official_pdf_verified`.
4. Conserver la source nationale temps réel pour la granularité station.
