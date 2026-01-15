# Interopérabilité Collectivités / Universités - Version 1.0

## 🎯 Objectif

Rendre les données de la plateforme **réutilisables officiellement** par les collectivités territoriales, universités, instituts de recherche et organismes publics.

## 🌍 Principe général

Les données sont accessibles via :
- **Endpoints publics en lecture seule**
- **Schémas normalisés et documentés**
- **Versioning des datasets**
- **Métadonnées compatibles INSEE / Eurostat**
- **Licence open-data explicite**

## 📡 Endpoints publics (Read-only)

### Base URL

```
https://akiprisaye.fr/api/v1/opendata/
```

### Endpoints disponibles

#### 1. Export de prix

```
GET /opendata/prices
```

**Paramètres de requête:**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `format` | string | Non | Format d'export: `csv` ou `json` (défaut: `json`) |
| `territory` | string | Non | Code territoire INSEE (GP, MQ, GF, etc.) |
| `dateStart` | string | Non | Date de début (ISO 8601) |
| `dateEnd` | string | Non | Date de fin (ISO 8601) |
| `category` | string | Non | Catégorie de produit |
| `limit` | integer | Non | Nombre max d'enregistrements (défaut: 1000, max: 10000) |

**Exemple de requête:**

```bash
curl "https://akiprisaye.fr/api/v1/opendata/prices?territory=GP&format=json&limit=100"
```

**Réponse (JSON):**

```json
{
  "metadata": {
    "generatedAt": "2026-01-02T20:00:00Z",
    "dataVersion": "3.0.0",
    "territory": "GP",
    "sources": ["label_scan", "public_database"],
    "recordCount": 100,
    "dateRange": {
      "start": "2025-12-01T00:00:00Z",
      "end": "2026-01-02T23:59:59Z"
    },
    "schemaVersion": "1.0.0",
    "license": "Open Data Commons Open Database License (ODbL) v1.0"
  },
  "records": [
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
  ]
}
```

#### 2. Export de produits

```
GET /opendata/products
```

Mêmes paramètres que `/prices`, retourne les informations produit (EAN, nom, marque, ingrédients, nutrition).

#### 3. Export des magasins

```
GET /opendata/stores
```

Retourne la liste des points de vente avec localisation géographique.

#### 4. Statistiques

```
GET /opendata/statistics
```

Retourne les statistiques globales : nombre de produits, prix, territoires couverts, période de données.

#### 5. Métadonnées du schéma

```
GET /opendata/schema
```

Retourne le schéma JSON complet des données (voir `schemas/open-data.schema.json`).

## 📊 Versioning des datasets

### Versions sémantiques

Les données suivent un versioning sémantique (semver) : `MAJOR.MINOR.PATCH`

- **MAJOR** : Changement incompatible du schéma de données
- **MINOR** : Ajout de champs, nouvelles fonctionnalités compatibles
- **PATCH** : Corrections de bugs, améliorations mineures

### Versions disponibles

| Version | Date de sortie | Statut | Description |
|---------|----------------|--------|-------------|
| 3.0.0 | 2026-01-02 | Stable | Version officielle v3.0 - Observatoire public |
| 2.1.0 | 2025-12-15 | Archivée | Version précédente |
| 2.0.0 | 2025-11-01 | Archivée | Migration méthodologie officielle |

### Accès aux versions archivées

```
GET /opendata/prices?version=2.1.0
```

Les versions archivées restent accessibles pendant minimum 12 mois après leur remplacement.

## 🏛️ Compatibilité INSEE / Eurostat

### Codes territoires INSEE

Utilisation des codes officiels INSEE pour les territoires :

- **GP** : Guadeloupe (971)
- **MQ** : Martinique (972)
- **GF** : Guyane (973)
- **RE** : Réunion (974)
- **YT** : Mayotte (976)
- **PM** : Saint-Pierre-et-Miquelon (975)
- **BL** : Saint-Barthélemy (977)
- **MF** : Saint-Martin (978)
- **WF** : Wallis-et-Futuna (986)
- **PF** : Polynésie française (987)
- **NC** : Nouvelle-Calédonie (988)
- **TF** : Terres australes et antarctiques françaises (984)

### Classification des produits

Compatible avec la nomenclature COICOP (Classification of Individual Consumption by Purpose) utilisée par l'INSEE et Eurostat pour les indices de prix.

### Format temporel

Toutes les dates sont au format ISO 8601 : `YYYY-MM-DDTHH:mm:ssZ`

### Localisation géographique

Coordonnées GPS au format WGS84 (EPSG:4326), standard international.

## 🔄 Limites et quotas

### Rate limiting

- **100 requêtes par heure** pour les utilisateurs non authentifiés
- **1000 requêtes par heure** pour les utilisateurs authentifiés
- **Requêtes illimitées** pour les partenaires institutionnels (sur demande)

### Taille des exports

- **Maximum 10 000 enregistrements** par requête
- Pour des exports plus volumineux, utiliser la pagination ou contacter l'équipe

### Fraîcheur des données

- Les données sont mises à jour **en continu**
- Les agrégats sont recalculés **quotidiennement**
- L'endpoint `/statistics` reflète l'état actuel

## 🔐 Authentification (optionnelle)

Pour accéder à des quotas plus élevés, utiliser une clé API :

```bash
curl -H "X-API-Key: votre_cle_api" \
  "https://akiprisaye.fr/api/v1/opendata/prices"
```

Pour obtenir une clé API institutionnelle :
- Email : contact@akiprisaye.fr
- Objet : Demande de clé API institutionnelle
- Inclure : Nom de l'institution, usage prévu, estimation du volume

## 📚 Documentation technique

### Schéma JSON

Le schéma complet est disponible dans `schemas/open-data.schema.json` et respecte la norme JSON Schema Draft 7.

### Validation des données

Les exports peuvent être validés avec des outils comme :

- **ajv** (JavaScript/Node.js)
- **jsonschema** (Python)
- **json-schema-validator** (Java)

Exemple avec Python :

```python
import json
import jsonschema

# Charger le schéma
with open('schemas/open-data.schema.json', 'r') as f:
    schema = json.load(f)

# Charger les données
with open('export.json', 'r') as f:
    data = json.load(f)

# Valider
jsonschema.validate(data, schema)
print("✓ Données valides")
```

## 🎓 Cas d'usage institutionnels

### 1. Collectivités territoriales

**Observatoires locaux du pouvoir d'achat**
- Intégration dans les tableaux de bord territoriaux
- Suivi de l'évolution des prix par commune
- Comparaisons inter-territoires

### 2. Universités et centres de recherche

**Études académiques**
- Analyse économétrique de l'inflation
- Recherche sur la vie chère dans les outre-mer
- Modélisation des comportements de consommation

### 3. Instituts statistiques

**Enrichissement de bases de données**
- Complément aux enquêtes prix officielles
- Données crowdsourcées pour validation
- Indicateurs de suivi en temps réel

### 4. Médias

**Datajourna lisme**
- Visualisations interactives
- Enquêtes sur les écarts de prix
- Infographies grand public

## 📋 Exemples d'intégration

### Python avec Pandas

```python
import pandas as pd
import requests

# Récupérer les données
response = requests.get(
    'https://akiprisaye.fr/api/v1/opendata/prices',
    params={'territory': 'GP', 'format': 'json', 'limit': 5000}
)
data = response.json()

# Convertir en DataFrame
df = pd.DataFrame(data['records'])

# Analyse
avg_price_by_category = df.groupby('category')['price'].mean()
print(avg_price_by_category)
```

### R avec tidyverse

```r
library(tidyverse)
library(httr)
library(jsonlite)

# Récupérer les données
response <- GET(
  "https://akiprisaye.fr/api/v1/opendata/prices",
  query = list(territory = "MQ", format = "json", limit = 5000)
)

data <- content(response, as = "text") %>% fromJSON()
df <- as_tibble(data$records)

# Analyse
df %>%
  group_by(category) %>%
  summarise(avg_price = mean(price))
```

### Excel Power Query

1. Données > Obtenir des données > À partir du web
2. URL : `https://akiprisaye.fr/api/v1/opendata/prices?territory=RE&format=json&limit=1000`
3. Transformer > JSON > Records
4. Développer les colonnes

## 🆘 Support technique

### Documentation complète

- **Schéma de données** : `schemas/open-data.schema.json`
- **Méthodologie** : `METHODOLOGIE_OFFICIELLE_v2.0.md`
- **Licence** : `LICENCE_OPEN_DATA.md`

### Contact

- **Email** : api@akiprisaye.fr
- **Documentation en ligne** : https://akiprisaye.fr/docs/api
- **Suivi des incidents** : https://github.com/teetee971/akiprisaye-web/issues

### Mailing list

Inscription à la liste de diffusion pour :
- Annonces de nouvelles versions
- Changements de l'API
- Maintenances planifiées

Email : api-subscribe@akiprisaye.fr

## ⚖️ Licence et attribution

### Licence

Les données sont publiées sous **Open Data Commons Open Database License (ODbL) v1.0**.

Voir le fichier `LICENCE_OPEN_DATA.md` pour le texte complet.

### Attribution obligatoire

Toute réutilisation doit mentionner :

```
Source : A ki pri sa yé - Observatoire citoyen des prix
https://akiprisaye.fr
Licence : ODbL v1.0
```

### Citation académique

Format suggéré pour les publications :

```
A ki pri sa yé (2026). Observatoire public des prix - DOM-ROM-COM.
Dataset version 3.0.0. https://akiprisaye.fr/opendata
Consulté le [date]. Licence ODbL v1.0.
```

---

**Version du document** : 1.0  
**Date de publication** : 2 janvier 2026  
**Dernière mise à jour** : 2 janvier 2026
