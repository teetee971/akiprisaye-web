# État SEO — 25 mars 2026

## Synthèse rapide
- Validation technique SEO: **OK** (`seo:validate` passe, sans erreurs bloquantes).
- Pages générées: **2 400** dans le manifest SEO.
- Sitemap: **173 URLs** publiées.
- Boucle d'analyse SEO (`seo:loop`): **20 pages scorées**.
- Score global moyen: **36,53/100** (fort potentiel d'amélioration éditoriale et maillage).

## Détails des checks
- `generated-pages.json`: 2 400 pages.
- `seo-pages-manifest.json`: 2 400 entrées, pas de doublons.
- Sécurité des chemins: OK (pas de path traversal détecté).
- `internal-links-map.json`: 250 entrées.
- `sitemap.xml`: 173 balises `<url>`.
- `signals.json`: généré après `seo:loop`.

## Signal SEO actuel (échantillon analysé)
- Top page: `/mq/guide/octroi-mer` — score global **86,61**.
- Plus faible page: `/yt/produit/huile-tournesol` — score global **1,29**.
- Répartition des recommandations:
  - **1** haute priorité
  - **16** moyennes
  - **3** faibles
- Typologie des recommandations:
  - `BOOST_LINKING`: 10
  - `IMPROVE_META`: 7
  - `IMPROVE_TITLE`: 1
  - `ENRICH_CONTENT`: 1
  - `DEPRIORITIZE`: 1

## Priorités actionnables
1. **Optimiser les snippets (title/meta)** sur les pages à fortes impressions et CTR faible.
2. **Renforcer le maillage interne** (catégories/comparaisons/produits), principal levier identifié.
3. **Enrichir le contenu** des pages à faible trafic mais intention utile.
4. **Désindexation ou dépriorisation** des pages très faibles (quasi sans impressions/clics).

## Remarque importante
Les signaux `scripts/auto-seo/output/*.json` semblent être des **données de simulation / monitoring interne** de la pipeline SEO (pas une export direct GSC live). Les décisions finales doivent être recoupées avec Search Console/analytics de production.
