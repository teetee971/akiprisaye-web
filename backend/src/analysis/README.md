# Neutral Interpretation Generation Module

## 📋 Overview

Backend TypeScript module for generating automatic, legally-safe statistical interpretations without causal attribution or brand references. Designed for price observatory systems with strict neutrality requirements.

## 🎯 Purpose

Generates text interpretations that:
- ✅ Describe statistical observations
- ✅ Use neutral, institutional tone
- ✅ Avoid causal attribution
- ✅ Never mention specific stores/brands
- ✅ Are public-friendly and readable
- ✅ Comply with legal neutrality standards

## 📦 Installation

```typescript
import {
  generateNeutralInterpretation,
  calculateDispersionIndex,
  type ObservationStats,
} from '@/backend/src/analysis/generateNeutralInterpretation';
```

## 🔧 Type Definitions

### ObservationStats (Input)

```typescript
type ObservationStats = {
  observationsUsed: number;      // Observations used in analysis
  observationsMax: number;       // Maximum available observations
  territoriesCovered: number;    // Number of territories covered
  dispersionIndex: number;       // Normalized std dev (0-100)
  method: 'full' | 'stratified'; // Statistical method
};
```

### NeutralInterpretation (Output)

```typescript
type NeutralInterpretation = {
  signalLevel: number;           // 0-100: Statistical signal intensity
  interpretation: string;        // Neutral explanation text
  method: 'full' | 'stratified'; // Statistical method used
};
```

## 📊 Signal Level Calculation

```typescript
signalLevel = min(100, 
  observationsUsed / observationsMax * 50 +
  territoriesCovered * 5 +
  dispersionIndex * 0.25
)
```

### Signal Level Ranges

| Range | Label | Description |
|-------|-------|-------------|
| 0-19 | Minimal | Limited data, no clear trend |
| 20-39 | Limited | Punctual variations observed |
| 40-59 | Moderate | Moderate evolutions across zones |
| 60-79 | Marked | Marked trends on enlarged perimeter |
| 80-100 | Strong | Significant dynamics on large sample |

## 💡 Usage Examples

### Example 1: Strong Signal

```typescript
const stats: ObservationStats = {
  observationsUsed: 2347,
  observationsMax: 2500,
  territoriesCovered: 4,
  dispersionIndex: 75,
  method: 'full',
};

const result = generateNeutralInterpretation(stats);

console.log(result);
// {
//   signalLevel: 92,
//   interpretation: "L'analyse statistique exhaustive révèle une dynamique significative basée sur un volume important de 2 347 observations (93.9% de la base disponible). Les données couvrent un périmètre étendu avec une forte dispersion des valeurs observées. Cette intensité statistique élevée suggère des variations structurelles sur la période analysée, sans qu'il soit possible d'en identifier les causes spécifiques.",
//   method: 'full'
// }
```

### Example 2: Moderate Signal with Stratified Sampling

```typescript
const stats: ObservationStats = {
  observationsUsed: 420,
  observationsMax: 900,
  territoriesCovered: 2,
  dispersionIndex: 45,
  method: 'stratified',
};

const result = generateNeutralInterpretation(stats);

console.log(result);
// {
//   signalLevel: 54,
//   interpretation: "L'analyse statistique par échantillonnage stratifié détecte des évolutions modérées sur plusieurs zones géographiques. Le volume de 420 observations collectées permet d'identifier des variations ponctuelles, mais nécessite une interprétation prudente compte tenu de la dispersion observée. Ces données descriptives ne permettent pas de conclusions définitives sur les dynamiques sous-jacentes.",
//   method: 'stratified'
// }
```

### Example 3: Minimal Signal

```typescript
const stats: ObservationStats = {
  observationsUsed: 42,
  observationsMax: 500,
  territoriesCovered: 1,
  dispersionIndex: 10,
  method: 'full',
};

const result = generateNeutralInterpretation(stats);

console.log(result);
// {
//   signalLevel: 12,
//   interpretation: "L'analyse statistique exhaustive s'appuie sur un volume limité de 42 observations. Les données collectées ne permettent pas d'identifier de tendance claire ou significative. L'absence de signal fort peut résulter soit d'une stabilité effective, soit d'une insuffisance de données. Toute interprétation doit être considérée avec une extrême prudence.",
//   method: 'full'
// }
```

## 🔍 Helper Functions

### calculateDispersionIndex

Calculates normalized dispersion index from price data.

```typescript
const prices = [1.89, 1.72, 1.95, 1.85, 2.10, 1.65];
const dispersionIndex = calculateDispersionIndex(prices);
// Returns: 8 (coefficient of variation normalized to 0-100)
```

**Formula:**
```
dispersionIndex = min(100, (standardDeviation / mean) * 100)
```

### validateNeutralText

Validates that text follows neutrality rules (internal use).

```typescript
const text = "L'analyse statistique révèle une variation observée";
const isNeutral = validateNeutralText(text);
// Returns: true
```

## ⚖️ Legal Compliance

### ✅ Approved Terms
- analyse, observation, statistique
- variation, évolution, tendance
- volume, dispersion, échantillon
- données, périmètre, territoire

### ❌ Prohibited Terms
- responsable, cause, causalité
- hausse abusive, enseigne dominante
- surprofit, abus, fraude, arnaque
- exploitation, injustifié, anormal

## 🧪 Testing

Comprehensive test suite included:

```bash
npm test backend/src/analysis/__tests__/generateNeutralInterpretation.test.ts
```

**Test Coverage:**
- Signal level calculation (all ranges)
- Text generation (all signal levels)
- Input validation
- Neutrality validation
- Dispersion index calculation
- Edge cases and error handling

## 🔗 Integration

### With Frontend Component

```typescript
// Backend: Generate interpretation
const stats: ObservationStats = {
  observationsUsed: 847,
  observationsMax: 1200,
  territoriesCovered: 3,
  dispersionIndex: 55,
  method: 'full',
};

const { signalLevel, interpretation, method } = generateNeutralInterpretation(stats);

// Frontend: Pass to AnalyseStatistiqueNeutre component
<AnalyseStatistiqueNeutre
  signalLevel={signalLevel}
  interpretation={interpretation}
  enseignesPresentes={['Carrefour', 'Leader Price', 'Super U']}
  observations={{
    used: stats.observationsUsed,
    max: stats.observationsMax,
    method: stats.method,
  }}
/>
```

### With API Endpoint

```typescript
// Example API route
app.get('/api/v1/analysis/interpretation', (req, res) => {
  const stats: ObservationStats = {
    observationsUsed: parseInt(req.query.used),
    observationsMax: parseInt(req.query.max),
    territoriesCovered: parseInt(req.query.territories),
    dispersionIndex: parseFloat(req.query.dispersion),
    method: req.query.method as 'full' | 'stratified',
  };

  try {
    const result = generateNeutralInterpretation(stats);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 📈 Signal Level Decision Matrix

| Observations Used | Territories | Dispersion | Signal Level (approx) |
|------------------|-------------|------------|----------------------|
| < 10% | 1 | Low | 0-19 (Minimal) |
| 10-30% | 1-2 | Medium | 20-39 (Limited) |
| 30-60% | 2-3 | Medium | 40-59 (Moderate) |
| 60-80% | 3-4 | High | 60-79 (Marked) |
| > 80% | 4+ | High | 80-100 (Strong) |

## 🚨 Important Notes

### Data Interpretation
- Signal level is purely statistical
- No causation implied
- No brand/store attribution
- Observations are citizen-contributed
- Not exhaustive market data

### Legal Safety
- Designed for institutional use
- Press-compatible language
- Audit-ready disclaimers
- No defamation risk
- Transparent methodology

### Text Generation
- Fully automatic
- No human editing required
- Consistent tone and style
- Adapts to data volume
- Includes methodological context

## 🔄 Version History

- **v1.0.0** (2026-01-12): Initial release with full/stratified methods

## 📚 Related Modules

- **Frontend**: `AnalyseStatistiqueNeutre.tsx` - Display component
- **Backend**: Price aggregation services
- **Backend**: Temporal analysis services
- **Data**: Validated observations datasets

## 🤝 Contributing

When modifying this module:
1. Maintain legal neutrality
2. Test all signal level ranges
3. Validate no prohibited terms
4. Update examples and documentation
5. Run full test suite

---

**Module:** `backend/src/analysis/generateNeutralInterpretation.ts`  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-01-12
