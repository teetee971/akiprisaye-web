# Modules Métier — Engines Read-Only

## Architecture Modulaire

Les 5 modules métier de **A KI PRI SA YÉ** sont **indépendants** et opèrent en **lecture seule** sur la base de données immutable.

```
[Price Observations DB - Read Only]
         ↓
    ┌────┴────┬────────┬──────────┬────────────┐
    ↓         ↓        ↓          ↓            ↓
[Module 1] [Module 2] [Module 3] [Module 4] [Module 5]
Comparison   Alert    History   Optimization  Trend
```

**Avantages :**
- ✅ **Isolation** - Un module ne peut pas corrompre les autres
- ✅ **Évolutivité** - Nouveaux modules sans impact sur l'existant
- ✅ **Testabilité** - Tests unitaires simplifiés
- ✅ **Audit** - Traçabilité complète (lecture seule)

---

## Module 1 : Comparison Engine

### Objectif
Comparer les prix d'un même produit entre différents magasins d'un territoire.

### Fonctionnalités

#### 1. Comparaison Simple
Comparer les prix actuels d'un produit dans tous les magasins.

**Endpoint :** `GET /api/comparison?ean=XXX&territory=GP`

**Response :**
```json
{
  "ean": "3017620422003",
  "product": {
    "name": "Nutella 750g",
    "brand": "Ferrero",
    "category": "Pâte à tartiner"
  },
  "territory": "GP",
  "prices": [
    {
      "store_id": "leaderprice_gp_002",
      "store_name": "Leader Price Pointe-à-Pitre",
      "chain": "Leader Price",
      "price": 4.49,
      "unit_price": 5.99,
      "unit": "kg",
      "captured_at": "2025-12-18T08:00:00Z",
      "age_hours": 4,
      "is_best": true,
      "savings_vs_worst": 0.50
    },
    {
      "store_id": "carrefour_gp_001",
      "store_name": "Carrefour Market",
      "chain": "Carrefour",
      "price": 4.99,
      "unit_price": 6.65,
      "unit": "kg",
      "captured_at": "2025-12-18T06:30:00Z",
      "age_hours": 5.5,
      "is_best": false,
      "savings_vs_worst": 0.00
    }
  ],
  "statistics": {
    "min_price": 4.49,
    "max_price": 4.99,
    "median_price": 4.74,
    "avg_price": 4.74,
    "spread": 0.50,
    "spread_percent": 11.1,
    "store_count": 2
  },
  "best_deal": {
    "store_id": "leaderprice_gp_002",
    "store_name": "Leader Price Pointe-à-Pitre",
    "price": 4.49,
    "savings": 0.50,
    "savings_percent": 10.0
  }
}
```

#### 2. Comparaison Multi-Produits
Comparer plusieurs produits simultanément.

**Endpoint :** `POST /api/comparison/multi`

**Request Body :**
```json
{
  "eans": ["3017620422003", "8000500310427", "3033710074587"],
  "territory": "GP"
}
```

**Response :**
```json
{
  "products": [
    {
      "ean": "3017620422003",
      "name": "Nutella 750g",
      "best_price": 4.49,
      "best_store": "leaderprice_gp_002",
      "price_range": "4.49€ - 4.99€"
    },
    {
      "ean": "8000500310427",
      "name": "Barilla Penne 500g",
      "best_price": 1.29,
      "best_store": "carrefour_gp_001",
      "price_range": "1.29€ - 1.49€"
    }
  ],
  "total_savings_potential": 1.20,
  "best_overall_store": "leaderprice_gp_002"
}
```

#### 3. Comparaison Inter-Territoires
Comparer les prix d'un produit entre plusieurs territoires.

**Endpoint :** `GET /api/comparison/territories?ean=XXX&territories=GP,MQ,RE`

**Response :**
```json
{
  "ean": "3017620422003",
  "product": {
    "name": "Nutella 750g",
    "brand": "Ferrero"
  },
  "territories": [
    {
      "code": "GP",
      "name": "Guadeloupe",
      "avg_price": 4.74,
      "min_price": 4.49,
      "max_price": 4.99,
      "store_count": 2
    },
    {
      "code": "MQ",
      "name": "Martinique",
      "avg_price": 4.89,
      "min_price": 4.69,
      "max_price": 5.09,
      "store_count": 3
    },
    {
      "code": "RE",
      "name": "La Réunion",
      "avg_price": 5.20,
      "min_price": 4.99,
      "max_price": 5.49,
      "store_count": 4
    }
  ],
  "cheapest_territory": {
    "code": "GP",
    "name": "Guadeloupe",
    "min_price": 4.49
  },
  "price_spread": {
    "min": 4.49,
    "max": 5.49,
    "difference": 1.00,
    "difference_percent": 22.3
  }
}
```

### Implementation

```typescript
class ComparisonEngine {
  constructor(private db: Database) {}
  
  async compare(ean: string, territory: string): Promise<ComparisonResult> {
    // Récupérer les prix les plus récents pour ce produit
    const prices = await this.db.query(`
      SELECT DISTINCT ON (po.store_id)
        po.*,
        p.name AS product_name,
        p.brand AS product_brand,
        p.category AS product_category,
        s.name AS store_name,
        s.chain AS store_chain,
        EXTRACT(EPOCH FROM (NOW() - po.captured_at))/3600 AS age_hours
      FROM price_observations po
      JOIN products p ON po.ean = p.ean
      JOIN stores s ON po.store_id = s.store_id
      WHERE po.ean = $1
        AND po.territory = $2
        AND po.confidence_level = 'OK'
      ORDER BY po.store_id, po.captured_at DESC
    `, [ean, territory]);
    
    if (prices.length === 0) {
      throw new Error(`No prices found for EAN ${ean} in ${territory}`);
    }
    
    // Calculer les statistiques
    const priceValues = prices.map(p => p.price);
    const statistics = this.calculateStatistics(priceValues);
    
    // Identifier le meilleur prix
    const bestPrice = Math.min(...priceValues);
    const worstPrice = Math.max(...priceValues);
    
    // Enrichir chaque prix avec des infos
    const enrichedPrices = prices.map(p => ({
      ...p,
      is_best: p.price === bestPrice,
      savings_vs_worst: worstPrice - p.price
    }));
    
    // Construire le résultat
    return {
      ean,
      product: {
        name: prices[0].product_name,
        brand: prices[0].product_brand,
        category: prices[0].product_category
      },
      territory,
      prices: enrichedPrices,
      statistics,
      best_deal: {
        store_id: enrichedPrices.find(p => p.is_best).store_id,
        store_name: enrichedPrices.find(p => p.is_best).store_name,
        price: bestPrice,
        savings: worstPrice - bestPrice,
        savings_percent: ((worstPrice - bestPrice) / worstPrice) * 100
      }
    };
  }
  
  private calculateStatistics(prices: number[]): PriceStatistics {
    const sorted = [...prices].sort((a, b) => a - b);
    
    return {
      min_price: sorted[0],
      max_price: sorted[sorted.length - 1],
      median_price: sorted[Math.floor(sorted.length / 2)],
      avg_price: prices.reduce((a, b) => a + b, 0) / prices.length,
      spread: sorted[sorted.length - 1] - sorted[0],
      spread_percent: ((sorted[sorted.length - 1] - sorted[0]) / sorted[0]) * 100,
      store_count: prices.length
    };
  }
}
```

---

## Module 2 : Alert Engine

### Objectif
Détecter et signaler automatiquement les anomalies et événements importants.

### Types d'Alertes

#### 1. Prix Anormalement Élevé
Produit dont le prix dépasse la médiane de +50%.

#### 2. Prix Anormalement Bas
Produit dont le prix est inférieur à la médiane de -50%.

#### 3. Variation Brutale
Prix qui varie de >30% en moins de 24 heures.

#### 4. Pénurie
Aucun prix enregistré depuis 7 jours.

#### 5. Inflation Sectorielle
Catégorie de produits avec hausse >10% sur 30 jours.

### Endpoints

**Liste des alertes actives :**
`GET /api/alerts?territory=GP&severity=critical`

**Alertes pour un produit :**
`GET /api/alerts/product/:ean`

**Alertes pour une catégorie :**
`GET /api/alerts/category/:category`

### Response Format

```json
{
  "alerts": [
    {
      "alert_id": "alert_001",
      "type": "high_price",
      "severity": "warning",
      "product": {
        "ean": "3017620422003",
        "name": "Nutella 750g"
      },
      "store": {
        "store_id": "carrefour_gp_001",
        "name": "Carrefour Market"
      },
      "territory": "GP",
      "current_price": 6.99,
      "median_price": 4.49,
      "deviation_percent": 55.7,
      "message": "Prix anormalement élevé: +55.7% par rapport à la médiane",
      "detected_at": "2025-12-18T10:30:00Z",
      "status": "active"
    }
  ],
  "total": 1,
  "active_count": 1
}
```

### Implementation

```typescript
class AlertEngine {
  constructor(private db: Database) {}
  
  async detectAlerts(territory?: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    // 1. Détecter prix anormalement élevés
    const highPriceAlerts = await this.detectHighPrices(territory);
    alerts.push(...highPriceAlerts);
    
    // 2. Détecter prix anormalement bas
    const lowPriceAlerts = await this.detectLowPrices(territory);
    alerts.push(...lowPriceAlerts);
    
    // 3. Détecter variations brutales
    const brutalAlerts = await this.detectBrutalChanges(territory);
    alerts.push(...brutalAlerts);
    
    // 4. Détecter pénuries
    const shortageAlerts = await this.detectShortages(territory);
    alerts.push(...shortageAlerts);
    
    return alerts;
  }
  
  private async detectHighPrices(territory?: string): Promise<Alert[]> {
    const query = `
      WITH recent_prices AS (
        SELECT 
          ean,
          store_id,
          price,
          captured_at,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) OVER (PARTITION BY ean) AS median_price
        FROM price_observations
        WHERE confidence_level = 'OK'
          AND captured_at >= NOW() - INTERVAL '30 days'
          ${territory ? 'AND territory = $1' : ''}
      )
      SELECT *
      FROM recent_prices
      WHERE price > median_price * 1.5
      ORDER BY captured_at DESC
    `;
    
    const results = territory 
      ? await this.db.query(query, [territory])
      : await this.db.query(query);
    
    return results.map(r => ({
      alert_id: `high_${r.ean}_${r.store_id}`,
      type: 'high_price',
      severity: 'warning',
      ean: r.ean,
      store_id: r.store_id,
      current_price: r.price,
      median_price: r.median_price,
      deviation_percent: ((r.price - r.median_price) / r.median_price) * 100,
      detected_at: new Date()
    }));
  }
}
```

---

## Module 3 : History Engine

### Objectif
Fournir l'historique complet des prix sur des périodes données.

### Fonctionnalités

#### 1. Historique d'un Produit
`GET /api/history/:ean?from=2025-01-01&to=2025-12-31&territory=GP`

**Response :**
```json
{
  "ean": "3017620422003",
  "product": {
    "name": "Nutella 750g",
    "brand": "Ferrero"
  },
  "territory": "GP",
  "period": {
    "from": "2025-01-01",
    "to": "2025-12-31"
  },
  "history": [
    {
      "date": "2025-12-18",
      "min_price": 4.49,
      "max_price": 4.99,
      "avg_price": 4.74,
      "median_price": 4.74,
      "store_count": 2
    },
    {
      "date": "2025-12-17",
      "min_price": 4.39,
      "max_price": 4.89,
      "avg_price": 4.64,
      "median_price": 4.64,
      "store_count": 2
    }
  ],
  "trend": {
    "direction": "increasing",
    "percent_change": 2.3,
    "avg_change_per_day": 0.01
  }
}
```

#### 2. Évolution Graphique
`GET /api/history/:ean/chart?period=30d`

Retourne données optimisées pour graphiques (Chart.js, Recharts).

---

## Module 4 : Optimization Engine

### Objectif
Optimiser le panier d'achat pour minimiser les coûts.

### Fonctionnalités

#### 1. Optimisation Panier Simple
Trouver le meilleur magasin pour acheter un panier de produits.

**Endpoint :** `POST /api/optimize/basket`

**Request :**
```json
{
  "items": [
    { "ean": "3017620422003", "quantity": 1 },
    { "ean": "8000500310427", "quantity": 2 }
  ],
  "territory": "GP"
}
```

**Response :**
```json
{
  "best_store": {
    "store_id": "leaderprice_gp_002",
    "store_name": "Leader Price",
    "total_cost": 7.07,
    "items": [
      { "ean": "3017620422003", "price": 4.49, "quantity": 1, "subtotal": 4.49 },
      { "ean": "8000500310427", "price": 1.29, "quantity": 2, "subtotal": 2.58 }
    ]
  },
  "alternatives": [
    {
      "store_id": "carrefour_gp_001",
      "total_cost": 7.57,
      "savings_vs_best": -0.50
    }
  ]
}
```

#### 2. Optimisation Multi-Magasins
Répartir les achats entre plusieurs magasins pour économiser davantage.

---

## Module 5 : Trend Engine

### Objectif
Analyser les tendances à long terme (inflation, saisonnalité).

### Fonctionnalités

#### 1. Tendances Territoire
`GET /api/trends/territory/:territory?period=12m`

**Response :**
```json
{
  "territory": "GP",
  "period": "12m",
  "inflation": {
    "overall": 3.2,
    "food": 4.1,
    "beverages": 2.8
  },
  "top_increasing": [
    { "category": "Pâte à tartiner", "percent": 12.5 },
    { "category": "Pâtes", "percent": 8.3 }
  ],
  "top_decreasing": [
    { "category": "Fruits", "percent": -2.1 }
  ]
}
```

#### 2. Comparaison Inter-Territoires
`GET /api/trends/compare?territories=GP,MQ,RE`

---

**Dernière mise à jour :** Décembre 2025  
**Version :** 1.0.0
