# API Comparaison Territoriale - A KI PRI SA YÉ

## Description

API publique permettant de comparer les prix d'un même produit entre plusieurs territoires (DROM/COM/Hexagone), basée exclusivement sur des observations réelles validées.

## Caractéristiques

- ✅ Comparaison multi-territoires
- ✅ Agrégations statistiques (min, max, moyenne)
- ✅ Données réelles uniquement
- ✅ Période configurable (défaut: 30 derniers jours)
- ❌ Aucune prédiction
- ❌ Aucune extrapolation
- ❌ Aucune estimation de prix manquant

## Endpoint

### GET /api/comparaison/territoires

Compare un produit entre plusieurs territoires sur une période donnée.

**Paramètres requis:**

- `produit` (string): ID ou nom du produit (recherche partielle)

**Paramètres optionnels:**

- `territoires` (string): Liste de territoires séparés par virgule (ex: "Guadeloupe,Martinique")
  - Si non spécifié, tous les territoires avec données sont inclus
- `date_from` (string): Date de début au format YYYY-MM-DD
- `date_to` (string): Date de fin au format YYYY-MM-DD
  - Par défaut: 30 derniers jours si aucune date n'est spécifiée

**Exemple de requête:**

```bash
GET /api/comparaison/territoires?produit=riz&territoires=Guadeloupe,Martinique,La%20Réunion
```

**Exemple de réponse:**

```json
{
  "meta": {
    "produit": "riz",
    "periode": {
      "from": "2025-12-07",
      "to": "2026-01-06"
    },
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "avertissement": "Données observées – non prédictives – usage citoyen et institutionnel"
  },
  "comparaison": [
    {
      "territoire": "Guadeloupe",
      "min": 1.25,
      "max": 1.80,
      "moyenne": 1.52,
      "observations": 12,
      "derniere_mise_a_jour": "2026-01-05"
    },
    {
      "territoire": "Martinique",
      "min": 1.30,
      "max": 1.75,
      "moyenne": 1.48,
      "observations": 8,
      "derniere_mise_a_jour": "2026-01-04"
    },
    {
      "territoire": "La Réunion",
      "min": 1.35,
      "max": 1.90,
      "moyenne": 1.65,
      "observations": 15,
      "derniere_mise_a_jour": "2026-01-06"
    }
  ]
}
```

## Méthodologie de calcul

### Agrégations

Pour chaque territoire, les métriques suivantes sont calculées:

1. **Prix minimum** (`min`): Prix unitaire le plus bas observé pendant la période
2. **Prix maximum** (`max`): Prix unitaire le plus élevé observé pendant la période
3. **Prix moyen** (`moyenne`): Moyenne arithmétique simple de tous les prix observés
4. **Nombre d'observations** (`observations`): Nombre total de prix relevés
5. **Dernière mise à jour** (`derniere_mise_a_jour`): Date de l'observation la plus récente

### Correspondance des produits

La recherche de produit est effectuée par correspondance partielle du nom:
- Recherche insensible à la casse
- Correspondance bidirectionnelle (produit contient requête OU requête contient produit)
- Exemples:
  - Requête "riz" → trouve "RIZ LONG 1KG", "Riz basmati", etc.
  - Requête "lait" → trouve "LAIT UHT 1L", "Lait demi-écrémé", etc.

### Période par défaut

Si aucune date n'est spécifiée:
- Date de début: 30 jours avant aujourd'hui
- Date de fin: Aujourd'hui

## Règles de gouvernance

### Strictement interdit

❌ **Prédiction**: Aucun prix futur n'est calculé
❌ **Extrapolation**: Aucune tendance n'est projetée
❌ **Estimation**: Si un territoire n'a pas de données, il n'apparaît pas dans les résultats

### Données insuffisantes

Si aucune donnée n'est disponible pour les critères spécifiés:
- Le champ `comparaison` est un tableau vide: `[]`
- Un avertissement explicite est ajouté dans `meta.avertissement`

**Exemple:**

```json
{
  "meta": {
    "produit": "produit_inexistant",
    "periode": {
      "from": "2025-12-07",
      "to": "2026-01-06"
    },
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "avertissement": "Aucune donnée disponible pour ce produit et cette période. Les comparaisons sont basées uniquement sur des observations réelles."
  },
  "comparaison": []
}
```

## Limites statistiques

### Biais potentiels

⚠️ Les données sont soumises aux biais suivants:

1. **Couverture géographique**: Dépend de la présence de contributeurs dans chaque territoire
2. **Fréquence d'observation**: Varie selon l'activité des contributeurs
3. **Représentativité**: Ne couvre pas tous les points de vente d'un territoire
4. **Saisonnalité**: Certains produits peuvent être plus ou moins disponibles selon les périodes

### Interprétation

✅ **Usage recommandé**:
- Comparaison indicative entre territoires
- Détection d'écarts importants de prix
- Analyse de tendances générales

❌ **Usage déconseillé**:
- Prise de décision financière individuelle basée uniquement sur ces données
- Comparaison de produits non strictement identiques
- Généralisation à l'ensemble du marché d'un territoire

## Cas d'usage

### 1. Journalisme et enquête

```bash
# Comparer le prix du lait dans tous les DROM
GET /api/comparaison/territoires?produit=lait%20uht%201l&date_from=2025-01-01&date_to=2025-12-31
```

### 2. Analyse institutionnelle

```bash
# Comparer les produits de première nécessité sur 3 mois
GET /api/comparaison/territoires?produit=riz&date_from=2025-10-01&date_to=2025-12-31
```

### 3. Recherche académique

```python
import requests

# Analyser l'écart de prix entre métropole et DROM
territories = ['Guadeloupe', 'Martinique', 'La Réunion', 'Hexagone']
products = ['riz', 'lait', 'pain', 'huile']

for product in products:
    response = requests.get(
        'https://akiprisaye.pages.dev/api/comparaison/territoires',
        params={
            'produit': product,
            'territoires': ','.join(territories),
            'date_from': '2025-01-01',
            'date_to': '2025-12-31'
        }
    )
    data = response.json()
    print(f"Comparaison pour {product}:")
    for territory in data['comparaison']:
        print(f"  {territory['territoire']}: {territory['moyenne']}€ (n={territory['observations']})")
```

## Headers HTTP

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: public, max-age=300` (5 minutes)
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`

## Codes de statut HTTP

- `200 OK`: Requête réussie (même si aucune donnée n'est trouvée)
- `400 Bad Request`: Paramètre `produit` manquant ou invalide
- `500 Internal Server Error`: Erreur serveur

## Avertissement d'usage public

⚠️ **Cette API fournit des données observées, non prédictives**

- Les prix reflètent des observations ponctuelles de terrain
- La couverture géographique et temporelle est variable
- Les données ne constituent pas une étude de marché exhaustive
- Usage recommandé: vigilance citoyenne et analyse institutionnelle
- Ne remplace pas une étude de prix professionnelle

## Support

Pour toute question ou signalement:
- Site web: https://akiprisaye.pages.dev
- Documentation API principale: [API_OPEN_DATA.md](./API_OPEN_DATA.md)

## Licence

Les données sont publiées sous licence ouverte conformément à la politique open-data du projet A KI PRI SA YÉ.

---

**Dernière mise à jour**: 2026-01-07
**Version de l'API**: 1.0.0
