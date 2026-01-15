# Observatoire Public des Prix - Version 1.0

## 🎯 Objectif

Transformer la plateforme en **observatoire public des prix**, exploitable par les citoyens, les médias et les institutions pour suivre l'évolution réelle du coût de la vie dans les territoires ultramarins.

## 🏛️ Caractéristiques principales

### 1. Données agrégées uniquement

- **Lecture seule** : Aucune modification possible des données affichées
- **Agrégation** : Moyennes, minimums, maximums calculés sur l'ensemble des observations
- **Transparence** : Méthodologie de calcul explicite et visible
- **Horodatage** : Chaque donnée est datée et sourcée

### 2. Tableaux dynamiques

L'observatoire présente les données sous forme de tableaux avec :

- **Prix moyens** par produit et territoire
- **Prix min/max** observés sur la période
- **Évolution** sur 7j, 30j, 90j et 1 an
- **Nombre d'observations** pour chaque mesure

### 3. Filtres disponibles

Les utilisateurs peuvent filtrer les données par :

- **Code EAN** : Recherche d'un produit spécifique
- **Catégorie** : Produits laitiers, boulangerie, épicerie, etc.
- **Territoire** : GP, MQ, GF, RE, YT, etc.
- **Période** : 7 derniers jours, 30 jours, 90 jours, 1 an, ou personnalisée

### 4. Exports open-data

Deux formats d'export disponibles :

#### Export CSV
- Format tabulaire standard
- Séparateur : virgule (`,`)
- Encodage : UTF-8
- En-têtes inclus
- Compatible Excel, LibreOffice, outils d'analyse

#### Export JSON
- Format structuré avec métadonnées
- Indentation pour lisibilité
- Schéma documenté
- Compatible avec APIs et outils de traitement

## 📊 Méthodologie

### Collecte des données

Les données proviennent de trois sources principales :

1. **Scans utilisateurs** : Photos de tickets de caisse et codes-barres
2. **APIs publiques** : Open Food Facts, bases gouvernementales
3. **Bases de données officielles** : IEDOM, INSEE (quand disponibles)

### Calcul des agrégats

- **Prix moyen** : Moyenne arithmétique simple de toutes les observations sur la période
- **Prix min/max** : Valeurs extrêmes observées
- **Évolution** : Variation en pourcentage entre le prix moyen actuel et le prix moyen de la période précédente

### Qualité des données

Chaque observation inclut un **score de qualité** basé sur :

- Source de la donnée (scan direct = meilleur score)
- Fraîcheur de l'information
- Cohérence avec les observations précédentes
- Nombre de confirmations indépendantes

Seules les observations avec un score de qualité suffisant sont incluses dans les calculs.

## 🔒 Garanties

### Données brutes uniquement

- Aucune extrapolation
- Aucune estimation statistique avancée
- Aucun lissage artificiel
- Aucun algorithme propriétaire d'ajustement

### Métadonnées obligatoires

Chaque export inclut :

- Date de génération
- Version du dataset
- Territoire(s) couvert(s)
- Sources utilisées
- Nombre d'enregistrements
- Période couverte
- Version du schéma de données
- Licence open-data

### Horodatage et traçabilité

- Chaque prix est horodaté au moment de l'observation
- La source est systématiquement indiquée
- L'enseigne est mentionnée quand disponible
- Le territoire est obligatoire

## 📦 Structure des exports

### Métadonnées (JSON uniquement)

```json
{
  "metadata": {
    "generatedAt": "2026-01-02T20:00:00Z",
    "dataVersion": "3.0.0",
    "territory": ["GP", "MQ"],
    "sources": ["label_scan", "public_database"],
    "recordCount": 1250,
    "dateRange": {
      "start": "2025-12-01T00:00:00Z",
      "end": "2026-01-02T23:59:59Z"
    },
    "schemaVersion": "1.0.0",
    "license": "Open Data Commons Open Database License (ODbL) v1.0"
  },
  "records": [...]
}
```

### Enregistrement prix

```json
{
  "ean": "3560070000000",
  "name": "Lait entier UHT 1L",
  "brand": "Marque X",
  "category": "Produits laitiers",
  "territory": "GP",
  "observedAt": "2026-01-02T14:30:00Z",
  "price": 1.35,
  "priceUnit": "€",
  "store": "Enseigne Y",
  "source": "label_scan",
  "qualityScore": 0.95
}
```

## 🚀 Utilisation

### Interface web

1. Accéder à l'observatoire : `/observatoire`
2. Appliquer les filtres souhaités
3. Consulter les tableaux de prix
4. Exporter les données au format CSV ou JSON

### Réutilisation des données

Les données exportées peuvent être réutilisées pour :

- Analyses statistiques personnalisées
- Études académiques
- Articles de presse
- Rapports institutionnels
- Tableaux de bord personnalisés
- Applications tierces

### Licence

Les données sont publiées sous licence **Open Data Commons Open Database License (ODbL) v1.0**.

Vous êtes libre de :
- Copier, distribuer et utiliser les données
- Créer des œuvres dérivées
- Modifier, transformer et développer les données

Sous réserve de :
- **Attribution** : Mentionner la source (A ki pri sa yé)
- **Partage à l'identique** : Les œuvres dérivées doivent être publiées sous la même licence
- **Ouverture** : Les bases de données dérivées doivent rester ouvertes

## ⚠️ Limitations et avertissements

### Caractère informatif

Cet observatoire présente des données agrégées **à titre informatif uniquement**. Il ne constitue pas :

- Une source officielle au sens réglementaire
- Un remplacement des enquêtes statistiques officielles (INSEE, IEDOM)
- Une garantie d'exactitude absolue des prix affichés
- Un engagement sur les prix pratiqués en magasin

### Variabilité des prix

Les prix peuvent varier selon :

- L'enseigne et le point de vente
- La période de l'année (promotions, saisonnalité)
- La zone géographique précise
- Les conditions d'approvisionnement

### Couverture territoriale

La qualité et la densité des observations varient selon les territoires. Les zones les moins peuplées peuvent avoir moins d'observations, ce qui peut affecter la représentativité des moyennes.

## 🔄 Mises à jour

- **Fréquence** : Les données sont mises à jour en continu au fil des nouvelles observations
- **Calculs** : Les agrégats sont recalculés quotidiennement
- **Horodatage** : La date de dernière mise à jour est visible dans l'interface
- **Historique** : Les versions précédentes des exports sont archivées

## 📞 Contact

Pour toute question sur l'observatoire :

- **Email** : contact@akiprisaye.fr
- **Documentation** : https://akiprisaye.fr/methodologie
- **Code source** : https://github.com/teetee971/akiprisaye-web

## 📚 Références

- [Méthodologie complète](METHODOLOGIE_OFFICIELLE_v2.0.md)
- [Schémas de données](schemas/open-data.schema.json)
- [Licence ODbL](LICENCE_OPEN_DATA.md)
- [API d'interopérabilité](INTEROP_COLLECTIVITES_v1.md)

## ✅ Statut officiel — Option 1 (finalisation immédiate)

- **Version :** Observatoire public v1 (stable)
- **Service public — conforme :**
  - Données réelles (open data embarqué)
  - Observatoire vivant avec filtres heure / jour / semaine / mois
  - Courbes lisibles mobile (Recharts)
  - Indication claire “Dernière mise à jour”
  - Périmètre géographique explicite et granularité documentée (mois = période glissante de 30 jours)
- **Crédibilité institutionnelle — validée :**
  - Page méthodologie & transparence en place
  - Sources, limites, fréquence expliquées sans wording trompeur
  - Aucune promesse non tenue ; utilisable par média / collectivité / citoyen
- **Technique & CI — verrouillée :**
  - CI verte et stable, tests asynchrones stabilisés, OCR isolé (prod OK / CI safe)
  - Repo Guard respecté, CodeQL sans alertes, Cloudflare Pages déploiement stable
  - Zéro dette critique

### 🏷️ Actions de clôture (one-shot)

- **Tag de version :** `v1.0.0-observatoire-public`
- **Message officiel :** « A KI PRI SA YÉ met à disposition un observatoire public des prix, fondé sur des données ouvertes, transparentes et documentées, afin de permettre à chacun de comprendre l’évolution du coût de la vie dans les territoires concernés. »
- **Dépôt figé :** aucune feature critique à ajouter ; seulement des enrichissements de données, nouvelles sources, comparaisons.

---

**Version du document** : 1.0  
**Date de publication** : 2 janvier 2026  
**Dernière mise à jour** : 2 janvier 2026
