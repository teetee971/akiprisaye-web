# API Documentation - Phase 7 & 8

## Phase 7: Infrastructure APIs

### Geocoding API

#### POST /api/geocoding/geocode
Convert an address to geographic coordinates.

**Request:**
```json
{
  "address": "123 Rue de la République, Pointe-à-Pitre, Guadeloupe"
}
```

**Response:**
```json
{
  "success": true,
  "address": "123 Rue de la République, Pointe-à-Pitre, Guadeloupe",
  "coordinates": {
    "lat": 16.2415,
    "lon": -61.5331
  },
  "displayName": "Pointe-à-Pitre, Guadeloupe"
}
```

**Rate Limit:** 1 request per second per IP

---

#### POST /api/geocoding/reverse
Convert geographic coordinates to an address.

**Request:**
```json
{
  "lat": 16.2415,
  "lon": -61.5331
}
```

**Response:**
```json
{
  "success": true,
  "coordinates": { "lat": 16.2415, "lon": -61.5331 },
  "address": "Pointe-à-Pitre, Guadeloupe",
  "details": {
    "road": "Rue de la République",
    "city": "Pointe-à-Pitre",
    "postcode": "97110",
    "country": "France"
  }
}
```

---

#### POST /api/geocoding/batch
Geocode multiple addresses in one request (max 10).

**Request:**
```json
{
  "addresses": [
    "Zone Industrielle de Jarry, Baie-Mahault, GP",
    "Centre Commercial Destrellan, Baie-Mahault, GP"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "address": "Zone Industrielle de Jarry, Baie-Mahault, GP",
      "coordinates": { "lat": 16.235, "lon": -61.54 }
    },
    {
      "success": true,
      "address": "Centre Commercial Destrellan, Baie-Mahault, GP",
      "coordinates": { "lat": 16.24, "lon": -61.535 }
    }
  ],
  "statistics": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

#### POST /api/geocoding/validate
Validate geographic coordinates.

**Request:**
```json
{
  "lat": 16.2415,
  "lon": -61.5331
}
```

**Response:**
```json
{
  "valid": true,
  "coordinates": { "lat": 16.2415, "lon": -61.5331 },
  "errors": []
}
```

---

### Stores API

#### GET /api/stores
Get all stores with optional filters.

**Query Parameters:**
- `territory`: Filter by territory code (GP, MQ, GF, RE, etc.)
- `chain`: Filter by chain name
- `type`: Filter by store type (hypermarket, supermarket, discount, etc.)
- `lat`, `lon`, `radius`: Filter by distance (radius in km)

**Example:**
```
GET /api/stores?territory=GP&type=supermarket
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "carrefour-jarry-gp",
      "name": "Carrefour Jarry",
      "chain": "Carrefour",
      "address": "Zone Industrielle de Jarry",
      "city": "Baie-Mahault",
      "territory": "GP",
      "coordinates": { "lat": 16.235, "lon": -61.54 },
      "phone": "0590 83 00 00",
      "type": "hypermarket",
      "services": ["parking", "pharmacy", "gas_station"]
    }
  ],
  "meta": {
    "total": 1,
    "filters": { "territory": "GP", "type": "supermarket" }
  }
}
```

---

#### GET /api/stores/:id
Get a specific store by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "carrefour-jarry-gp",
    "name": "Carrefour Jarry",
    "chain": "Carrefour",
    "address": "Zone Industrielle de Jarry",
    "city": "Baie-Mahault",
    "territory": "GP",
    "coordinates": { "lat": 16.235, "lon": -61.54 },
    "phone": "0590 83 00 00",
    "type": "hypermarket",
    "services": ["parking", "pharmacy", "gas_station"],
    "createdAt": "2026-01-13T22:00:00Z",
    "updatedAt": "2026-01-13T22:00:00Z"
  }
}
```

---

#### POST /api/stores
Create a new store.

**Request:**
```json
{
  "name": "Super U Bas-du-Fort",
  "chain": "Super U",
  "address": "Bas-du-Fort, Le Gosier",
  "city": "Le Gosier",
  "territory": "GP",
  "phone": "0590 99 99 99",
  "coordinates": { "lat": 16.228, "lon": -61.508 },
  "type": "supermarket",
  "services": ["parking", "bakery"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "gp-super-u-bas-du-fort",
    "name": "Super U Bas-du-Fort",
    "chain": "Super U",
    "address": "Bas-du-Fort, Le Gosier",
    "city": "Le Gosier",
    "territory": "GP",
    "phone": "0590 99 99 99",
    "coordinates": { "lat": 16.228, "lon": -61.508 },
    "type": "supermarket",
    "services": ["parking", "bakery"],
    "createdAt": "2026-01-13T22:00:00Z",
    "updatedAt": "2026-01-13T22:00:00Z"
  }
}
```

---

#### GET /api/stores/export/csv
Export all stores to CSV format.

**Response:**
CSV file download with headers:
```
name,chain,address,city,territory,phone,lat,lon,type,services
```

---

#### POST /api/stores/import/csv
Import stores from CSV content.

**Request Body:** CSV file content as plain text

**Response:**
```json
{
  "success": true,
  "imported": 5,
  "errors": 0,
  "data": [ /* imported stores */ ],
  "errorDetails": []
}
```

---

### Products API

#### GET /api/products
Get all products with optional filters.

**Query Parameters:**
- `search`: Search by name or brand
- `category`: Filter by category
- `territory`: Filter by territory (products with prices in that territory)
- `ean`: Search by EAN code

**Example:**
```
GET /api/products?search=nutella&territory=GP
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ean": "3017620422003",
      "name": "Nutella 400g",
      "brand": "Ferrero",
      "category": "Épicerie sucrée",
      "unit": "pot",
      "prices": [
        {
          "price": 4.99,
          "store": "carrefour-jarry",
          "territory": "GP",
          "date": "2026-01-13"
        }
      ]
    }
  ],
  "meta": {
    "total": 1,
    "filters": { "search": "nutella", "territory": "GP" }
  }
}
```

---

#### POST /api/products
Create a new product.

**Request:**
```json
{
  "ean": "3017620422003",
  "name": "Nutella 400g",
  "brand": "Ferrero",
  "category": "Épicerie sucrée",
  "unit": "pot",
  "prices": [
    {
      "price": 4.99,
      "store": "carrefour-jarry",
      "territory": "GP",
      "date": "2026-01-13"
    }
  ]
}
```

---

#### POST /api/products/:ean/prices
Add a price observation to a product.

**Request:**
```json
{
  "price": 4.99,
  "store": "carrefour-jarry",
  "territory": "GP",
  "date": "2026-01-13"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "price": 4.99,
    "store": "carrefour-jarry",
    "territory": "GP",
    "date": "2026-01-13",
    "timestamp": "2026-01-13T22:00:00Z"
  }
}
```

---

## Phase 8: Basket Comparison API

### POST /api/basket/analyze
Analyze basket pricing across all stores with comprehensive recommendations.

**Request:**
```json
{
  "items": [
    { "ean": "3017620422003", "quantity": 2 },
    { "ean": "3029330003533", "quantity": 1 }
  ],
  "userPosition": { "lat": 16.2415, "lon": -61.5331 }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "basket": {
      "items": 2,
      "totalQuantity": 3
    },
    "bestOption": {
      "storeId": "carrefour-jarry-gp",
      "storeName": "Carrefour Jarry",
      "totalPrice": 45.99,
      "availableItems": 2,
      "dataFreshness": 95,
      "distance": 2.5
    },
    "comparison": {
      "lowestPrice": 45.99,
      "highestPrice": 52.50,
      "averagePrice": 48.75,
      "priceRange": 6.51,
      "potentialSavings": 6.51
    },
    "recommendations": [
      {
        "type": "price",
        "priority": "high",
        "title": "Économisez en changeant de magasin",
        "description": "Faites vos courses chez Carrefour Jarry au lieu de Super U",
        "savings": 6.51
      }
    ],
    "multiStoreOption": {
      "stores": [
        {
          "storeId": "carrefour-jarry-gp",
          "storeName": "Carrefour Jarry",
          "items": ["3017620422003"],
          "totalPrice": 23.00,
          "distance": 2.5
        },
        {
          "storeId": "leclerc-destrellan-gp",
          "storeName": "E.Leclerc Destrellan",
          "items": ["3029330003533"],
          "totalPrice": 21.50,
          "distance": 3.2
        }
      ],
      "totalPrice": 44.50,
      "savings": 1.49,
      "extraDistance": 0.7,
      "worthwhile": false,
      "reason": "Économies trop faibles pour justifier plusieurs magasins"
    }
  }
}
```

---

### POST /api/basket/compare
Compare basket across stores with custom sorting.

**Request:**
```json
{
  "items": [
    { "ean": "3017620422003", "quantity": 2 }
  ],
  "territory": "GP",
  "userPosition": { "lat": 16.2415, "lon": -61.5331 },
  "sortBy": "price"
}
```

**Sort Options:**
- `price` - Sort by total price (lowest first)
- `distance` - Sort by distance (closest first)
- `freshness` - Sort by data freshness (most recent first)

**Response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "storeId": "carrefour-jarry-gp",
        "storeName": "Carrefour Jarry",
        "chain": "Carrefour",
        "territory": "GP",
        "totalPrice": 45.99,
        "availableItems": 2,
        "totalItems": 2,
        "dataFreshness": 95,
        "distance": 2.5
      }
    ],
    "metadata": {
      "itemCount": 2,
      "storeCount": 1,
      "sortBy": "price",
      "territory": "GP"
    }
  }
}
```

---

### POST /api/basket/optimize
Get optimization recommendations based on preferences.

**Request:**
```json
{
  "items": [
    { "ean": "3017620422003", "quantity": 2 }
  ],
  "preferences": {
    "maxDistance": 10,
    "prioritize": "balanced"
  },
  "userPosition": { "lat": 16.2415, "lon": -61.5331 }
}
```

**Prioritize Options:**
- `savings` - Maximize cost savings
- `convenience` - Minimize distance/time
- `balanced` - Balance between savings and convenience

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "price",
        "priority": "high",
        "title": "Meilleur prix global",
        "description": "Carrefour Jarry offre le meilleur prix total pour votre panier",
        "savings": 6.51,
        "storeId": "carrefour-jarry-gp"
      },
      {
        "type": "distance",
        "priority": "medium",
        "title": "Magasin le plus proche",
        "description": "Super U est à seulement 1.8km avec un prix légèrement plus élevé",
        "extraDistance": -0.7,
        "storeId": "super-u-gp"
      }
    ],
    "preferences": {
      "maxDistance": 10,
      "prioritize": "balanced"
    }
  }
}
```

---

### POST /api/basket/save
Save a basket for later retrieval.

**Request:**
```json
{
  "name": "Mon panier hebdomadaire",
  "items": [
    { "ean": "3017620422003", "quantity": 2 }
  ],
  "territory": "GP"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "basket-1705180800000",
    "name": "Mon panier hebdomadaire",
    "items": [ /* items */ ],
    "territory": "GP",
    "createdAt": "2026-01-13T22:00:00Z",
    "updatedAt": "2026-01-13T22:00:00Z"
  }
}
```

---

### GET /api/basket/saved
Get all saved baskets.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "basket-1705180800000",
      "name": "Mon panier hebdomadaire",
      "items": [ /* items */ ],
      "territory": "GP",
      "createdAt": "2026-01-13T22:00:00Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **Geocoding API**: 1 request per second per IP
- **All other APIs**: Standard rate limiting (configurable)

---

## CSV Format Specifications

### Stores CSV Format
```csv
name,chain,address,city,territory,phone,lat,lon,type,services
Carrefour Jarry,Carrefour,Zone Industrielle de Jarry,Baie-Mahault,GP,0590 83 00 00,16.235,-61.54,hypermarket,parking;bakery
```

### Products CSV Format
```csv
ean,name,brand,category,unit,price,store,territory,date
3017620422003,Nutella 400g,Ferrero,Épicerie sucrée,pot,4.99,carrefour-jarry,GP,2026-01-13
```

---

## Testing

You can test the APIs using curl:

```bash
# Geocode an address
curl -X POST http://localhost:3001/api/geocoding/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "Pointe-à-Pitre, Guadeloupe"}'

# Get stores in Guadeloupe
curl http://localhost:3001/api/stores?territory=GP

# Analyze a basket
curl -X POST http://localhost:3001/api/basket/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"ean": "3017620422003", "quantity": 2}],
    "userPosition": {"lat": 16.2415, "lon": -61.5331}
  }'
```
