# API Évolution Temporelle des Prix - A KI PRI SA YÉ

## Description

API publique permettant de visualiser l'évolution réelle des prix d'un produit dans un territoire donné, sur une période configurable, avec différentes granularités temporelles (jour, semaine, mois).

## Caractéristiques

- ✅ Évolution temporelle factuelle
- ✅ Granularités: jour, semaine, mois
- ✅ Agrégations par période (min, max, moyenne)
- ✅ Données réelles uniquement
- ❌ Aucune interpolation
- ❌ Aucun lissage artificiel
- ❌ Aucune extrapolation
- ❌ Aucun comblement de période vide

## Endpoint

### GET /api/evolution/prix

Retourne l'évolution temporelle des prix pour un produit dans un territoire.

**Paramètres requis:**

- `produit` (string): Nom du produit (recherche partielle)
- `territoire` (string): Nom du territoire

**Paramètres optionnels:**

- `date_from` (string): Date de début au format YYYY-MM-DD
- `date_to` (string): Date de fin au format YYYY-MM-DD
  - Par défaut: 30 derniers jours si non spécifié
- `granularite` (string): Granularité temporelle
  - Valeurs: `jour`, `semaine`, `mois`
  - Par défaut: choix automatique selon la période

**Exemple de requête:**

```bash
GET /api/evolution/prix?produit=riz&territoire=Guadeloupe&granularite=semaine&date_from=2025-01-01&date_to=2025-12-31
```

**Exemple de réponse:**

```json
{
  "meta": {
    "produit": "riz",
    "territoire": "Guadeloupe",
    "granularite": "semaine",
    "periode": {
      "from": "2025-01-01",
      "to": "2025-12-31"
    },
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "avertissement": "Données observées uniquement – aucune interpolation – périodes sans données sont absentes"
  },
  "evolution": [
    {
      "periode": "2025-W01",
      "min": 1.40,
      "max": 1.75,
      "moyenne": 1.58,
      "observations": 6
    },
    {
      "periode": "2025-W02",
      "min": 1.45,
      "max": 1.80,
      "moyenne": 1.62,
      "observations": 8
    },
    {
      "periode": "2025-W05",
      "min": 1.50,
      "max": 1.85,
      "moyenne": 1.68,
      "observations": 5
    }
  ]
}
```

**Note importante**: Dans l'exemple ci-dessus, les semaines W03 et W04 sont absentes car aucune observation n'a été enregistrée pendant ces périodes. C'est un comportement intentionnel.

## Méthodologie d'agrégation

### Granularités temporelles

#### Jour (`jour`)

- Format de période: `YYYY-MM-DD`
- Exemple: `2025-01-15`
- Usage recommandé: Périodes courtes (< 1 mois)

#### Semaine (`semaine`)

- Format de période: `YYYY-Www` (ISO 8601)
- Exemple: `2025-W03` (3ème semaine de 2025)
- La semaine commence le lundi
- Usage recommandé: Périodes moyennes (1-6 mois)

#### Mois (`mois`)

- Format de période: `YYYY-MM`
- Exemple: `2025-03` (mars 2025)
- Usage recommandé: Périodes longues (> 6 mois)

### Choix automatique de la granularité

Si le paramètre `granularite` n'est pas spécifié, il est déterminé automatiquement:

| Durée de la période | Granularité choisie |
|---------------------|---------------------|
| ≤ 31 jours          | jour                |
| 32-180 jours        | semaine             |
| > 180 jours         | mois                |

### Calcul des métriques

Pour chaque période, les métriques suivantes sont calculées:

1. **Prix minimum** (`min`): Prix unitaire le plus bas observé dans la période
2. **Prix maximum** (`max`): Prix unitaire le plus élevé observé dans la période
3. **Prix moyen** (`moyenne`): Moyenne arithmétique simple de tous les prix observés
4. **Nombre d'observations** (`observations`): Nombre total de prix relevés dans la période

## Règles critiques (non négociables)

### Périodes vides

⚠️ **Si une période n'a pas de données, elle est absente du tableau**

Les périodes sans observation ne sont PAS:
- ❌ Interpolées
- ❌ Estimées
- ❌ Comblées par des valeurs calculées

Cela signifie que l'array `evolution` peut contenir des "trous" temporels. C'est intentionnel et reflète la réalité des observations.

### Ruptures de données

Les ruptures dans les données doivent être affichées explicitement:
- Dans l'API: périodes manquantes dans le tableau
- Dans le frontend: discontinuités visibles sur le graphique
- Badges de qualité de données (voir section Frontend)

## Différence évolution observée vs tendance

| Évolution observée (cette API) | Tendance (hors scope) |
|--------------------------------|----------------------|
| ✅ Données réelles uniquement  | ❌ Projection future |
| ✅ Périodes vides = absentes   | ❌ Lissage artificiel|
| ✅ Variations brutes           | ❌ Interpolation     |
| ✅ Explicable                  | ❌ Prédictive        |

## Cas d'usage

### 1. Suivi citoyen d'un produit

```bash
# Suivre l'évolution du prix du riz sur 3 mois
GET /api/evolution/prix?produit=riz&territoire=Guadeloupe&date_from=2025-10-01&date_to=2025-12-31
```

### 2. Analyse journalistique

```javascript
// Comparer l'évolution dans plusieurs territoires
const territories = ['Guadeloupe', 'Martinique', 'La Réunion'];
const product = 'lait';

for (const territory of territories) {
  const response = await fetch(
    `/api/evolution/prix?produit=${product}&territoire=${territory}&granularite=mois&date_from=2025-01-01&date_to=2025-12-31`
  );
  const data = await response.json();
  console.log(`${territory}:`, data.evolution);
}
```

### 3. Étude académique

```python
import requests
import pandas as pd

# Extraire l'évolution pour analyse statistique
response = requests.get(
    'https://akiprisaye.pages.dev/api/evolution/prix',
    params={
        'produit': 'riz',
        'territoire': 'Guadeloupe',
        'granularite': 'jour',
        'date_from': '2025-01-01',
        'date_to': '2025-12-31'
    }
)

data = response.json()
df = pd.DataFrame(data['evolution'])

# Analyse des variations
df['variation'] = df['moyenne'].pct_change() * 100
print(f"Variation moyenne: {df['variation'].mean():.2f}%")
print(f"Variation maximale: {df['variation'].max():.2f}%")
```

## Limites statistiques

### Biais et limites

⚠️ Les données sont soumises aux limites suivantes:

1. **Fréquence d'observation variable**: Certaines périodes ont plus d'observations que d'autres
2. **Couverture géographique partielle**: Tous les points de vente ne sont pas couverts
3. **Variabilité des produits**: Un même nom peut correspondre à des produits légèrement différents
4. **Saisonnalité**: Certains produits peuvent avoir des variations saisonnières naturelles

### Interprétation

✅ **L'évolution montre**:
- Les variations de prix réellement observées
- Les périodes où des observations ont été faites
- La dispersion des prix (via min/max)

❌ **L'évolution ne montre PAS**:
- Ce qui se passerait dans les périodes sans données
- Une tendance future
- Les prix dans tous les points de vente du territoire

## Frontend - Affichage recommandé

### Graphique

- **Axe X**: Temps (périodes)
- **Axe Y**: Prix (€)
- **Courbe principale**: Prix moyen
- **Bande optionnelle**: Min/max (zone ombrée)

### Badges de qualité

Afficher des badges visuels pour la fraîcheur des données:

- 🟢 **Données récentes**: Dernière observation < 30 jours
- 🟡 **Données partielles**: Dernière observation 30-90 jours
- 🔴 **Données insuffisantes**: Dernière observation > 90 jours ou < 3 observations

### Discontinuités

Les périodes sans données doivent être visibles:
- Ligne pointillée ou interrompue
- Zone grisée
- Annotation explicite

## Headers HTTP

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: public, max-age=300` (5 minutes)
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`

## Codes de statut HTTP

- `200 OK`: Requête réussie (même si aucune donnée n'est trouvée)
- `400 Bad Request`: Paramètres `produit` ou `territoire` manquants
- `500 Internal Server Error`: Erreur serveur

## Avertissements

⚠️ **Lecture factuelle de l'évolution des prix**

- Les données reflètent des observations ponctuelles
- Les périodes sans données ne sont pas estimées
- Les variations peuvent être dues à différents facteurs (promotions, ruptures, changements de conditionnement, etc.)
- Ne constitue pas une étude de marché exhaustive

## Support

Pour toute question ou signalement:
- Site web: https://akiprisaye.pages.dev
- Documentation API principale: [API_OPEN_DATA.md](./API_OPEN_DATA.md)
- Comparaison territoriale: [API_COMPARAISON_TERRITOIRES.md](./API_COMPARAISON_TERRITOIRES.md)

## Licence

Les données sont publiées sous licence ouverte conformément à la politique open-data du projet A KI PRI SA YÉ.

---

**Dernière mise à jour**: 2026-01-07
**Version de l'API**: 1.0.0
