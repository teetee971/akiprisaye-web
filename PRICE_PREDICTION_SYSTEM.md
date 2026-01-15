# 📈 Système de Prévision des Prix - Documentation Technique

## Vue d'ensemble

Le système de prévision des prix permet d'anticiper les hausses et baisses de prix des produits alimentaires en utilisant une analyse statistique des observations historiques.

**Version**: 6.0.0  
**Date**: 2025-01-07  
**Statut**: Production Ready

---

## 🎯 Objectifs

1. **Transparence**: Algorithme explicable, pas de boîte noire IA
2. **Performance**: Calculs 100% client-side, pas d'appel API
3. **Fiabilité**: Seuils statistiques validés, gestion des cas limites
4. **Utilité**: Aide à la décision d'achat pour les citoyens

---

## 📊 Méthodologie Statistique

### Régression Linéaire Simple

**Formule**: `prix = slope × jours + intercept`

**Variables**:
- **X (jours)**: Temps écoulé depuis la première observation
- **Y (prix)**: Prix observé en euros
- **Slope**: Variation de prix par jour (€/jour)
- **Intercept**: Prix estimé au jour 0

**Calcul**:
```typescript
slope = Σ((x - x̄)(y - ȳ)) / Σ((x - x̄)²)
intercept = ȳ - slope × x̄
```

Où:
- `x̄` = moyenne des jours
- `ȳ` = moyenne des prix
- `Σ` = somme

### Volatilité (Coefficient de Variation)

**Formule**: `volatilité = écart-type / moyenne`

**Interprétation**:
- `< 5%`: Très stable, haute confiance
- `5-15%`: Stable, confiance moyenne
- `> 15%`: Volatile, confiance faible

---

## 🏷️ Labels de Prédiction

### 1. "Baisse probable" (↘ 🟢)

**Conditions**:
- `slope < -0.001 €/jour` (tendance baissière)
- `volatilité < 0.08` (8%, prix stable)

**Signification**:
Le prix montre une tendance baissière claire avec peu de fluctuations, suggérant une baisse continue probable.

**Exemples**:
- Produit en fin de saison
- Surproduction temporaire
- Promotion prolongée

### 2. "Hausse probable" (↗ 🔴)

**Conditions**:
- `slope > +0.001 €/jour` (tendance haussière)

**Signification**:
Le prix montre une tendance haussière, suggérant une augmentation continue.

**Exemples**:
- Produit en début de saison
- Pénurie ou demande élevée
- Augmentation des coûts matières premières

### 3. "Prix stable" (→ 🟡)

**Conditions**:
- `|slope| ≤ 0.001 €/jour` (pas de tendance)
- OU `volatilité ≥ 0.08` (fluctuations trop importantes)

**Signification**:
Aucune tendance claire ou fluctuations trop importantes pour une prédiction fiable.

**Exemples**:
- Prix régulé
- Équilibre offre/demande
- Fluctuations promotionnelles

### 4. "Données insuffisantes" (⚪ Gris)

**Conditions**:
- `< 3 observations` disponibles
- OU pas de variation temporelle exploitable

**Signification**:
Pas assez de données pour calculer une tendance fiable.

---

## 🔧 Paramètres Configurables

### Fenêtre d'Analyse

**Par défaut**: 10 dernières observations

**Justification**:
- Balance entre réactivité et stabilité
- Capture les tendances récentes
- Évite le bruit des observations trop anciennes

**Configurable**: Via `options.window` (3-30 observations)

### Seuil de Pente (epsilon)

**Par défaut**: 0.001 €/jour

**Justification**:
- Filtre les variations négligeables (<0.03€/mois)
- Évite les faux positifs sur prix très stables
- Adapté aux prix alimentaires (0.50€ - 20€)

**Configurable**: Via `options.epsSlope`

### Seuil de Volatilité

**Par défaut**: 0.08 (8%)

**Justification**:
- Distingue prix stable vs fluctuant
- Basé sur l'analyse des prix réels en Grande Distribution
- 8% = ~0.16€ sur un produit à 2€

**Configurable**: Via `options.volatilityThreshold`

---

## 💻 Implémentation Technique

### Service: `predictionService.ts`

**Fonctions principales**:

```typescript
// Calcul de la régression linéaire
linearRegressionDays(observations: Observation[]): 
  { slopePerDay: number; intercept: number } | null

// Calcul de la prédiction complète
computePrediction(observations: Observation[], options?: Options): 
  PredictionResult
```

**Types TypeScript**:

```typescript
type Observation = { 
  date: string;    // ISO 8601
  price: number;   // en euros
  store?: string;  // optionnel
};

type PredictionLabel = 
  | 'Baisse probable' 
  | 'Hausse probable' 
  | 'Prix stable' 
  | 'Données insuffisantes';

type PredictionResult = {
  label: PredictionLabel;
  slopePerDay: number | null;      // €/jour
  volatility: number | null;        // coefficient de variation
  usedCount: number;                // nombre d'observations utilisées
  explanation: string;              // explication en français
};
```

### Composant: `PriceTrendBadge.tsx`

**Props**:
```typescript
interface PriceTrendBadgeProps {
  prediction: PredictionResult;
  compact?: boolean;        // affichage compact (badge seul)
  showDetails?: boolean;    // afficher métriques détaillées
}
```

**Variantes d'affichage**:

1. **Compact** (par défaut):
   - Badge coloré avec flèche et label
   - Tooltip avec explication complète

2. **Détaillé** (`showDetails=true`):
   - Badge + indicateur de confiance
   - Explication textuelle
   - Métriques (tendance, volatilité, échantillon)

---

## 🎨 Interface Utilisateur

### Codes Couleurs

| Label | Couleur | Border | Icône | Signification |
|-------|---------|--------|-------|---------------|
| Baisse probable | Vert clair (`bg-green-100`) | Vert (`border-green-300`) | ↘ | Opportunité d'achat |
| Hausse probable | Rouge clair (`bg-red-100`) | Rouge (`border-red-300`) | ↗ | Acheter maintenant |
| Prix stable | Jaune clair (`bg-yellow-100`) | Jaune (`border-yellow-300`) | → | Pas d'urgence |
| Données insuffisantes | Gris (`bg-gray-100`) | Gris (`border-gray-300`) | - | Attendre plus de données |

### Indicateurs de Confiance

Basés sur la volatilité:

- `●●●` (3 points pleins): Haute confiance (volatilité < 5%)
- `●●○` (2 points pleins): Confiance moyenne (volatilité 5-15%)
- `●○○` (1 point plein): Faible confiance (volatilité > 15%)

---

## 📈 Intégration dans l'Application

### 1. Comparateur de Produits (`/comparateur-intelligent`)

**Affichage**:
- Badge de prédiction à côté du prix
- Tri par tendance (baisses probables en premier)
- Filtrage par type de tendance

**Code**:
```typescript
import { computePrediction } from '@/services/predictionService';
import PriceTrendBadge from '@/components/price/PriceTrendBadge';

// Dans le composant
const prediction = computePrediction(product.observations);

return (
  <div className="product-card">
    <PriceTrendBadge prediction={prediction} compact />
  </div>
);
```

### 2. Vue Détaillée Produit

**Affichage**:
- Graphique d'évolution des prix
- Badge de prédiction avec détails
- Historique des tendances

**Code**:
```typescript
<PriceTrendBadge 
  prediction={prediction} 
  showDetails 
/>
```

### 3. Alertes Prix

**Logique**:
- Créer alerte automatique pour "Hausse probable"
- Suggérer achat immédiat pour "Baisse probable"
- Pas d'alerte pour "Prix stable"

---

## 🔬 Validation et Tests

### Cas de Test

1. **Tendance baissière claire**:
   - Observations: [2.50, 2.45, 2.40, 2.35, 2.30] sur 10 jours
   - Résultat attendu: "Baisse probable"

2. **Tendance haussière**:
   - Observations: [3.00, 3.05, 3.10, 3.15] sur 7 jours
   - Résultat attendu: "Hausse probable"

3. **Prix stable**:
   - Observations: [1.99, 2.01, 1.98, 2.00, 2.02] sur 15 jours
   - Résultat attendu: "Prix stable"

4. **Volatilité élevée**:
   - Observations: [2.00, 2.50, 1.80, 2.30, 1.90] sur 10 jours
   - Résultat attendu: "Prix stable" (volatilité > 8%)

5. **Données insuffisantes**:
   - Observations: [1.50, 1.55] (2 observations)
   - Résultat attendu: "Données insuffisantes"

### Tests Unitaires

Voir: `src/services/__tests__/predictionService.test.ts`

---

## ⚠️ Limitations et Avertissements

### Limitations Techniques

1. **Modèle simple**: Régression linéaire uniquement, pas de saisonnalité
2. **Fenêtre fixe**: N'adapte pas la fenêtre selon le contexte
3. **Pas d'événements externes**: N'intègre pas les promotions, fêtes, etc.
4. **Historique court**: Données limitées à 7 jours maximum

### Avertissements Utilisateur

**Message affiché**:
> ⚠️ Les prévisions sont basées sur des analyses statistiques des observations récentes. Elles ne garantissent pas les prix futurs et doivent être utilisées comme indication uniquement.

**Communication transparente**:
- Algorithme expliqué en français clair
- Métriques visibles (pente, volatilité, échantillon)
- Pas de langage marketing trompeur
- Contexte statistique fourni

---

## 📊 Performances

### Temps de Calcul

- **Régression linéaire**: O(n) où n = nombre d'observations
- **Prédiction complète**: < 1ms pour 10-30 observations
- **100% client-side**: Pas de latence réseau

### Consommation Mémoire

- **Service**: ~5 KB (fonctions pures)
- **Composant**: ~3 KB (badge React)
- **Données**: Utilise les observations existantes (pas de duplication)

### Optimisations

1. **Calcul à la demande**: Pas de précalcul, seulement quand affiché
2. **Memoization**: React.memo sur PriceTrendBadge
3. **Fenêtre limitée**: Maximum 30 observations pour éviter calculs lourds

---

## 🔄 Évolutions Futures

### Version 6.1 (Court terme)

- [ ] Graphique d'évolution avec prédiction linéaire
- [ ] Export des prédictions (CSV, JSON)
- [ ] Alertes automatiques basées sur tendances

### Version 7.0 (Moyen terme)

- [ ] Détection de saisonnalité (FFT, autocorrélation)
- [ ] Intégration événements promotionnels
- [ ] Comparaison inter-magasins avec prédictions
- [ ] Machine Learning (ARIMA, Prophet) avec transparence

### Version 8.0 (Long terme)

- [ ] API de prédiction temps réel
- [ ] Agrégation multi-produits (panier)
- [ ] Prédictions personnalisées (historique utilisateur)
- [ ] Modèles par catégorie de produits

---

## 📚 Références

### Statistiques

- **Régression linéaire**: Méthode des moindres carrés ordinaires (OLS)
- **Coefficient de variation**: CV = σ/μ (écart-type / moyenne)
- **Fenêtre glissante**: Moving window pour analyse temporelle

### Standards

- **ISO 8601**: Format de date (`YYYY-MM-DDTHH:mm:ssZ`)
- **IEEE 754**: Calculs en virgule flottante (double précision)
- **TypeScript strict**: Types vérifiés à la compilation

### Réglementation

- **RGPD**: Pas de données personnelles, calculs locaux
- **Loi Hamon**: Information transparente sur la méthodologie
- **Code de la consommation**: Pas de promesses trompeuses

---

## 🤝 Contribution

### Ajout de Nouvelles Méthodes

1. Créer une fonction dans `predictionService.ts`
2. Ajouter les tests unitaires
3. Documenter l'algorithme et les seuils
4. Mettre à jour cette documentation

### Amélioration des Seuils

1. Analyser les données réelles (observations)
2. Calculer les distributions de slopes et volatilités
3. Optimiser les seuils (minimiser faux positifs/négatifs)
4. Valider avec des cas de test

---

## 📞 Support

**Questions techniques**: Voir `src/services/predictionService.ts`  
**Interface utilisateur**: Voir `src/components/price/PriceTrendBadge.tsx`  
**Documentation**: Ce fichier (`PRICE_PREDICTION_SYSTEM.md`)

**Version**: 6.0.0  
**Dernière mise à jour**: 2025-01-07  
**Statut**: ✅ Production Ready
