# 💧 Comparateur Accès Eau Potable

## Vue d'ensemble

Le **Comparateur Eau Potable** est un observatoire citoyen de l'accès à l'eau potable dans les territoires ultramarins, créé en réponse à l'urgence hydrique notamment à Mayotte et en Guadeloupe.

## 🎯 Objectif

Apporter transparence et information sur la crise de l'eau dans les DOM-TOM :
- **Mayotte** : Coupures quotidiennes, pénurie chronique
- **Guadeloupe** : 63% de pertes dans le réseau (fuites)
- **Prix élevés** : Jusqu'à 2x plus cher qu'en métropole
- **Qualité variable** : Contaminations ponctuelles
- **Manque de transparence** : Coupures non annoncées

## 🚀 Fonctionnalités

### 1. Carte Temps Réel
- Visualisation interactive de la disponibilité de l'eau par commune
- Statuts en temps réel : Eau disponible, Faible pression, Coupure programmée, Coupure en cours
- Contributions citoyennes géolocalisées

### 2. Signalement Citoyen
- Formulaire simple pour signaler l'état de l'eau
- Géolocalisation GPS automatique
- Vérification communautaire

### 3. Historique des Coupures
- Calendrier des coupures passées par commune
- Statistiques : durée moyenne, fréquence, zones touchées
- Graphiques d'évolution temporelle

### 4. Comparaison Prix
- Prix au m³ par territoire et fournisseur
- Décomposition des factures (distribution, assainissement, taxes)
- Comparaison avec la métropole
- Calculateur de coût annuel

### 5. Calculateur Consommation
- Estimation de consommation selon profil du foyer
- Recommandations d'économies personnalisées
- Calcul d'impact financier et environnemental

## 📁 Structure du Code

### Types TypeScript
```
src/types/waterComparison.ts
```
Types complets pour toutes les entités :
- `WaterAvailability` : État disponibilité eau
- `WaterCutHistory` : Historique coupures
- `WaterPricing` : Tarification
- `WaterQualityData` : Qualité eau (ARS)
- `WaterLeakReport` : Signalement fuites
- `WaterConsumptionProfile` : Profil consommation

### Services
```
src/services/
  ├── waterAvailabilityService.ts   # Disponibilité temps réel
  ├── waterPricingServiceExtended.ts # Comparaison prix
  ├── waterQualityService.ts        # Qualité eau (ARS)
  ├── waterLeakService.ts           # Signalement fuites
  ├── waterAlertService.ts          # Système d'alertes
  └── waterConsumptionService.ts    # Calculateur
```

### Composants UI
```
src/components/water/
  ├── WaterAvailabilityMap.tsx      # Carte Leaflet interactive
  ├── WaterStatusReportForm.tsx     # Formulaire signalement
  ├── WaterCutHistory.tsx           # Historique coupures
  ├── WaterPricingComparison.tsx    # Comparateur prix
  └── ConsumptionCalculator.tsx     # Calculateur consommation
```

### Page Principale
```
src/pages/ComparateurEauPotable.tsx  # Page unifiée avec tabs
```

### Données
```
public/data/water-availability.json   # Base de données eau
```

## 🔗 Routes

Le comparateur est accessible via 3 routes :
- `/eau-potable` (principale)
- `/comparateur-eau-potable`
- `/eau`

## 🗺️ Territoires Couverts

- 🇾🇹 Mayotte (YT)
- 🇬🇵 Guadeloupe (GP)
- 🇲🇶 Martinique (MQ)
- 🇬🇫 Guyane (GF)
- 🇷🇪 La Réunion (RE)

## 📊 Sources de Données

- **Contributions citoyennes** : Signalements géolocalisés en temps réel
- **Sources officielles** : 
  - Offices de l'eau régionaux
  - Régies municipales
  - Syndicats de gestion
  - ARS (Agence Régionale de Santé)
  - Rapports publics Sénat 2024-2025

## 🛡️ Méthodologie

### Transparence
- ✅ Données réelles uniquement (pas de simulation)
- ✅ Sources traçables et vérifiables
- ✅ Signalements citoyens avec validation
- ✅ Méthodologie publique et auditable
- ✅ Aucune affiliation commerciale

### Respect Utilisateurs
- ✅ Aucun tracking
- ✅ Données anonymisées
- ✅ Géolocalisation opt-in uniquement
- ✅ RGPD compliant

### Qualité Technique
- ✅ TypeScript strict
- ✅ Tests de build réussis
- ✅ Mobile-responsive
- ✅ Accessible (WCAG 2.1 AA visé)
- ✅ Performance optimisée (41.87 kB gzipped)

## 🎨 Design

### Interface
- Dark mode par défaut (adapté au contexte d'urgence)
- Couleurs sémantiques :
  - 🟢 Vert : Eau disponible
  - 🟡 Jaune : Faible pression
  - 🟠 Orange : Coupure programmée
  - 🔴 Rouge : Coupure en cours

### UX
- Navigation par tabs
- Sélecteur de territoire intuitif
- Formulaires simplifiés
- Feedback visuel temps réel

## 🔧 Intégration Technique

### Dépendances
- **Leaflet** : Cartographie interactive
- **React Leaflet** : Composants React pour Leaflet
- **React Helmet Async** : Meta tags SEO

### Build
```bash
npm run build
# Build size: 41.87 kB (gzipped: 11.64 kB)
```

## 🚧 Développement Futur

### Fonctionnalités Prioritaires
1. **Qualité de l'Eau** : Dashboard complet avec données ARS
2. **Signalement Fuites** : Carte collaborative des fuites
3. **Système d'Alertes** : Notifications push PWA
4. **Points d'Eau Gratuits** : Carte des fontaines et bornes d'urgence
5. **Prédiction IA** : Analyse patterns historiques pour prédire coupures

### Intégrations API
- API ARS pour qualité eau en temps réel
- API gestionnaires (SMGEAG, SME, etc.) pour coupures programmées
- Webhooks pour alertes automatiques

## 📱 Déploiement

Le comparateur est déployé automatiquement via Cloudflare Pages lors des pushs sur la branche principale.

URL de production : `https://akiprisaye-web.pages.dev/eau-potable`

## 📞 Contact & Contribution

Ce module fait partie du projet **A KI PRI SA YÉ**, application citoyenne de transparence des prix et services essentiels dans les territoires ultramarins.

### Signaler un Problème
GitHub Issues : https://github.com/teetee971/akiprisaye-web/issues

### Contribuer des Données
Les contributions citoyennes sont essentielles pour maintenir des données à jour et représentatives de la situation réelle sur le terrain.

---

**Note importante** : Ce comparateur répond à une urgence humanitaire. Les données présentées proviennent de sources officielles et de contributions citoyennes vérifiées. Son objectif est d'apporter transparence et information dans une situation de crise.

**Sources** : Rapports Sénat 2024-2025, ARS DOM-TOM, Offices de l'eau régionaux, médias locaux, contributions citoyennes.
