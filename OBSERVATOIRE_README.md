# Module d'Observation Citoyenne des Prix - Documentation Complète

## Vue d'ensemble

Ce module implémente un système complet d'observation citoyenne des prix pour "A KI PRI SA YÉ" basé **EXCLUSIVEMENT sur des données réelles** issues de tickets de caisse.

## 🎯 Principes Fondamentaux

### Éthique et Transparence
- ❌ **AUCUNE** donnée estimée ou extrapolée
- ❌ **AUCUNE** notation commerciale ou classement punitif
- ❌ **AUCUNE** IA boîte noire ou algorithme opaque
- ❌ **AUCUNE** donnée personnelle collectée
- ✅ **UNIQUEMENT** des prix réels observés sur tickets validés
- ✅ Méthodes explicables avec seuils transparents
- ✅ Contrôle utilisateur total
- ✅ Open data avec licence Etalab 2.0

### Philosophie
> **Un signal ≠ une accusation**
> 
> Ce système vise à informer le débat public, pas à sanctionner.

## 📦 Modules Implémentés

### 1. Système d'Observation Manuel ✅

**Fichiers**:
- `src/schemas/observation.ts` - Schéma TypeScript strict
- `scripts/add-observation.js` - Script d'ingestion
- `scripts/generate-index.js` - Génération d'index
- `data/observations/` - Stockage des données
- `public/observatoire.html` - Page publique

**Fonctionnalités**:
- Validation stricte sans dépendances externes
- Génération automatique d'ID et horodatage
- Synchronisation automatique vers `public/`
- Affichage chronologique (plus récent en premier)

**Usage**:
```bash
# Ajouter une observation
npm run observations:add chemin/vers/observation.json

# Régénérer l'index
npm run observations:generate
```

**Format d'entrée**:
```json
{
  "territoire": "Guadeloupe",
  "commune": "Morne-à-l'Eau",
  "enseigne": "U express",
  "date": "2025-12-31",
  "heure": "12:07:56",
  "produits": [
    {
      "nom": "CHIPS",
      "quantite": 1,
      "prix_unitaire": 1.87,
      "prix_total": 1.87,
      "tva_pct": 0,
      "categorie": "Épicerie"
    }
  ],
  "total_ttc": 1.87
}
```

### 2. Comparaison Territoriale ✅

**Fichiers**:
- `src/services/comparison.ts` - Service de comparaison
- `public/comparaison-territoires.html` - Interface utilisateur

**Fonctionnalités**:
- Comparaison multi-territoires
- Filtrage par produit/catégorie
- Filtrage par période
- Affichage min/max/médiane
- Comptage transparent des observations

**Méthodes**:
```typescript
import { compareTerritoriesPrices } from './services/comparison';

const result = compareTerritoriesPrices(observations, {
  territoires: ['Guadeloupe', 'Martinique'],
  produit: 'CHIPS',
  date_debut: '2025-01-01',
  date_fin: '2025-12-31'
});
```

**Principes**:
- Médiane calculée uniquement si ≥ 3 observations
- Affichage "Données insuffisantes" si pas assez de données
- Aucune estimation de valeurs manquantes

### 3. Détection d'Anomalies ✅

**Fichiers**:
- `src/services/anomaly-detection.ts` - Service de détection
- `public/anomalies-prix.html` - Page d'anomalies

**Méthodes de Détection**:

1. **IQR (Interquartile Range)**
   - Outliers hors de [Q1 - 1.5×IQR, Q3 + 1.5×IQR]

2. **Écart Relatif** (par défaut)
   - Anomalie si écart > 20% de la médiane récente

3. **Seuil Fixe**
   - Anomalie si variation > seuil défini

**Niveaux**:
- **À surveiller**: 20-30% d'écart
- **Hausse inhabituelle**: 30-50% d'écart
- **Variation forte**: >50% d'écart

**Configuration**:
```typescript
import { detectPriceAnomalies, DEFAULT_CONFIG } from './services/anomaly-detection';

const anomalies = detectPriceAnomalies(observations, {
  methode: 'relative_deviation',
  min_observations: 10,
  lookback_days: 90,
  seuil: 20 // 20%
});
```

**Éthique**:
- Chaque anomalie inclut l'explication complète
- Référence et seuil toujours affichés
- Aucun classement d'enseignes
- Signal, pas accusation

### 4. Alertes Citoyennes ✅

**Fichiers**:
- `src/services/alerts.ts` - Service d'alertes

**Types d'Alertes**:

1. **Hausse Anormale**
   - Déclenchée par anomalie détectée
   - Sur produit suivi par l'utilisateur

2. **Variation Rapide**
   - Écart > X% sur Y jours
   - Paramètres définis par l'utilisateur

3. **Nouvelle Donnée**
   - Nouvelle observation disponible
   - Sur produit/territoire suivi

**Création de Règle**:
```typescript
import { createAlertRule } from './services/alerts';

const rule = createAlertRule({
  nom: 'Surveiller le riz en Guadeloupe',
  type: 'hausse_anormale',
  territoires: ['Guadeloupe'],
  produits: ['Riz'],
  seuil_pourcent: 20,
  periode_jours: 30,
  frequence_max_heures: 24
});
```

**Principes**:
- Opt-in explicite (aucune alerte par défaut)
- Contrôle total par l'utilisateur
- Notifications factuelles et neutres
- Aucune incitation à l'achat

### 5. Tableau de Bord de Vigilance ✅

**Fichiers**:
- `src/services/vigilance-dashboard.ts` - Service de vigilance

**Indicateurs**:

1. **Global**
   - Nombre d'anomalies actives
   - Nombre d'alertes actives
   - Produits les plus surveillés

2. **Par Territoire**
   - Indicateurs par territoire
   - Évolution sur 7/30/90 jours
   - Catégories concernées

3. **Par Catégorie**
   - Produits concernés
   - Territoires affectés

**Usage**:
```typescript
import { generateVigilanceDashboard } from './services/vigilance-dashboard';

const dashboard = generateVigilanceDashboard(
  observations,
  anomalies,
  alerts,
  '30j' // période
);
```

**Principes**:
- Aucune notation commerciale
- Aucun classement punitif
- Agrégation transparente
- Inspire confiance, pas peur

### 6. Export Open Data ✅

**Fichiers**:
- `src/services/open-data-export.ts` - Service d'export

**Formats**:
- **JSON**: Structuré avec métadonnées Etalab 2.0
- **CSV**: Tabulaire UTF-8

**Types d'Export**:

1. **Observations** (données complètes)
2. **Anomalies** (anonymisées, sans observation_id)
3. **Alertes** (agrégées, sans données utilisateur)

**Usage**:
```typescript
import { exportObservations, exportAnomalies } from './services/open-data-export';

// Export JSON
exportObservations(observations, 'json');

// Export CSV
exportAnomalies(anomalies, 'csv');
```

**Licence**:
- Licence Ouverte / Open Licence v2.0 (Etalab)
- Attribution obligatoire: "A KI PRI SA YÉ"
- Réutilisation libre (commerciale ou non)

## 🏗️ Architecture

### Structure des Données

```
data/
└── observations/
    ├── .gitkeep
    ├── index.json                    # Index trié (desc par date)
    ├── README.md                     # Documentation
    └── 2025-12-31-120756-....json   # Observations individuelles

public/data/observations/              # Copie synchronisée (build-time)
    ├── index.json
    └── 2025-12-31-120756-....json
```

### Flux de Données

```
Ticket de caisse (citoyen)
    ↓
scripts/add-observation.js (validation)
    ↓
data/observations/{id}.json (stockage)
    ↓
scripts/generate-index.js (indexation)
    ↓
public/data/observations/ (synchronisation)
    ↓
public/*.html (affichage)
```

### Services (TypeScript)

```
src/
├── schemas/
│   └── observation.ts           # Schéma + validation
└── services/
    ├── comparison.ts            # Comparaison territoriale
    ├── anomaly-detection.ts     # Détection d'anomalies
    ├── alerts.ts                # Système d'alertes
    ├── vigilance-dashboard.ts   # Tableau de bord
    └── open-data-export.ts      # Export open data
```

## 📖 Documentation

### Méthodologie
- **Complète**: `docs/METHODOLOGY_TICKETS.md`
- **Guide utilisateur**: `data/observations/README.md`

### Pages Publiques
- **Observatoire**: `/observatoire.html`
- **Comparaison**: `/comparaison-territoires.html`
- **Anomalies**: `/anomalies-prix.html`

## 🔒 Sécurité et Vie Privée

### Données Collectées
- ✅ Informations commerciales publiques uniquement
- ✅ Géolocalisation large (commune)
- ❌ Aucune donnée personnelle
- ❌ Aucun tracking utilisateur

### Anonymisation
- Observations: ID du magasin optionnel
- Anomalies: sans observation_id dans l'export
- Alertes: agrégation complète, aucune donnée utilisateur

### Validation
- TypeScript strict mode
- Validation à l'ingestion
- 0 alerte CodeQL

## 🚀 Déploiement

### Cloudflare Pages

```bash
# Build
npm run build

# Déploiement automatique via Git push
git push origin main
```

### Fichiers Servis
- `/observatoire.html` - Page observatoire
- `/comparaison-territoires.html` - Comparaison
- `/anomalies-prix.html` - Anomalies
- `/data/observations/index.json` - Index des observations
- `/data/observations/*.json` - Observations individuelles

## 📊 Exemples de Données

### Observation Réelle (U express, Guadeloupe)

```json
{
  "id": "2025-12-31-120756-uexpress-morne",
  "territoire": "Guadeloupe",
  "commune": "Morne-à-l'Eau",
  "enseigne": "U express",
  "magasin_id": "37966",
  "date": "2025-12-31",
  "heure": "12:07:56",
  "produits": [
    {
      "nom": "CHIPS",
      "quantite": 1,
      "prix_unitaire": 1.87,
      "prix_total": 1.87,
      "tva_pct": 0,
      "categorie": "Épicerie"
    },
    {
      "nom": "CIDRE",
      "quantite": 2,
      "prix_unitaire": 3.54,
      "prix_total": 7.08,
      "tva_pct": 13,
      "categorie": "Boissons"
    },
    {
      "nom": "PARMIG",
      "quantite": 1,
      "prix_unitaire": 2.21,
      "prix_total": 2.21,
      "tva_pct": 11,
      "categorie": "Produits laitiers"
    }
  ],
  "total_ttc": 11.16,
  "source": "ticket_caisse",
  "fiabilite": "preuve_physique",
  "verifie": false,
  "created_at": "2025-12-31T12:07:56.000Z"
}
```

## 🔮 Évolutions Futures

### Non Implémenté (Nécessite Backend)
- API REST temps réel (Cloudflare Workers)
- Streaming SSE (Server-Sent Events)
- Authentification utilisateur
- Gestion des alertes en ligne

### Prêt à Implémenter
Tous les **services sont créés et prêts** pour:
- Page d'évolution des prix (graphiques)
- Page de gestion des alertes
- Page du tableau de bord de vigilance
- API REST (il suffit d'ajouter les endpoints)

## ❓ FAQ

### Q: Puis-je contribuer des observations ?
R: Oui ! Créez un fichier JSON et soumettez-le via Pull Request, ou utilisez le script `observations:add`.

### Q: Les données sont-elles fiables ?
R: Toutes les observations proviennent de tickets de caisse réels. Le champ `verifie` indique si une validation manuelle a eu lieu.

### Q: Comment sont détectées les anomalies ?
R: Par écart statistique (>20%) par rapport à la médiane des 10 dernières observations sur 90 jours. Méthode explicable et reproductible.

### Q: Puis-je utiliser ces données ?
R: Oui ! Licence Ouverte Etalab 2.0. Attribution obligatoire: "A KI PRI SA YÉ".

### Q: Y a-t-il des données personnelles ?
R: Non. Aucune donnée personnelle n'est collectée ou stockée.

## 📞 Contact

- **GitHub**: [teetee971/akiprisaye-web](https://github.com/teetee971/akiprisaye-web)
- **Issues**: [GitHub Issues](https://github.com/teetee971/akiprisaye-web/issues)
- **Documentation**: `/docs`

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2025  
**Licence**: Voir LICENSE  
**Données**: Licence Ouverte Etalab 2.0
