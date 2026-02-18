# Import ticket caisse 1599588

Ce dossier contient des fichiers prêts à l'intégration dans un logiciel de base de données.

## Fichiers

- `receipts.csv` : entête ticket et paiement.
- `receipt_items.csv` : lignes d'articles.
- `receipt_taxes.csv` : ventilation TVA.
- `import_receipt_1599588.sql` : création de tables + insertion des données.

## Utilisation rapide

1. Importer les fichiers CSV dans vos tables `receipts`, `receipt_items` et `receipt_taxes`.
2. Ou exécuter `import_receipt_1599588.sql` dans votre SGBD compatible SQL standard.

## Contrôle de cohérence

- Total ticket: `16.90 EUR`.
- Paiement CB: `16.90 EUR`.
- Nombre d'articles: `7`.
