# Collector Service Specification

## Vue d'ensemble

Le **Collector Service** est responsable de la collecte automatique et sécurisée d'observations de prix à partir de sources autorisées.

**Principes fondamentaux :**
- ✅ Sources publiques et légales uniquement
- ✅ Respect des robots.txt et termes de service
- ❌ Pas de scraping agressif
- ❌ Pas de données payantes non licenciées
- ❌ Jamais inventer de données

---

## Architecture du Collector Service

```
[Sources Autorisées]
    ↓
[API Connectors]
    ↓
[Rate Limiter]
    ↓
[Data Normalizer]
    ↓
[Validation Engine]
    ↓
[Price Observations Store]
```

---

## 1️⃣ Sources Autorisées

### Types de Sources

#### 1. Partner APIs (Partenariats Officiels)
**Description :** Flux de données officiels d'enseignes partenaires.

**Exemples :**
- Carrefour API (si partenariat établi)
- Leader Price API (si partenariat établi)
- Leclerc Drive API (API publique)

**Caractéristiques :**
- ✅ Fiabilité maximale (reliability_score = 1.00)
- ✅ Données structurées
- ✅ Légal et autorisé
- ⏱️ TTL : 72 heures

**Format de données :**
```json
{
  "ean": "3017620422003",
  "name": "Nutella 750g",
  "price": 4.99,
  "unit_price": 6.65,
  "unit": "kg",
  "store_id": "carrefour_gp_001",
  "timestamp": "2025-12-18T10:00:00Z"
}
```

#### 2. Public APIs (APIs Ouvertes)
**Description :** APIs publiques et gratuites.

**Exemples :**
- Open Food Facts API (informations produits)
- INSEE API (statistiques publiques)
- Data.gouv.fr (open data gouvernemental)

**Caractéristiques :**
- ✅ Légal et gratuit
- ✅ Données vérifiables
- ⚠️ Qualité variable (reliability_score = 0.80-0.90)
- ⏱️ TTL : 7 jours

#### 3. Citizen Reports (Relevés Citoyens)
**Description :** Prix saisis manuellement par les citoyens via l'application.

**Sources :**
- Application mobile
- Interface web
- Extension navigateur

**Caractéristiques :**
- ⚠️ Nécessite validation communautaire
- ⚠️ Fiabilité moyenne (reliability_score = 0.70)
- ⏱️ TTL : 7 jours

**Format de saisie :**
```typescript
interface CitizenReport {
  ean: string;
  price: number;
  store_id: string;
  photo_receipt?: File; // Optionnel mais recommandé
  notes?: string;
  captured_at: Date;
}
```

#### 4. OCR Receipts (Tickets de Caisse)
**Description :** Prix extraits automatiquement des photos de tickets.

**Processus :**
1. Citoyen upload photo de ticket
2. OCR (Tesseract.js) extrait les lignes
3. Parsing des prix et EANs
4. Validation manuelle par modérateur
5. Intégration dans la base

**Caractéristiques :**
- ✅ Traçable (photo conservée)
- ⚠️ Nécessite modération (reliability_score = 0.80 après validation)
- ⏱️ TTL : 14 jours

---

## 2️⃣ API Connectors

### Architecture des Connectors

Chaque connector est une classe qui implémente l'interface `PriceCollector`.

```typescript
interface PriceCollector {
  source_id: string;
  source_type: 'partner' | 'api' | 'citizen' | 'ocr';
  
  // Méthodes obligatoires
  collect(): Promise<RawPriceObservation[]>;
  normalize(raw: any): PriceObservation;
  
  // Configuration
  rateLimit: {
    maxRequests: number;
    perSeconds: number;
  };
}
```

### Exemple : Open Food Facts Connector

```typescript
class OpenFoodFactsConnector implements PriceCollector {
  source_id = 'off_api';
  source_type = 'api' as const;
  
  rateLimit = {
    maxRequests: 100,
    perSeconds: 60
  };
  
  private baseUrl = 'https://world.openfoodfacts.org/api/v2';
  
  async collect(): Promise<RawPriceObservation[]> {
    // OFF ne fournit pas directement des prix, mais des infos produits
    // Utilisé pour enrichir le catalogue products
    throw new Error('OFF is not a price source');
  }
  
  async getProductInfo(ean: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/product/${ean}.json`);
    const data = await response.json();
    
    if (data.status !== 1) {
      throw new Error(`Product ${ean} not found`);
    }
    
    return this.normalize(data.product);
  }
  
  normalize(raw: any): Product {
    return {
      ean: raw.code,
      name: raw.product_name || raw.generic_name,
      brand: raw.brands,
      category: raw.categories_tags?.[0],
      unit: this.extractUnit(raw),
      package_quantity: raw.quantity ? parseFloat(raw.quantity) : null
    };
  }
  
  private extractUnit(product: any): string {
    if (product.quantity?.includes('kg')) return 'kg';
    if (product.quantity?.includes('L')) return 'L';
    if (product.quantity?.includes('g')) return 'g';
    return 'unité';
  }
}
```

### Exemple : Partner API Connector (Template)

```typescript
class PartnerAPIConnector implements PriceCollector {
  source_id: string;
  source_type = 'partner' as const;
  
  rateLimit = {
    maxRequests: 1000,
    perSeconds: 60
  };
  
  constructor(
    private partnerId: string,
    private apiKey: string,
    private apiUrl: string
  ) {
    this.source_id = `partner_${partnerId}`;
  }
  
  async collect(): Promise<RawPriceObservation[]> {
    const response = await fetch(`${this.apiUrl}/prices`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'AKiPriSaYe/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Partner API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.prices.map(p => this.normalize(p));
  }
  
  normalize(raw: any): PriceObservation {
    return {
      ean: raw.ean || raw.barcode,
      store_id: this.mapStoreId(raw.store),
      territory: this.mapTerritory(raw.location),
      price: parseFloat(raw.price),
      unit_price: raw.unit_price ? parseFloat(raw.unit_price) : null,
      unit: raw.unit,
      quantity: raw.quantity ? parseFloat(raw.quantity) : null,
      source: 'partner',
      source_id: this.source_id,
      captured_at: new Date(raw.date || Date.now())
    };
  }
  
  private mapStoreId(storeData: any): string {
    // Mapper l'identifiant du partenaire vers notre store_id
    return `${this.partnerId}_${storeData.id}`;
  }
  
  private mapTerritory(location: any): string {
    // Mapper la localisation vers un code territoire
    const cityToTerritory = {
      'Pointe-à-Pitre': 'GP',
      'Fort-de-France': 'MQ',
      'Saint-Denis': 'RE'
      // ... mapping complet
    };
    
    return cityToTerritory[location.city] || 'GP';
  }
}
```

### Exemple : Citizen Report Connector

```typescript
class CitizenReportConnector implements PriceCollector {
  source_id = 'citizen_app';
  source_type = 'citizen' as const;
  
  rateLimit = {
    maxRequests: 10,
    perSeconds: 1
  };
  
  constructor(private db: Database) {}
  
  // Les citizen reports ne sont pas "collectés" mais soumis via API
  async collect(): Promise<RawPriceObservation[]> {
    throw new Error('Citizen reports are submitted, not collected');
  }
  
  async submitReport(report: CitizenReport, userId: string): Promise<void> {
    // Valider la soumission
    if (!report.ean || !report.price || !report.store_id) {
      throw new Error('Missing required fields');
    }
    
    // Normaliser
    const observation = this.normalize(report);
    
    // Stocker avec métadonnées
    await this.db.price_observations.insert({
      ...observation,
      source_id: userId,
      confidence_level: 'À confirmer' // Nécessite validation
    });
  }
  
  normalize(raw: CitizenReport): PriceObservation {
    return {
      ean: raw.ean,
      store_id: raw.store_id,
      territory: this.getTerritoryFromStore(raw.store_id),
      price: raw.price,
      source: 'citizen',
      captured_at: raw.captured_at || new Date()
    };
  }
  
  private getTerritoryFromStore(storeId: string): string {
    // Extraire le territoire du store_id
    // Format: carrefour_gp_001 → GP
    const parts = storeId.split('_');
    return parts[1]?.toUpperCase() || 'GP';
  }
}
```

---

## 3️⃣ Rate Limiter

### Objectif
Respecter les limites des APIs externes et éviter de surcharger les sources.

### Implementation

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(
    sourceId: string,
    maxRequests: number,
    perSeconds: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - (perSeconds * 1000);
    
    // Récupérer les timestamps des requêtes récentes
    let timestamps = this.requests.get(sourceId) || [];
    
    // Filtrer les requêtes hors fenêtre
    timestamps = timestamps.filter(ts => ts > windowStart);
    
    // Vérifier si limite atteinte
    if (timestamps.length >= maxRequests) {
      const oldestRequest = timestamps[0];
      const waitTime = (oldestRequest + (perSeconds * 1000)) - now;
      
      throw new RateLimitError(
        `Rate limit exceeded for ${sourceId}. Wait ${waitTime}ms`
      );
    }
    
    // Ajouter la nouvelle requête
    timestamps.push(now);
    this.requests.set(sourceId, timestamps);
    
    return true;
  }
  
  async waitForSlot(
    sourceId: string,
    maxRequests: number,
    perSeconds: number
  ): Promise<void> {
    while (true) {
      try {
        await this.checkLimit(sourceId, maxRequests, perSeconds);
        return;
      } catch (error) {
        if (error instanceof RateLimitError) {
          const waitTime = parseInt(error.message.match(/Wait (\d+)ms/)?.[1] || '1000');
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
  }
}
```

---

## 4️⃣ Data Normalizer

### Objectif
Convertir les formats hétérogènes en structure unifiée `PriceObservation`.

### Normalisation Avancée

```typescript
class DataNormalizer {
  normalizePrice(raw: any): number {
    // Gérer différents formats de prix
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string') {
      // "4,99 €" → 4.99
      return parseFloat(raw.replace(',', '.').replace(/[^\d.]/g, ''));
    }
    throw new Error(`Invalid price format: ${raw}`);
  }
  
  normalizeEAN(raw: any): string {
    // Supprimer les espaces et caractères non-numériques
    const cleaned = String(raw).replace(/[^\d]/g, '');
    
    // Valider longueur
    if (cleaned.length < 8 || cleaned.length > 14) {
      throw new Error(`Invalid EAN length: ${cleaned}`);
    }
    
    return cleaned;
  }
  
  normalizeDate(raw: any): Date {
    if (raw instanceof Date) return raw;
    if (typeof raw === 'string') return new Date(raw);
    if (typeof raw === 'number') return new Date(raw);
    throw new Error(`Invalid date format: ${raw}`);
  }
  
  normalizeUnit(raw: any): string | null {
    if (!raw) return null;
    
    const unitMap: Record<string, string> = {
      'kilogramme': 'kg',
      'kilo': 'kg',
      'litre': 'L',
      'gramme': 'g',
      'millilitre': 'ml',
      'centilitre': 'cl',
      'piece': 'unité',
      'unit': 'unité'
    };
    
    const normalized = String(raw).toLowerCase().trim();
    return unitMap[normalized] || normalized;
  }
}
```

---

## 5️⃣ Collection Scheduler

### Planification des Collectes

```typescript
class CollectionScheduler {
  private collectors: PriceCollector[] = [];
  private scheduler: NodeSchedule;
  
  registerCollector(collector: PriceCollector, cronPattern: string) {
    this.collectors.push(collector);
    
    // Planifier la collecte
    this.scheduler.scheduleJob(cronPattern, async () => {
      await this.runCollection(collector);
    });
  }
  
  async runCollection(collector: PriceCollector) {
    console.log(`[${new Date().toISOString()}] Starting collection: ${collector.source_id}`);
    
    try {
      // Collecter les données brutes
      const rawObservations = await collector.collect();
      
      console.log(`Collected ${rawObservations.length} raw observations`);
      
      // Valider et stocker chaque observation
      let validCount = 0;
      let errorCount = 0;
      
      for (const raw of rawObservations) {
        try {
          // Normaliser
          const observation = collector.normalize(raw);
          
          // Valider
          const validationResult = await this.validator.validate(observation);
          
          if (validationResult.valid) {
            // Stocker
            await this.db.price_observations.insert({
              ...observation,
              confidence_level: validationResult.confidence_level
            });
            
            // Créer les flags
            for (const flag of validationResult.flags) {
              await this.db.price_flags.insert({
                observation_id: insertedId,
                ...flag,
                flagged_by: 'system'
              });
            }
            
            validCount++;
          }
        } catch (error) {
          console.error(`Error processing observation:`, error);
          errorCount++;
        }
      }
      
      console.log(`Collection complete: ${validCount} valid, ${errorCount} errors`);
      
      // Métriques
      this.metrics.recordCollection(collector.source_id, validCount, errorCount);
      
    } catch (error) {
      console.error(`Collection failed for ${collector.source_id}:`, error);
      this.metrics.recordCollectionFailure(collector.source_id);
    }
  }
}
```

### Schedules Recommandés

```typescript
// Configuration des collectes
const schedules = [
  {
    connector: new PartnerAPIConnector('carrefour', API_KEY, API_URL),
    cron: '0 */6 * * *' // Toutes les 6 heures
  },
  {
    connector: new PartnerAPIConnector('leaderprice', API_KEY, API_URL),
    cron: '30 */6 * * *' // Toutes les 6 heures (décalé de 30 min)
  },
  {
    connector: new OpenFoodFactsConnector(),
    cron: '0 2 * * *' // Une fois par jour à 2h du matin
  }
];

for (const { connector, cron } of schedules) {
  scheduler.registerCollector(connector, cron);
}
```

---

## 6️⃣ Error Handling & Retry

### Stratégie de Retry

```typescript
class RetryStrategy {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries: number;
      baseDelay: number;
      maxDelay: number;
    } = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000
    }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < options.maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(
            options.baseDelay * Math.pow(2, attempt),
            options.maxDelay
          );
          const jitter = Math.random() * 0.3 * delay;
          
          console.log(`Retry attempt ${attempt + 1}/${options.maxRetries} after ${delay + jitter}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
      }
    }
    
    throw new Error(`Failed after ${options.maxRetries} retries: ${lastError.message}`);
  }
}
```

---

## 7️⃣ Monitoring & Alerting

### Métriques à Tracker

```typescript
interface CollectionMetrics {
  source_id: string;
  timestamp: Date;
  
  // Compteurs
  observations_collected: number;
  observations_valid: number;
  observations_rejected: number;
  observations_flagged: number;
  
  // Performance
  collection_duration_ms: number;
  
  // Erreurs
  errors_count: number;
  errors_types: Record<string, number>;
}
```

### Alertes Prometheus

```promql
# Taux de succès < 90%
(
  rate(price_collection_valid_total[5m])
  /
  rate(price_collection_total[5m])
) < 0.9

# Aucune collecte depuis 12h
time() - price_collection_last_success_timestamp_seconds > 43200

# Taux d'erreurs élevé
rate(price_collection_errors_total[5m]) > 10
```

---

## 8️⃣ Configuration Exemple

### Fichier `.env`

```bash
# Partner APIs
CARREFOUR_API_KEY=xxx
CARREFOUR_API_URL=https://api.carrefour.example/v1
LEADERPRICE_API_KEY=xxx
LEADERPRICE_API_URL=https://api.leaderprice.example/v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/akiprisaye

# Rate Limiting
RATE_LIMIT_PARTNER=1000  # req/min
RATE_LIMIT_PUBLIC_API=100  # req/min

# Collection Schedule
ENABLE_AUTO_COLLECTION=true
COLLECTION_TIMEZONE=America/Guadeloupe

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
PROMETHEUS_ENABLED=true
```

---

**Dernière mise à jour :** Décembre 2025  
**Version :** 1.0.0
