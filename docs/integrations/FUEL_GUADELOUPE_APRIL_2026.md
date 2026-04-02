# Intégration — Prix réglementés carburants/gaz Guadeloupe (avril 2026)

## Objectif
Intégrer dans le logiciel les informations officielles de la préfecture de Guadeloupe sur la révision des prix maximums au **1er avril 2026 (zéro heure)**.

## Sources à brancher
- Page index (historique mensuel) :
  - `https://www.guadeloupe.gouv.fr/Actions-de-l-Etat/Economie-emploi-travail-formation-et-insertion/France-relance-entreprises-economie-emploi/Les-prix-des-produits-petroliers-et-du-gaz`
- Article avril 2026 :
  - `https://www.guadeloupe.gouv.fr/Actions-de-l-Etat/Economie-emploi-travail-formation-et-insertion/France-relance-entreprises-economie-emploi/Les-prix-des-produits-petroliers-et-du-gaz/Revision-des-prix-maximums-des-produits-petroliers-du-1er-avril-2026-zero-heure`
- Arrêté PDF :
  - `https://www.guadeloupe.gouv.fr/contenu/telechargement/36734/264781/file/AP%20CARBURANT%20AVRIL%202026.pdf`

## Données intégrées dans le repo
Fichier machine-readable :
- `public/data/fuel/guadeloupe-2026-04-regulated-prices.json`

Contenu principal :
- métadonnées de publication/effet,
- contexte marché (hausses WTI/SP/gazole citées par la préfecture),
- prix maxima intégrables (avec indicateur de vérification),
- stratégie de découverte des stations-service.

## Point d'attention (important)
Le tableau chiffré officiel des maxima est rendu en image côté article et n'a pas pu être récupéré automatiquement dans cet environnement.

➡️ Action à finaliser côté ops data :
1. Télécharger l'arrêté PDF officiel.
2. Contrôler les 3 valeurs dans `regulatedMaxima` :
   - `superSansPlomb.value`
   - `gazole.value`
   - `gazBouteille125kg.value`
3. Passer `verification` à `official_pdf_verified`.

## Stations essence Guadeloupe
Lien fourni :
- `https://www.google.com/search?q=essence+guadeloupe&udm=1`

Recommandation produit :
- utiliser une API géodonnée (Google Places / OSM) plutôt qu'un scraping HTML Google,
- stocker un identifiant station interne stable,
- rapprocher les stations avec les prix réglementés et les prix observés terrain.

## Extension nationale
Voir aussi `docs/integrations/FUEL_FRANCE_SCOPE_APRIL_2026.md` pour la déclinaison métropole + tous territoires ultramarins.
