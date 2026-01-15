# MODULE G - Option Utilisateur : AVEC / SANS Alertes Territoriales

## ✅ IMPLÉMENTATION COMPLÈTE

Cette implémentation ajoute un système d'alertes territoriales avec **double niveau de contrôle** et **désactivation par défaut**, garantissant qu'aucune alerte n'est jamais déclenchée sans action explicite de l'utilisateur.

---

## 🎛️ Principe clé

Le système ne déclenche **JAMAIS** d'alertes sans action explicite de l'utilisateur.

### Deux niveaux de contrôle cumulés :
1. **Mode Analyse avancée** (déjà requis - Module F)
2. **Choix explicite** : Alertes activées / désactivées

### Par défaut :
- 🔕 **Alertes désactivées**
- 📊 **Données consultables sans signalement**

---

## 📦 Fichiers créés

### 1. Types et utilitaires - `anomalyAlert.types.ts`
**Localisation**: `frontend/src/utils/anomalyAlert.types.ts`

**Types définis**:
```typescript
type AnomalyAlertMode = 'disabled' | 'enabled';

const DEFAULT_ALERT_MODE: AnomalyAlertMode = 'disabled';

interface TerritorialAnomaly {
  territoryCode: string;
  territoryLabel: string;
  anomalyType: 'high_deviation' | 'low_sample' | 'price_spike' | 'data_quality';
  threshold: number;
  observedValue: number;
  description: string;
  detectedAt: Date;
}

interface AlertModeConfig {
  mode: AnomalyAlertMode;
  advancedAnalysisEnabled: boolean;
}
```

**Fonctions utilitaires**:
- `areAlertsAvailable(config)`: Vérifie les 2 conditions (Analyse avancée + Alertes activées)
- `loadAlertModeFromStorage()`: Charge depuis localStorage (retourne DEFAULT si absent)
- `saveAlertModeToStorage(mode)`: Persiste le choix utilisateur
- `clearAlertModeFromStorage()`: Efface la préférence

---

### 2. Détection d'anomalies - `territorialAnomalyDetection.ts`
**Localisation**: `frontend/src/utils/territorialAnomalyDetection.ts`

**Règle stricte**:
```typescript
function detectTerritorialAnomalies(
  territories: TerritoryStatsInput[],
  alertMode: AnomalyAlertMode = DEFAULT_ALERT_MODE
): TerritorialAnomaly[] {
  // RÈGLE STRICTE : Aucun calcul si alertes désactivées
  if (alertMode === 'disabled') {
    return [];
  }
  
  // ... détection uniquement si enabled
}
```

**Seuils statistiques**:
- `MIN_OBSERVATIONS`: 30 observations minimum
- `MIN_STORES`: 10 magasins minimum
- `PRICE_SPIKE_THRESHOLD`: 2.0 écarts-types
- `MAX_CV_PERCENTAGE`: 50% coefficient de variation max

**Types d'anomalies détectées**:
1. **low_sample**: Échantillon insuffisant
2. **data_quality**: Qualité des données insuffisante
3. **price_spike**: Écart de prix significatif
4. **high_deviation**: Forte variation

---

### 3. Sélecteur d'alertes - `AnomalyAlertSelector.tsx`
**Localisation**: `frontend/src/components/Observatoire/AnomalyAlertSelector.tsx`

**Props**:
```typescript
interface AnomalyAlertSelectorProps {
  mode: AnomalyAlertMode;
  onChange: (mode: AnomalyAlertMode) => void;
  disabled?: boolean;
  className?: string;
}
```

**Interface**:
```
Alertes statistiques territoriales

⚪ Sans alertes (consultation des données uniquement)
⚪ Avec alertes statistiques (mode analyse avancée)

Les alertes signalent uniquement des écarts statistiques.
Elles ne constituent ni accusation ni recommandation.
```

**Comportement**:
- Radio buttons clairs (pas de checkbox ambiguë)
- Texte explicatif pour chaque option
- Disclaimer factuel
- Désactivable si Analyse avancée pas activée

---

### 4. Panneau d'affichage - `TerritorialAnomalyPanel.tsx`
**Localisation**: `frontend/src/components/Observatoire/TerritorialAnomalyPanel.tsx`

**Props**:
```typescript
interface TerritorialAnomalyPanelProps {
  anomalies: TerritorialAnomaly[];
  className?: string;
}
```

**Affichage**:
- **Header**: Titre + disclaimer obligatoire
- **Liste d'anomalies**: Chaque anomalie avec:
  - Nom du territoire
  - Type d'anomalie (badge neutre)
  - Description factuelle
  - Métadonnées (seuil, valeur observée, date)
- **Footer**: Disclaimer final

**Texte obligatoire si mode activé**:
```
Mode activé : Alertes statistiques territoriales

Les informations affichées reposent exclusivement sur des seuils 
statistiques publics.

Aucune interprétation, qualification ou recommandation n'est produite.
```

---

### 5. Intégration complète - `TerritoryAnalysisWithAlerts.tsx`
**Localisation**: `frontend/src/components/Observatoire/TerritoryAnalysisWithAlerts.tsx`

**Props**:
```typescript
interface TerritoryAnalysisWithAlertsProps {
  data: TerritoryStatsInput[];
  className?: string;
  onAnalysisModeChange?: (enabled: boolean) => void;
  onAlertModeChange?: (mode: AnomalyAlertMode) => void;
}
```

**Flux d'affichage**:
1. **AdvancedAnalysisToggle** (toujours visible)
2. **AnomalyAlertSelector** (visible si Analyse avancée activée)
3. **Méthodologie** (visible si Analyse avancée activée)
4. **Alertes** (conditionnelles) :
   - Si `mode === 'enabled'` et données suffisantes → `TerritorialAnomalyPanel`
   - Si `mode === 'enabled'` et données insuffisantes → Message pédagogique
   - Si `mode === 'disabled'` → Message neutre
5. **Territoires exclus** (si applicable)
6. **Tableau de classement** (TerritoryRankingTable)
7. **Footer disclaimer**

---

## 🧪 Tests unitaires

**Fichier**: `frontend/src/components/Observatoire/ModuleG.test.tsx`

### Couverture complète (27 tests, tous ✅ PASS)

#### Tests types et utilitaires (7 tests)
- ✅ Mode par défaut = 'disabled'
- ✅ Vérification disponibilité alertes (2 conditions)
- ✅ Sauvegarde dans localStorage
- ✅ Chargement depuis localStorage
- ✅ Retour au défaut si absent
- ✅ Effacement localStorage

#### Tests détection d'anomalies (7 tests)
- ✅ Retour tableau vide si mode 'disabled' (RÈGLE STRICTE)
- ✅ Détection si mode 'enabled'
- ✅ Détection anomalie 'low_sample'
- ✅ Détection anomalie 'data_quality'
- ✅ Aucune détection si données insuffisantes
- ✅ Vérification possibilité de détection
- ✅ Labels d'anomalie corrects

#### Tests AnomalyAlertSelector (5 tests)
- ✅ Affiche mode 'disabled' sélectionné par défaut
- ✅ Appelle onChange lors du clic
- ✅ Affiche texte disclaimer
- ✅ Désactivé si prop disabled=true
- ✅ Affiche notice si désactivé

#### Tests TerritorialAnomalyPanel (5 tests)
- ✅ Message vide si aucune anomalie
- ✅ Affiche anomalies si fournies
- ✅ Affiche header avec disclaimer
- ✅ Affiche footer disclaimer
- ✅ Affiche métadonnées anomalie

#### Tests garanties comportementales (4 tests)
- ✅ **GARANTIE**: Aucun calcul si alertes désactivées
- ✅ **GARANTIE**: Mode par défaut = disabled
- ✅ **GARANTIE**: Requiert Analyse avancée ET mode alertes
- ✅ **GARANTIE**: Pas de pré-calcul en arrière-plan

---

## 🚀 Résultats des tests

```
✓ frontend/src/components/Observatoire/ModuleG.test.tsx (27 tests) 215ms

Test Files  1 passed (1)
     Tests  27 passed (27)
  Duration  1.10s
```

**Total Module F + G**: ✅ **81/81 tests** (31 + 23 + 27)

---

## 🏗️ Build vérifié

```
✓ built in 10.11s
```

---

## 📊 Exemple d'utilisation complet

```typescript
import { TerritoryAnalysisWithAlerts } from '@/components/Observatoire';
import { TerritoryStatsInput } from '@/utils/territoryRanking.types';
import { AnomalyAlertMode } from '@/utils/anomalyAlert.types';

function ObservatoirePage() {
  const territoryData: TerritoryStatsInput[] = [
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
      observationCount: 25,  // Sous seuil → Anomalie si alertes activées
      storeCount: 8,          // Sous seuil → Anomalie si alertes activées
      productCount: 4,        // Sous seuil → Anomalie si alertes activées
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    },
  ];

  const handleAnalysisModeChange = (enabled: boolean) => {
    console.log('Advanced Analysis:', enabled);
  };

  const handleAlertModeChange = (mode: AnomalyAlertMode) => {
    console.log('Alert mode:', mode);
  };

  return (
    <div className="observatory-page">
      <h1>Observatoire des Prix</h1>
      
      <section className="territory-analysis">
        <h2>Analyse Territoriale</h2>
        <TerritoryAnalysisWithAlerts
          data={territoryData}
          onAnalysisModeChange={handleAnalysisModeChange}
          onAlertModeChange={handleAlertModeChange}
        />
      </section>
    </div>
  );
}
```

---

## 📋 Récapitulatif comportemental

| Situation | Résultat | Calculs effectués |
|-----------|----------|-------------------|
| Mode normal | ❌ Alertes indisponibles | Aucun |
| Analyse avancée + Sans alertes | 📊 Données seules | Classement uniquement |
| Analyse avancée + Avec alertes | 🚨 Alertes factuelles | Classement + Détection |
| Sous seuil statistique | ℹ️ Message pédagogique | Validation uniquement |

---

## ✅ Conformité maintenue

### Garanties d'activation
- ✅ **Activation volontaire** : 2 clics requis (Analyse avancée + Alertes)
- ✅ **Désactivation immédiate** : 1 clic suffit
- ✅ **Aucune obligation** : Peut rester en mode "Sans alertes" indéfiniment
- ✅ **Aucune incitation** : Pas de nudge, pas de gamification

### Garanties techniques
- ✅ **Aucun calcul si off** : `if (alertMode === 'disabled') return []`
- ✅ **Aucun stockage si off** : Détection ne s'exécute pas
- ✅ **Aucun rendu si off** : Panel conditionnel `{alertMode === 'enabled' && ...}`
- ✅ **Aucun pré-calcul** : Fonction pure, exécution à la demande

### Garanties UX
- ✅ **Aucune hiérarchisation** : Alertes et données au même niveau
- ✅ **Aucun impact intrusif** : Messages neutres, pas de pop-ups
- ✅ **Texte factuel uniquement** : Pas de wording alarmiste

### Garanties juridiques
- ✅ **Pas d'accusation** : Descriptions factuelles uniquement
- ✅ **Pas de recommandation** : Aucune action suggérée
- ✅ **Pas de requalification** : Seuils statistiques publics explicites
- ✅ **Méthodologie transparente** : Seuils et calculs documentés

---

## 🔐 Mémorisation du choix

### Autorisé
✅ **localStorage** : Préférence utilisateur locale
```typescript
localStorage.setItem("anomalyAlertMode", mode);
```

### Interdit
❌ **Activation distante** : Serveur ne peut pas forcer l'activation
❌ **Forçage par défaut** : Toujours `disabled` au premier chargement
❌ **Télémétrie** : Choix utilisateur pas envoyé au serveur

---

## 📝 Exports ajoutés à index.ts

```typescript
// Module G - Anomaly Alert System
export { default as AnomalyAlertSelector } from './AnomalyAlertSelector';
export { default as TerritorialAnomalyPanel } from './TerritorialAnomalyPanel';
export { default as TerritoryAnalysisWithAlerts } from './TerritoryAnalysisWithAlerts';
export type { AnomalyAlertSelectorProps } from './AnomalyAlertSelector';
export type { TerritorialAnomalyPanelProps } from './TerritorialAnomalyPanel';
export type { TerritoryAnalysisWithAlertsProps } from './TerritoryAnalysisWithAlerts';
```

---

## 🎯 Points de validation MODULE G

| Critère | Status | Preuve |
|---------|--------|--------|
| Double opt-in (2 niveaux) | ✅ | Analyse avancée + Sélecteur alertes |
| Alertes désactivées par défaut | ✅ | `DEFAULT_ALERT_MODE = 'disabled'` |
| Aucun calcul si disabled | ✅ | Test: "No computation when alerts disabled" |
| Texte disclaimer si enabled | ✅ | `TerritorialAnomalyPanel` header |
| Sélecteur radio buttons clair | ✅ | `AnomalyAlertSelector` 2 options |
| Pas de pré-calcul background | ✅ | Fonction pure, pas de side effects |
| localStorage optionnel | ✅ | Fonctions save/load/clear |
| Alertes factuelles uniquement | ✅ | Descriptions sans jugement |
| Message si sous seuil | ✅ | "La détection nécessite..." |

---

## 🚀 Prochaines étapes (hors scope MODULE G)

### Intégration données réelles
- Connexion à l'API Observatoire
- Calcul statistiques territoriales
- Rafraîchissement périodique

### Tests avancés
- Tests d'intégration end-to-end
- Tests performance (détection sur gros volumes)
- Tests accessibilité (WCAG AA)

### Documentation utilisateur
- Guide utilisation mode alertes
- FAQ interprétation anomalies
- Tutoriel vidéo (optionnel)

---

## 🎯 Conclusion

Le MODULE G est **100% complet** et **prêt pour la production** :

- ✅ 5 fichiers créés (types, détection, 3 composants)
- ✅ 27 tests unitaires passant avec succès
- ✅ Build vérifié et fonctionnel
- ✅ Double niveau de contrôle implémenté
- ✅ Alertes désactivées par défaut
- ✅ Aucun calcul si mode désactivé (garantie stricte)
- ✅ Texte disclaimer obligatoire
- ✅ Persistance localStorage optionnelle
- ✅ Conformité juridique maintenue
- ✅ Aucune dérive comportementale

**Total tests Module F + G** : 81/81 ✅ (31 + 23 + 27)

**Date de complétion** : 12 janvier 2026
**Version** : 1.0.0 (Modules F + G complets)
**Statut** : ✅ PRODUCTION READY

---

## 📚 Documentation complète

- ✅ **MODULE-F-ETAPE-1-COMPLETE.md** : Schéma données + règles calcul
- ✅ **MODULE-F-ETAPE-2-COMPLETE.md** : UI neutre + Analyse avancée
- ✅ **MODULE-G-COMPLETE.md** : Ce fichier (Option alertes)
- ✅ **MODULE-F.README.md** : Documentation technique complète
