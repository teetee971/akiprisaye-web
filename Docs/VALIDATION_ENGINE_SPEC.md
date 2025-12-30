# Validation Engine Specification

## Vue d'ensemble

Le **Validation Engine** est le composant critique qui garantit la qualité et la cohérence des observations de prix avant leur stockage immutable dans la base de données.

**Principe fondamental :** Valider sans modifier. Annoter sans corriger.

---

## Architecture du Validation Engine

```
[Input: Price Observation]
        ↓
[Format Validation]
        ↓
[Business Rules Validation]
        ↓
[Anomaly Detection]
        ↓
[Confidence Level Assignment]
        ↓
[Output: Validated + Annotated Observation]
```

---

## 1️⃣ Format Validation (Niveau 1)

### Objectif
Vérifier que les données respectent les formats et contraintes de base.

### Règles de Validation

#### Prix
```typescript
interface PriceValidation {
  field: 'price';
  rules: {
    type: 'decimal';
    precision: 2;  // 2 décimales
    min: 0.01;
    max: 10000.00;
    required: true;
  };
  errorMessages: {
    required: 'Le prix est obligatoire';
    min: 'Le prix doit être supérieur à 0€';
    max: 'Le prix semble anormalement élevé (>10000€)';
    precision: 'Le prix doit avoir maximum 2 décimales';
  };
}
```

**Exemples valides :**
- ✅ `3.99`
- ✅ `12.50`
- ✅ `0.99`

**Exemples invalides :**
- ❌ `0` (prix nul)
- ❌ `-2.50` (prix négatif)
- ❌ `3.999` (trop de décimales)
- ❌ `15000` (anormalement élevé)

#### Code EAN
```typescript
interface EANValidation {
  field: 'ean';
  rules: {
    type: 'string';
    pattern: /^[0-9]{8,14}$/;
    required: true;
    checksum: true; // Validation checksum EAN
  };
  errorMessages: {
    required: 'Le code EAN est obligatoire';
    pattern: 'Le code EAN doit contenir 8 à 14 chiffres';
    checksum: 'Le code EAN a une checksum invalide';
  };
}
```

**Fonction de validation checksum :**
```typescript
function validateEANChecksum(ean: string): boolean {
  const digits = ean.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  const sum = digits.reduce((acc, digit, index) => {
    const multiplier = index % 2 === 0 ? 1 : 3;
    return acc + digit * multiplier;
  }, 0);
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}
```

#### Unité de Mesure
```typescript
interface UnitValidation {
  field: 'unit';
  rules: {
    type: 'enum';
    allowedValues: ['kg', 'L', 'unité', 'g', 'ml', 'cl'];
    required: false; // Optionnel mais recommandé
  };
  errorMessages: {
    invalid: 'Unité non reconnue. Valeurs autorisées: kg, L, unité, g, ml, cl';
  };
}
```

#### Quantité
```typescript
interface QuantityValidation {
  field: 'quantity';
  rules: {
    type: 'decimal';
    precision: 3;
    min: 0.001;
    max: 100000;
    required: false;
  };
  errorMessages: {
    min: 'La quantité doit être supérieure à 0';
    max: 'La quantité semble anormalement élevée';
  };
}
```

#### Date de Capture
```typescript
interface CapturedAtValidation {
  field: 'captured_at';
  rules: {
    type: 'timestamp';
    required: true;
    notFuture: true;
    maxAge: '30 days'; // Pas plus de 30 jours dans le passé
  };
  errorMessages: {
    required: 'La date de capture est obligatoire';
    future: 'La date de capture ne peut pas être dans le futur';
    tooOld: 'La date de capture est trop ancienne (>30 jours)';
  };
}
```

#### Store ID
```typescript
interface StoreValidation {
  field: 'store_id';
  rules: {
    type: 'string';
    exists: true; // Doit exister dans la table stores
    active: true; // Le magasin doit être actif
    required: true;
  };
  errorMessages: {
    required: 'L\'identifiant du magasin est obligatoire';
    notFound: 'Magasin non trouvé dans la base de données';
    inactive: 'Ce magasin est marqué comme inactif';
  };
}
```

#### Territoire
```typescript
interface TerritoryValidation {
  field: 'territory';
  rules: {
    type: 'enum';
    allowedValues: ['GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'WF', 'PF', 'NC', 'TF'];
    required: true;
  };
  errorMessages: {
    required: 'Le territoire est obligatoire';
    invalid: 'Code territoire invalide. Doit être un DROM-COM';
  };
}
```

#### Source
```typescript
interface SourceValidation {
  field: 'source';
  rules: {
    type: 'enum';
    allowedValues: ['partner', 'ocr', 'citizen'];
    required: true;
  };
  errorMessages: {
    required: 'La source est obligatoire';
    invalid: 'Type de source invalide';
  };
}
```

---

## 2️⃣ Business Rules Validation (Niveau 2)

### Objectif
Vérifier la cohérence métier des données.

### Règles Métier

#### Cohérence Prix / Prix Unitaire
```typescript
interface PriceUnitConsistency {
  rule: 'price_unit_consistency';
  validation: (obs: PriceObservation) => {
    if (obs.unit_price && obs.quantity && obs.unit) {
      const expectedPrice = obs.unit_price * obs.quantity;
      const deviation = Math.abs(obs.price - expectedPrice) / expectedPrice;
      
      if (deviation > 0.05) { // 5% de tolérance
        return {
          valid: false,
          severity: 'warning',
          message: `Incohérence: Prix ${obs.price}€ ne correspond pas à ${obs.unit_price}€/${obs.unit} × ${obs.quantity}${obs.unit}`
        };
      }
    }
    return { valid: true };
  };
}
```

#### Correspondance Territoire / Magasin
```typescript
interface TerritoryStoreConsistency {
  rule: 'territory_store_match';
  validation: async (obs: PriceObservation, db: Database) => {
    const store = await db.stores.findById(obs.store_id);
    
    if (store.territory !== obs.territory) {
      return {
        valid: false,
        severity: 'critical',
        message: `Le magasin ${obs.store_id} est situé en ${store.territory}, pas en ${obs.territory}`
      };
    }
    
    return { valid: true };
  };
}
```

#### Produit Existe
```typescript
interface ProductExists {
  rule: 'product_exists';
  validation: async (obs: PriceObservation, db: Database) => {
    const product = await db.products.findByEAN(obs.ean);
    
    if (!product) {
      return {
        valid: true, // On accepte quand même
        severity: 'info',
        message: `Produit EAN ${obs.ean} non référencé. À ajouter au catalogue.`,
        action: 'CREATE_PRODUCT_IF_MISSING'
      };
    }
    
    return { valid: true };
  };
}
```

---

## 3️⃣ Anomaly Detection (Niveau 3)

### Objectif
Détecter les valeurs suspectes sans les rejeter.

### Détection d'Anomalies Statistiques

#### Prix Anormalement Élevé
```typescript
interface HighPriceAnomaly {
  rule: 'high_price_anomaly';
  detection: async (obs: PriceObservation, db: Database) => {
    // Récupérer les prix des 30 derniers jours pour ce produit
    const recentPrices = await db.price_observations.find({
      ean: obs.ean,
      captured_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      confidence_level: 'OK'
    });
    
    if (recentPrices.length < 3) {
      return { anomaly: false }; // Pas assez de données
    }
    
    // Calculer la médiane
    const prices = recentPrices.map(p => p.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    
    // Vérifier si le nouveau prix dévie de >50%
    const deviation = ((obs.price - median) / median) * 100;
    
    if (deviation > 50) {
      return {
        anomaly: true,
        type: 'high_price',
        severity: 'warning',
        message: `Prix ${obs.price}€ est ${deviation.toFixed(1)}% supérieur à la médiane (${median.toFixed(2)}€)`,
        data: { median, deviation, sampleSize: recentPrices.length }
      };
    }
    
    return { anomaly: false };
  };
}
```

#### Prix Anormalement Bas
```typescript
interface LowPriceAnomaly {
  rule: 'low_price_anomaly';
  detection: async (obs: PriceObservation, db: Database) => {
    const recentPrices = await db.price_observations.find({
      ean: obs.ean,
      captured_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      confidence_level: 'OK'
    });
    
    if (recentPrices.length < 3) {
      return { anomaly: false };
    }
    
    const prices = recentPrices.map(p => p.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    
    const deviation = ((median - obs.price) / median) * 100;
    
    if (deviation > 50) {
      return {
        anomaly: true,
        type: 'low_price',
        severity: 'warning',
        message: `Prix ${obs.price}€ est ${deviation.toFixed(1)}% inférieur à la médiane (${median.toFixed(2)}€)`,
        data: { median, deviation, sampleSize: recentPrices.length }
      };
    }
    
    return { anomaly: false };
  };
}
```

#### Variation Brutale
```typescript
interface BrutalVariation {
  rule: 'brutal_price_change';
  detection: async (obs: PriceObservation, db: Database) => {
    // Récupérer le dernier prix connu pour ce produit/magasin
    const lastPrice = await db.price_observations.findOne({
      ean: obs.ean,
      store_id: obs.store_id,
      confidence_level: 'OK'
    }, { sort: { captured_at: -1 } });
    
    if (!lastPrice) {
      return { anomaly: false }; // Premier prix pour ce couple produit/magasin
    }
    
    const variation = ((obs.price - lastPrice.price) / lastPrice.price) * 100;
    const timeDiff = (obs.captured_at.getTime() - lastPrice.captured_at.getTime()) / (1000 * 60 * 60); // heures
    
    // Si variation >30% en moins de 24h
    if (Math.abs(variation) > 30 && timeDiff < 24) {
      return {
        anomaly: true,
        type: 'brutal_change',
        severity: 'warning',
        message: `Variation de ${variation.toFixed(1)}% en ${timeDiff.toFixed(1)}h (${lastPrice.price}€ → ${obs.price}€)`,
        data: { previousPrice: lastPrice.price, variation, timeDiff }
      };
    }
    
    return { anomaly: false };
  };
}
```

#### Duplication Suspecte
```typescript
interface DuplicateDetection {
  rule: 'duplicate_observation';
  detection: async (obs: PriceObservation, db: Database) => {
    // Vérifier si observation identique existe déjà
    const duplicate = await db.price_observations.findOne({
      ean: obs.ean,
      store_id: obs.store_id,
      price: obs.price,
      captured_at: {
        $gte: new Date(obs.captured_at.getTime() - 5 * 60 * 1000), // ±5 min
        $lte: new Date(obs.captured_at.getTime() + 5 * 60 * 1000)
      }
    });
    
    if (duplicate) {
      return {
        anomaly: true,
        type: 'duplicate',
        severity: 'info',
        message: `Observation identique déjà présente (ID: ${duplicate.id})`,
        data: { duplicateId: duplicate.id }
      };
    }
    
    return { anomaly: false };
  };
}
```

---

## 4️⃣ Confidence Level Assignment

### Règles d'Attribution du Niveau de Confiance

```typescript
function assignConfidenceLevel(
  formatValidation: ValidationResult,
  businessValidation: ValidationResult,
  anomalies: AnomalyResult[]
): ConfidenceLevel {
  
  // Si erreur de format critique → Rejet (ne sera pas stocké)
  if (formatValidation.errors.some(e => e.severity === 'critical')) {
    throw new ValidationError('Format invalide', formatValidation.errors);
  }
  
  // Si erreur métier critique → À confirmer
  if (businessValidation.errors.some(e => e.severity === 'critical')) {
    return 'À confirmer';
  }
  
  // Si anomalie détectée → Suspect
  if (anomalies.some(a => a.anomaly === true)) {
    return 'Suspect';
  }
  
  // Si warnings (non-critique) → À confirmer
  if (formatValidation.warnings.length > 0 || businessValidation.warnings.length > 0) {
    return 'À confirmer';
  }
  
  // Sinon → OK
  return 'OK';
}
```

### Matrice de Décision

| Format | Business | Anomalies | Résultat |
|--------|----------|-----------|----------|
| ✅ OK | ✅ OK | ✅ Aucune | **OK** |
| ✅ OK | ✅ OK | ⚠️ Détectée | **Suspect** |
| ✅ OK | ⚠️ Warning | ✅ Aucune | **À confirmer** |
| ✅ OK | ⚠️ Warning | ⚠️ Détectée | **Suspect** |
| ⚠️ Warning | ✅ OK | ✅ Aucune | **À confirmer** |
| ❌ Error | — | — | **REJET** |
| — | ❌ Critical | — | **À confirmer** |

---

## 5️⃣ Implémentation TypeScript

### Interface principale

```typescript
interface PriceObservation {
  ean: string;
  store_id: string;
  territory: string;
  price: number;
  unit_price?: number;
  unit?: string;
  quantity?: number;
  source: 'partner' | 'ocr' | 'citizen';
  captured_at: Date;
  source_id?: string;
  source_url?: string;
  receipt_id?: string;
  raw_data?: any;
}

interface ValidationResult {
  valid: boolean;
  confidence_level: 'OK' | 'Suspect' | 'À confirmer';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  anomalies: Anomaly[];
  flags: Flag[];
}

interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'critical' | 'error';
}

interface ValidationWarning {
  field: string;
  rule: string;
  message: string;
  severity: 'warning' | 'info';
}

interface Anomaly {
  type: 'high_price' | 'low_price' | 'brutal_change' | 'duplicate';
  severity: 'warning' | 'info';
  message: string;
  data?: any;
}

interface Flag {
  flag_type: string;
  flag_reason: string;
  severity: 'info' | 'warning' | 'critical';
}
```

### Validation Engine Service

```typescript
class ValidationEngine {
  constructor(private db: Database) {}
  
  async validate(observation: PriceObservation): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      confidence_level: 'OK',
      errors: [],
      warnings: [],
      anomalies: [],
      flags: []
    };
    
    // 1. Format Validation
    const formatResult = this.validateFormat(observation);
    result.errors.push(...formatResult.errors);
    result.warnings.push(...formatResult.warnings);
    
    // Si erreurs critiques de format, arrêter
    if (result.errors.some(e => e.severity === 'critical')) {
      result.valid = false;
      throw new ValidationError('Format validation failed', result.errors);
    }
    
    // 2. Business Rules Validation
    const businessResult = await this.validateBusinessRules(observation);
    result.errors.push(...businessResult.errors);
    result.warnings.push(...businessResult.warnings);
    
    // 3. Anomaly Detection
    const anomalies = await this.detectAnomalies(observation);
    result.anomalies = anomalies;
    
    // 4. Assign Confidence Level
    result.confidence_level = this.assignConfidenceLevel(result);
    
    // 5. Generate Flags
    result.flags = this.generateFlags(result);
    
    return result;
  }
  
  private validateFormat(obs: PriceObservation): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Prix
    if (!obs.price || obs.price <= 0) {
      errors.push({
        field: 'price',
        rule: 'required_positive',
        message: 'Le prix doit être supérieur à 0',
        severity: 'critical'
      });
    }
    
    if (obs.price > 10000) {
      warnings.push({
        field: 'price',
        rule: 'max_value',
        message: 'Prix anormalement élevé (>10000€)',
        severity: 'warning'
      });
    }
    
    // EAN
    if (!obs.ean || !validateEANChecksum(obs.ean)) {
      errors.push({
        field: 'ean',
        rule: 'valid_ean',
        message: 'Code EAN invalide',
        severity: 'critical'
      });
    }
    
    // Date
    if (obs.captured_at > new Date()) {
      errors.push({
        field: 'captured_at',
        rule: 'not_future',
        message: 'La date de capture ne peut pas être dans le futur',
        severity: 'critical'
      });
    }
    
    // ... autres validations
    
    return { errors, warnings };
  }
  
  private async validateBusinessRules(obs: PriceObservation): Promise<{ errors: ValidationError[], warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Vérifier que le magasin existe
    const store = await this.db.stores.findById(obs.store_id);
    if (!store) {
      errors.push({
        field: 'store_id',
        rule: 'store_exists',
        message: `Magasin ${obs.store_id} non trouvé`,
        severity: 'critical'
      });
    } else if (store.territory !== obs.territory) {
      errors.push({
        field: 'territory',
        rule: 'territory_match',
        message: `Incohérence: magasin en ${store.territory}, observation en ${obs.territory}`,
        severity: 'critical'
      });
    }
    
    return { errors, warnings };
  }
  
  private async detectAnomalies(obs: PriceObservation): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Détection prix anormalement élevé
    const highPrice = await this.detectHighPrice(obs);
    if (highPrice) anomalies.push(highPrice);
    
    // Détection prix anormalement bas
    const lowPrice = await this.detectLowPrice(obs);
    if (lowPrice) anomalies.push(lowPrice);
    
    // Détection variation brutale
    const brutalChange = await this.detectBrutalChange(obs);
    if (brutalChange) anomalies.push(brutalChange);
    
    return anomalies;
  }
  
  private assignConfidenceLevel(result: ValidationResult): ConfidenceLevel {
    if (result.errors.length > 0) {
      return 'À confirmer';
    }
    
    if (result.anomalies.length > 0) {
      return 'Suspect';
    }
    
    if (result.warnings.length > 0) {
      return 'À confirmer';
    }
    
    return 'OK';
  }
  
  private generateFlags(result: ValidationResult): Flag[] {
    const flags: Flag[] = [];
    
    for (const anomaly of result.anomalies) {
      flags.push({
        flag_type: anomaly.type,
        flag_reason: anomaly.message,
        severity: anomaly.severity
      });
    }
    
    return flags;
  }
}
```

---

## 6️⃣ API d'Utilisation

### Exemple d'utilisation

```typescript
import { ValidationEngine } from './validation-engine';
import { Database } from './database';

const db = new Database();
const validator = new ValidationEngine(db);

// Observer un nouveau prix
const observation: PriceObservation = {
  ean: '3017620422003',
  store_id: 'carrefour_gp_001',
  territory: 'GP',
  price: 4.99,
  unit_price: 6.65,
  unit: 'kg',
  quantity: 0.75,
  source: 'citizen',
  captured_at: new Date()
};

try {
  const result = await validator.validate(observation);
  
  if (result.valid) {
    // Stocker avec le niveau de confiance et les flags
    await db.price_observations.insert({
      ...observation,
      confidence_level: result.confidence_level
    });
    
    // Créer les flags si nécessaire
    for (const flag of result.flags) {
      await db.price_flags.insert({
        observation_id: insertedId,
        ...flag,
        flagged_by: 'system'
      });
    }
    
    console.log(`✅ Observation stockée avec confiance: ${result.confidence_level}`);
    if (result.anomalies.length > 0) {
      console.log(`⚠️ ${result.anomalies.length} anomalies détectées`);
    }
  }
} catch (error) {
  console.error('❌ Validation échouée:', error.message);
}
```

---

## 7️⃣ Monitoring & Métriques

### Métriques à Suivre

- **Taux de validation** : `observations_validated / observations_submitted`
- **Taux de rejet** : `observations_rejected / observations_submitted`
- **Distribution des niveaux de confiance** : OK / Suspect / À confirmer
- **Types d'anomalies** : high_price, low_price, brutal_change, duplicate
- **Performance** : temps de validation par observation

### Dashboard Grafana

```promql
# Taux de validation
rate(price_observations_validated_total[5m])

# Distribution confidence levels
sum by (confidence_level) (price_observations_total)

# Anomalies détectées
rate(price_anomalies_detected_total{type="high_price"}[5m])
```

---

**Dernière mise à jour :** Décembre 2025  
**Version :** 1.0.0
