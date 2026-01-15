# Données Observatoire – A KI PRI SA YÉ

Ces fichiers contiennent des relevés de prix réels (citoyens ou partenaires),
utilisés pour alimenter l'Observatoire public.

## Informations générales

- **Territoire** : Guadeloupe
- **Format** : schéma canonique validé CI
- **Usage** : calcul indicateurs + comparateur citoyen

## Structure des fichiers

Chaque fichier JSON contient :
- `territoire` : Nom du territoire (ex: Guadeloupe)
- `date_snapshot` : Date du relevé (format ISO YYYY-MM-DD)
- `source` : Type de source (ex: releve_citoyen)
- `qualite` : Niveau de qualité (ex: verifie)
- `donnees` : Tableau des observations de prix

## Observations de prix

Chaque observation contient :
- `commune` : Commune de l'observation
- `enseigne` : Nom de l'enseigne (Carrefour, E.Leclerc, Indépendants, etc.)
- `categorie` : Catégorie du produit (Produits laitiers, Épicerie, etc.)
- `produit` : Nom descriptif du produit
- `ean` : Code EAN/GTIN du produit
- `unite` : Unité de mesure (1L, 1kg, etc.)
- `prix` : Prix en euros

## Utilisation

Ces données sont utilisées pour :
- Calcul des prix moyens par catégorie
- Calcul des écarts entre DOM et métropole
- Analyse de la dispersion des prix entre enseignes
- Suivi de l'évolution temporelle des prix

## Avertissement

⚠️ Ces données sont des échantillons initiaux pour alimenter l'Observatoire.

✅ Toutes les données sont vérifiées et proviennent de sources fiables.
