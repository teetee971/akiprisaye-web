# API Open-Data A KI PRI SA YÉ

## Description

API publique en lecture seule exposant les données réelles de l'observatoire des prix de A KI PRI SA YÉ. Cette API permet aux citoyens, journalistes, chercheurs et collectivités d'accéder aux observations de prix validées.

## Caractéristiques

- ✅ Lecture seule (READ ONLY)
- ✅ Aucune authentification requise
- ✅ Données réelles observées uniquement
- ✅ Cache public (5 minutes)
- ✅ CORS activé
- ❌ Aucune écriture possible
- ❌ Aucune prédiction ou estimation

## Endpoints

### GET /api/observations

Retourne la liste des observations validées avec filtres optionnels.

**Paramètres (tous optionnels):**

- `territoire` (string): Filtrer par territoire (ex: "Guadeloupe", "Martinique")
- `produit` (string): Filtrer par nom de produit (recherche partielle)
- `date_from` (string): Date de début au format YYYY-MM-DD
- `date_to` (string): Date de fin au format YYYY-MM-DD
- `limit` (number): Nombre de résultats par page (1-100, défaut: 30)
- `offset` (number): Décalage pour la pagination (défaut: 0)

**Exemple de requête:**

```bash
GET /api/observations?territoire=Guadeloupe&produit=riz&limit=10
```

**Exemple de réponse:**

```json
{
  "meta": {
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "count": 1,
    "filters": {
      "territoire": "Guadeloupe",
      "produit": "riz"
    }
  },
  "data": [
    {
      "id": "2025-12-31-120756-uexpress-morne",
      "territoire": "Guadeloupe",
      "commune": "Morne-à-l'Eau",
      "enseigne": "U express",
      "magasin_id": "37966",
      "date": "2025-12-31",
      "heure": "12:07:56",
      "produits": [
        {
          "nom": "CHIPS",
          "quantite": 1,
          "prix_unitaire": 1.87,
          "prix_total": 1.87,
          "tva_pct": 0,
          "categorie": "Épicerie"
        }
      ],
      "total_ttc": 11.16,
      "source": "ticket_caisse",
      "fiabilite": "preuve_physique",
      "verifie": false,
      "notes": "Observation basée sur ticket de caisse réel",
      "created_at": "2025-12-31T12:07:56.000Z"
    }
  ]
}
```

### GET /api/observations/:id

Retourne une observation unique par son identifiant.

**Paramètres:**

- `id` (string): Identifiant unique de l'observation

**Exemple de requête:**

```bash
GET /api/observations/2025-12-31-120756-uexpress-morne
```

**Exemple de réponse:**

```json
{
  "meta": {
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "count": 1
  },
  "data": [
    {
      "id": "2025-12-31-120756-uexpress-morne",
      "territoire": "Guadeloupe",
      "...": "..."
    }
  ]
}
```

### GET /api/territoires

Retourne la liste officielle des territoires disponibles dans les observations.

**Paramètres:** Aucun

**Exemple de requête:**

```bash
GET /api/territoires
```

**Exemple de réponse:**

```json
{
  "meta": {
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "count": 3
  },
  "data": [
    {
      "nom": "Guadeloupe",
      "count": 15,
      "derniere_observation": "2025-12-31"
    },
    {
      "nom": "Martinique",
      "count": 8,
      "derniere_observation": "2025-12-30"
    },
    {
      "nom": "La Réunion",
      "count": 12,
      "derniere_observation": "2025-12-29"
    }
  ]
}
```

### GET /api/produits

Retourne la liste des produits observés avec leur catégorie et code EAN si disponible.

**Paramètres (optionnels):**

- `categorie` (string): Filtrer par catégorie de produit

**Exemple de requête:**

```bash
GET /api/produits?categorie=Épicerie
```

**Exemple de réponse:**

```json
{
  "meta": {
    "source": "A KI PRI SA YÉ",
    "generated_at": "2026-01-07T01:00:00.000Z",
    "count": 2,
    "filters": {
      "categorie": "Épicerie"
    }
  },
  "data": [
    {
      "nom": "CHIPS",
      "categorie": "Épicerie",
      "observations": 25,
      "derniere_observation": "2025-12-31"
    },
    {
      "nom": "RIZ LONG 1KG",
      "categorie": "Épicerie",
      "ean": "3228857000123",
      "observations": 18,
      "derniere_observation": "2025-12-30"
    }
  ]
}
```

## Format de réponse standard

Toutes les réponses suivent ce schéma:

```json
{
  "meta": {
    "source": "A KI PRI SA YÉ",
    "generated_at": "ISO-8601 timestamp",
    "count": 0,
    "filters": {},
    "error": "message d'erreur si applicable"
  },
  "data": []
}
```

## Headers HTTP

Toutes les réponses incluent:

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: public, max-age=300` (5 minutes)
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Codes de statut HTTP

- `200 OK`: Requête réussie
- `400 Bad Request`: Paramètres invalides
- `404 Not Found`: Ressource non trouvée
- `500 Internal Server Error`: Erreur serveur

## Limites et gouvernance

### Données

- **Données observées uniquement**: Aucune prédiction, estimation ou extrapolation
- **Période de conservation**: Toutes les observations validées depuis le début du projet
- **Mise à jour**: Les données sont mises à jour dès qu'une nouvelle observation est validée

### Utilisation

- **Pas de limite de taux**: API publique sans authentification
- **Cache**: Réponses mises en cache 5 minutes côté client
- **Pagination**: Maximum 100 résultats par page

### Avertissements

⚠️ **Usage citoyen et institutionnel**

Ces données sont:
- Des observations réelles de terrain
- Non prédictives
- Sans garantie d'exhaustivité géographique ou temporelle
- Soumises à la disponibilité des contributeurs

## Exemples d'utilisation

### JavaScript / Fetch API

```javascript
// Récupérer les observations récentes en Guadeloupe
const response = await fetch('/api/observations?territoire=Guadeloupe&limit=20');
const data = await response.json();
console.log(data.data); // Array d'observations
```

### Python

```python
import requests

# Récupérer tous les territoires
response = requests.get('https://akiprisaye.pages.dev/api/territoires')
data = response.json()
print(data['data'])
```

### cURL

```bash
# Récupérer une observation spécifique
curl https://akiprisaye.pages.dev/api/observations/2025-12-31-120756-uexpress-morne
```

## Support

Pour toute question ou signalement:
- Site web: https://akiprisaye.pages.dev
- Documentation complète: https://akiprisaye.pages.dev/docs

## Licence

Les données sont publiées sous licence ouverte conformément à la politique open-data du projet A KI PRI SA YÉ.

---

**Dernière mise à jour**: 2026-01-07
**Version de l'API**: 1.0.0
