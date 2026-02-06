# Sources & méthodologie — Prix observés

## Sources autorisées
- **Tickets citoyens (OCR)** : observations issues de tickets de caisse déposés par la communauté.
- **Données ouvertes** : indices et relevés publics lorsqu’ils sont disponibles.
- **Partenariats** : endpoints prévus mais **désactivés par défaut** (feature flag).

## Ce que nous ne faisons pas
- Aucun scraping de sites marchands.
- Aucune récupération de prix via des canaux non autorisés.
- Aucune donnée présentée comme « officielle » sans source explicite.

## Transparence affichée côté utilisateur
Chaque carte de prix indique :
- **Source** (tickets citoyens, open data, partenariats).
- **Territoire** et **enseigne anonymisée**.
- **Date** de dernière observation.
- **Nombre d’observations** agrégées.
- **Score de confiance** (faible, moyen, élevé).

## Calcul du score de confiance (résumé)
Le score est calculé à partir de :
- la **récence** des observations,
- le **nombre de relevés**.

Le score est ensuite converti en libellé de confiance pour l’affichage.
