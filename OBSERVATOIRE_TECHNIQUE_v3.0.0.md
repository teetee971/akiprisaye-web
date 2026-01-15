# Observatoire des Prix - Documentation Technique v3.0.0

## 📋 Vue d'Ensemble

L'observatoire des prix est un système complet de collecte, validation, calcul et visualisation des prix dans les territoires ultramarins français et en Hexagone.

## 🏗️ Architecture

### 1. Schéma Canonique

Toutes les données sont normalisées selon un **schéma unique** défini dans :
- `schemas/price-observation-canonical.schema.json` (JSON Schema)
- `src/types/canonicalPriceObservation.ts` (TypeScript types)

**Format canonique :**
```json
{
  "territoire": "Guadeloupe",
  "commune": "Les Abymes",
  "enseigne": "Carrefour",
  "produit": {
    "nom": "Lait demi-écrémé",
    "ean": "3560070123456",
    "categorie": "Produits laitiers",
    "unite": "1L"
  },
  "prix": 1.42,
  "date_releve": "2026-01-03",
  "source": "releve_citoyen",
  "qualite": {
    "niveau": "verifie",
    "preuve": true,
    "score": 0.95
  }
}
```

### 2. Pipeline de Données

```
[Données brutes]
      ↓
[Validation] (dataValidationService)
      ↓
[Normalisation] (format canonique)
      ↓
[Calculs indicateurs] (indicatorCalculationService)
      ↓
[Snapshots publics] (snapshotGenerationService)
      ↓
[Visualisation] (ObservatoryDashboard)
```

## 📊 Indicateurs Prioritaires

### 1. Prix Moyen par Produit/Territoire
- **Service:** `calculateAveragePrices()`
- **Formule:** Moyenne arithmétique simple ou médiane
- **Filtres:** Territoire, catégorie, période, qualité
- **Type:** `AveragePriceIndicator`

### 2. Écart DOM vs Hexagone
- **Service:** `calculateDomHexagoneGaps()`
- **Formule:** `((Prix DOM - Prix Hexagone) / Prix Hexagone) × 100`
- **Seuils:** 
  - `> +5%` : Plus cher
  - `-5% à +5%` : Équivalent
  - `< -5%` : Moins cher
- **Type:** `DomHexagoneGap`

### 3. Indice Vie Chère (IVC)
- **Service:** `calculateIVC()`
- **Base:** 100 = Hexagone
- **Formule:** `(Prix moyen territoire / Prix moyen Hexagone) × 100`
- **Par catégorie:** Pondération égale pour simplifier
- **Type:** `IVCIndicator`

### 4. Évolution Temporelle
- **Service:** `calculateTemporalEvolution()`
- **Périodes:** J-30, J-90, J-365
- **Tendances:**
  - Hausse : variation > +2%
  - Baisse : variation < -2%
  - Stable : entre -2% et +2%
- **Type:** `TemporalEvolution`

### 5. Dispersion par Enseigne
- **Service:** `calculateStoreDispersion()`
- **Statistiques:** Min, Max, Médiane, Moyenne, Écart-type
- **Comparaison factuelle sans classement punitif**
- **Type:** `StoreDispersion`

## 🔧 Services

### dataValidationService.ts
Valide les observations selon le schéma canonique.

**Fonctions principales:**
- `validateObservation()` - Valide une observation
- `validateObservationBatch()` - Valide un lot
- `meetsQualityThreshold()` - Vérifie le seuil de qualité
- `filterByQuality()` - Filtre par qualité

**Tests:** 23 tests passants

### indicatorCalculationService.ts
Calcule les 5 indicateurs prioritaires.

**Fonctions principales:**
- `calculateAveragePrices()` - Prix moyens
- `calculateDomHexagoneGaps()` - Écarts DOM/Hexagone
- `calculateIVC()` - Indice Vie Chère
- `calculateTemporalEvolution()` - Évolutions temporelles
- `calculateStoreDispersion()` - Dispersions par enseigne

**Tests:** 16 tests passants

### snapshotGenerationService.ts
Génère des snapshots publics horodatés et versionnés.

**Fonctions principales:**
- `generateSnapshot()` - Génère snapshot complet
- `generateGlobalStats()` - Statistiques globales
- `exportSnapshotToJSON()` - Export JSON
- `saveSnapshotLocally()` - Sauvegarde locale
- `loadSnapshotLocally()` - Chargement local
- `isSnapshotStale()` - Vérifie fraîcheur

## 🎨 Composants

### ObservatoryDashboard.tsx
Tableau de bord principal de l'observatoire.

**Sections:**
1. Header avec métadonnées
2. Indices Vie Chère (IVC)
3. Prix moyens par produit
4. Écarts DOM vs Hexagone
5. Évolutions temporelles
6. Dispersions par enseigne
7. Footer transparence

**CSS:** `ObservatoryDashboard.css`

### ObservatoryMethodology.tsx
Page de méthodologie et transparence complète.

**Contenu:**
- Sources de données
- Formules de calcul détaillées
- Critères de qualité
- Gouvernance des données
- Limites et avertissements
- Schéma canonique
- Licence ODbL

## 📄 Pages

### Observatory.tsx
Point d'entrée principal (`/observatoire`)
```tsx
import { ObservatoryDashboard } from '../components/observatory/ObservatoryDashboard';
```

### ObservatoryMethodology.tsx
Page méthodologie (`/observatoire/methodologie`)

## 🔐 Gouvernance des Données

### Principes
1. **Données observées, pas déclaratives**
   - Observations réelles uniquement
   - Pas de données auto-déclarées sans preuve

2. **Aucune donnée commerciale interne**
   - Pas d'accès aux systèmes internes
   - Sources publiques et transparentes

3. **Anonymisation stricte**
   - Identifiants hachés uniquement
   - Protection des contributeurs

4. **Pas de classement punitif**
   - Comparaison factuelle
   - Pas de palmarès meilleur/pire

### Sources Acceptées
- `releve_citoyen` - Relevés citoyens
- `ticket_scan` - Scan de tickets
- `donnee_ouverte` - Données ouvertes officielles
- `releve_terrain` - Relevés structurés
- `api_publique` - APIs publiques

### Niveaux de Qualité
- **Vérifié** (score ≥ 0.8) : Avec preuve
- **Probable** (0.5-0.8) : Cohérent
- **À vérifier** (< 0.5) : Non utilisé

## 🧪 Tests

### Tests de Validation
`src/services/__tests__/dataValidationService.test.ts`
- 23 tests couvrant :
  - Validation des champs requis
  - Validation EAN
  - Validation prix et dates
  - Validation qualité
  - Filtrage par qualité

### Tests de Calcul
`src/services/__tests__/indicatorCalculationService.test.ts`
- 16 tests couvrant :
  - Prix moyens
  - Écarts DOM/Hexagone
  - IVC
  - Évolutions temporelles
  - Dispersions enseignes

**Commandes:**
```bash
# Tous les tests
npm test

# Tests validation
npm test -- src/services/__tests__/dataValidationService.test.ts

# Tests indicateurs
npm test -- src/services/__tests__/indicatorCalculationService.test.ts
```

## 📦 Types TypeScript

### canonicalPriceObservation.ts
Types pour le format canonique
- `TerritoireName`
- `ProductCategory`
- `DataSource`
- `QualityLevel`
- `CanonicalPriceObservation`
- `ValidationResult`

### observatoryIndicators.ts
Types pour les indicateurs
- `AveragePriceIndicator`
- `DomHexagoneGap`
- `IVCIndicator`
- `TemporalEvolution`
- `StoreDispersion`
- `IndicatorSnapshot`
- `ObservatoryGlobalStats`

## 🚀 Utilisation

### Générer un Snapshot

```typescript
import { generateSnapshot } from './services/snapshotGenerationService';
import type { CanonicalPriceObservation } from './types/canonicalPriceObservation';

// Préparer les observations
const observations: CanonicalPriceObservation[] = [...];

// Générer snapshot
const snapshot = await generateSnapshot(
  observations,
  'Guadeloupe', // optionnel
  0.5 // seuil qualité minimum
);

// Sauvegarder localement
saveSnapshotLocally(snapshot);
```

### Afficher le Dashboard

```tsx
import { ObservatoryDashboard } from './components/observatory/ObservatoryDashboard';

function App() {
  return <ObservatoryDashboard territoire="Martinique" />;
}
```

### Calculer un Indicateur

```typescript
import { calculateAveragePrices } from './services/indicatorCalculationService';

const result = calculateAveragePrices(observations, {
  territoire: 'Guadeloupe',
  periode_debut: '2026-01-01',
  periode_fin: '2026-01-31',
  agregation: 'moyenne',
  qualite_minimale: 0.5,
});

if (result.success) {
  console.log(result.data);
}
```

## 📝 Licence

- **Code:** Propriétaire
- **Données:** Open Data Commons Open Database License (ODbL) v1.0

## 📞 Contact

- **GitHub:** https://github.com/teetee971/akiprisaye-web
- **Email:** contact@akiprisaye.fr

## 🔄 Versions

- **v3.0.0** - Système complet avec schéma canonique et 5 indicateurs
- **v2.0.0** - Services de calcul basiques
- **v1.0.0** - Prototype initial

---

**Dernière mise à jour:** 2026-01-04
