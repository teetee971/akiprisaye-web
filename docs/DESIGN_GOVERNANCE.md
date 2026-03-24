# Design Governance — A KI PRI SA YÉ

Ce document définit les règles minimales pour garantir une interface cohérente, accessible et maintenable.

## 1) Source de vérité visuelle

- Les couleurs, rayons, espacements et timings d’animation doivent venir des tokens globaux (`frontend/src/styles/globals.css`).
- Les valeurs hardcodées dans les composants/pages sont à éviter, sauf exception justifiée en commentaire.

## 2) Thèmes

- Le thème est piloté par tokens CSS (`:root`, `[data-theme="dark"]`, `prefers-color-scheme`).
- Les layouts de base ne doivent pas imposer un fond/texte non tokenisé.

## 3) Accessibilité (RGAA / WCAG)

- Un seul fichier maître pour les règles transverses a11y : `frontend/src/styles/a11y.css`.
- Toute règle locale qui duplique `skip-link`, `focus-visible`, ou `touch target` est interdite.
- Touch target minimum : 44x44.
- Navigation clavier obligatoire pour menus, modales, dropdowns.

## 4) Qualité UX

- Prioriser l’action principale au-dessus de la ligne de flottaison (1 promesse, 1 CTA principal, 1 preuve).
- Éviter les doublons de navigation et intitulés ambigus.
- Les liens footer doivent être uniques et orientés par intention.

## 5) Performance & SEO

- Respecter les budgets Lighthouse (`lighthouserc.json`).
- Tout écran majeur doit définir ses métadonnées via `SEOHead` (titre, description, canonical, JSON-LD si nécessaire).
- Les blocs non critiques doivent rester lazy-loadés.

## 6) Checklist PR (UI)

Avant merge:

1. Pas de couleur hardcodée non justifiée.
2. Pas de duplication de règles a11y globales.
3. Focus clavier vérifié sur les éléments interactifs.
4. Aucune régression des chemins de navigation principaux.
5. Lighthouse accessibilité maintenu >= 0.90.
