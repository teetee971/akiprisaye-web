# MODULE F - ÉTAPE 1 : Schéma de données + règles de calcul

## ✅ IMPLÉMENTATION COMPLÈTE

Cette étape pose la base factuelle, auditable et verrouillée du Module F sans toucher à l'UI.

---

## 📦 Fichiers créés

### 1. Types TypeScript
**Fichier**: `frontend/src/utils/territoryRanking.types.ts`

**Interfaces définies**:
```typescript
interface TerritoryStatsInput {
  territoryCode: string;
  territoryLabel: string;
  medianPrice: number;
  observationCount: number;
  storeCount: number;
  productCount: number;
  periodStart: string;
  periodEnd: string;
}

interface TerritoryRankingResult {
  territoryCode: string;
  territoryLabel: string;
  ordinalRank: number;
  medianPrice: number;
  observationCount: number;
  storeCount: number;
  productCount: number;
}

interface ExcludedTerritoryInfo {
  territoryCode: string;
  territoryLabel: string;
  reason: string;
  currentValues: {
    observationCount: number;
    storeCount: number;
    productCount: number;
  };
}
```

**Constantes**:
```typescript
TERRITORY_RANKING_ELIGIBILITY_THRESHOLDS = {
  MIN_OBSERVATIONS: 30,
  MIN_STORES: 10,
  MIN_PRODUCTS: 5,
}
```

✅ **Aucun score, aucune note, aucun label marketing**

---

### 2. Règles de filtrage (BLOQUANTES)
**Fichier**: `frontend/src/utils/computeTerritoryRanking.ts`

Un territoire est **EXCLU** du classement si :
- ❌ `observationCount < 30`
- ❌ `storeCount < 10`
- ❌ `productCount < 5`

**Fonction d'éligibilité**:
```typescript
function isEligibleForRanking(territory: TerritoryStatsInput): boolean
```

**Fonction de raison d'exclusion**:
```typescript
function getExclusionReason(territory: TerritoryStatsInput): string | null
```

**Fonction de liste des exclus**:
```typescript
function getExcludedTerritories(input: TerritoryStatsInput[]): ExcludedTerritoryInfo[]
```

---

### 3. Formule de classement (UNIQUE ET TRANSPARENTE)

**Fonction pure**:
```typescript
function computeTerritoryRanking(input: TerritoryStatsInput[]): TerritoryRankingResult[]
```

**Algorithme**:
1. Filtrer les territoires éligibles (seuils respectés)
2. Trier par `medianPrice` croissant
3. En cas d'égalité de prix → ordre alphabétique du `territoryLabel`
4. Assigner le rang ordinal (`index + 1`)

**Garanties**:
- ✅ Déterministe
- ✅ Testable
- ✅ Juridiquement défendable
- ❌ Pas de pondération
- ❌ Pas de normalisation
- ❌ Pas d'arrondi masqué
- ❌ Pas de transformation logarithmique

---

### 4. Texte méthodologique

**Fonction**:
```typescript
function getMethodologyText(): string
```

**Contenu** (à afficher AVANT les résultats):
```
Classement ordinal des territoires basé exclusivement sur le prix médian observé.

Aucune recommandation, notation ou interprétation commerciale n'est produite.

Les territoires ne disposant pas d'un volume suffisant d'observations sont exclus du classement.
```

**Fonction supplémentaire**:
```typescript
function getEligibilityCriteriaText(): string
```

---

### 5. Validation des données

**Fonctions de validation**:
```typescript
function validateTerritoryStatsInput(territory: TerritoryStatsInput): string[]
function validateAllInputs(input: TerritoryStatsInput[]): ValidationResult
```

**Validations effectuées**:
- ✅ Code territoire non vide
- ✅ Libellé territoire non vide
- ✅ Prix médian ≥ 0
- ✅ Compteurs ≥ 0 (observations, magasins, produits)
- ✅ Dates valides au format ISO
- ✅ Date de début ≤ date de fin

---

## 🧪 Tests unitaires

**Fichier**: `frontend/src/utils/computeTerritoryRanking.test.ts`

### Couverture complète (31 tests, tous ✅ PASS)

#### Tests des seuils d'éligibilité (7 tests)
- ✅ Seuils corrects (30, 10, 5)
- ✅ Territoire éligible si tous les seuils respectés
- ✅ Territoire exclu si observations < 30
- ✅ Territoire exclu si magasins < 10
- ✅ Territoire exclu si produits < 5
- ✅ Territoire exclu si plusieurs seuils non respectés
- ✅ Territoire éligible aux valeurs exactes des seuils

#### Tests des raisons d'exclusion (5 tests)
- ✅ Null pour territoire éligible
- ✅ Raison pour observations insuffisantes
- ✅ Raison pour magasins insuffisants
- ✅ Raison pour produits insuffisants
- ✅ Raisons combinées pour violations multiples

#### Tests de la liste des exclus (2 tests)
- ✅ Tableau vide si tous éligibles
- ✅ Liste des exclus avec raisons détaillées

#### Tests du classement (7 tests)
- ✅ Classement correct par prix médian croissant
- ✅ Exclusion des territoires sous seuils
- ✅ Ordre alphabétique pour prix égaux (règle neutre)
- ✅ Pas de mutation du tableau d'entrée
- ✅ Tableau vide si aucun territoire éligible
- ✅ Gestion d'un seul territoire éligible
- ✅ Rangs ordinaux corrects (1, 2, 3...)

#### Tests des textes méthodologiques (2 tests)
- ✅ Texte méthodologique complet
- ✅ Critères d'éligibilité avec seuils corrects

#### Tests de validation (8 tests)
- ✅ Aucune erreur pour entrée valide
- ✅ Erreur pour code territoire manquant
- ✅ Erreur pour libellé territoire manquant
- ✅ Erreur pour prix médian négatif
- ✅ Erreur pour nombre d'observations négatif
- ✅ Erreur pour plage de dates invalide
- ✅ Erreurs multiples pour violations multiples
- ✅ Validation globale avec détails d'erreur

---

## 🚀 Résultats des tests

```
✓ frontend/src/utils/computeTerritoryRanking.test.ts (31 tests) 45ms

Test Files  1 passed (1)
     Tests  31 passed (31)
  Duration  859ms
```

---

## 🏗️ Build vérifié

```
✓ built in 10.07s
```

Le code compile sans erreur TypeScript et s'intègre correctement au projet.

---

## ⛔ Ce qui N'EST PAS fait à cette étape (comme demandé)

- ❌ UI / Interface utilisateur
- ❌ Couleurs ou badges
- ❌ Calcul de distance
- ❌ Comparaison entre magasins
- ❌ Recommandations
- ❌ Interprétation commerciale

---

## 📊 Exemple d'utilisation du code

```typescript
import {
  computeTerritoryRanking,
  getExcludedTerritories,
  getMethodologyText,
} from '@/utils/computeTerritoryRanking';
import { TerritoryStatsInput } from '@/utils/territoryRanking.types';

// Données d'entrée
const territories: TerritoryStatsInput[] = [
  {
    territoryCode: 'GP',
    territoryLabel: 'Guadeloupe',
    medianPrice: 105.50,
    observationCount: 50,
    storeCount: 15,
    productCount: 12,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
  },
  {
    territoryCode: 'MQ',
    territoryLabel: 'Martinique',
    medianPrice: 98.75,
    observationCount: 45,
    storeCount: 12,
    productCount: 10,
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
  },
  {
    territoryCode: 'GF',
    territoryLabel: 'Guyane',
    medianPrice: 115.00,
    observationCount: 25,  // Sous le seuil
    storeCount: 8,          // Sous le seuil
    productCount: 4,        // Sous le seuil
    periodStart: '2026-01-01',
    periodEnd: '2026-01-31',
  },
];

// Calcul du classement
const ranking = computeTerritoryRanking(territories);
console.log(ranking);
// [
//   { territoryCode: 'MQ', territoryLabel: 'Martinique', ordinalRank: 1, medianPrice: 98.75, ... },
//   { territoryCode: 'GP', territoryLabel: 'Guadeloupe', ordinalRank: 2, medianPrice: 105.50, ... }
// ]

// Territoires exclus
const excluded = getExcludedTerritories(territories);
console.log(excluded);
// [
//   {
//     territoryCode: 'GF',
//     territoryLabel: 'Guyane',
//     reason: 'observations insuffisantes (25/30), magasins insuffisants (8/10), produits insuffisants (4/5)',
//     currentValues: { observationCount: 25, storeCount: 8, productCount: 4 }
//   }
// ]

// Méthodologie
const methodology = getMethodologyText();
console.log(methodology);
// "Classement ordinal des territoires basé exclusivement sur le prix médian observé..."
```

---

## 🔐 Garanties juridiques et techniques

### ✅ Déterminisme
- Même entrée → même sortie (toujours)
- Pas d'aléatoire, pas d'horodatage variable
- Fonction pure sans effets de bord

### ✅ Auditabilité
- Seuils documentés et constants
- Raisons d'exclusion explicites
- Formule de calcul transparente
- Logs de validation disponibles

### ✅ Défendabilité juridique
- Aucune recommandation
- Aucune notation subjective
- Aucun label marketing
- Méthodologie affichée avant résultats
- Exclusions justifiées et tracées

### ✅ Maintenabilité
- Code TypeScript fortement typé
- Tests unitaires complets (31 tests)
- Documentation inline
- Fonctions courtes et focalisées

---

## 📝 Prochaines étapes (hors scope de cette ÉTAPE 1)

1. **ÉTAPE 2** : Interface utilisateur neutre
2. **ÉTAPE 3** : Intégration avec les données réelles
3. **ÉTAPE 4** : Mode opt-in Advanced Analysis
4. **ÉTAPE 5** : Documentation utilisateur

---

## 🎯 Conclusion

L'ÉTAPE 1 du MODULE F est **100% complète** et **prête pour la production** :

- ✅ Types TypeScript stricts et documentés
- ✅ Règles de filtrage bloquantes implémentées
- ✅ Formule de classement unique et transparente
- ✅ Fonction pure testable et déterministe
- ✅ Texte méthodologique inclus
- ✅ 31 tests unitaires passant avec succès
- ✅ Build vérifié et fonctionnel
- ✅ Aucune dépendance externe ajoutée
- ✅ Code juridiquement défendable

**Date de complétion** : 12 janvier 2026
**Version** : 1.0.0 (ÉTAPE 1)
**Statut** : ✅ PRODUCTION READY
