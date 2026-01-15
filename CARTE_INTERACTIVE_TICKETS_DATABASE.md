# Carte Interactive - Base de Données de Magasins depuis les Tickets de Caisse

## Vue d'ensemble

La carte interactive des magasins a été améliorée pour utiliser les **tickets de caisse comme source de données**. Chaque ticket scanné ou observé enrichit automatiquement la base de données des magasins.

## 🎯 Objectifs

1. **Découverte automatique** : Identifier de nouveaux magasins à partir des tickets de caisse
2. **Enrichissement continu** : Mettre à jour les informations des magasins existants
3. **Couverture élargie** : Étendre la couverture géographique grâce aux contributions citoyennes
4. **Données vérifiées** : Utiliser des preuves physiques (tickets) comme source fiable

## 📊 Sources de Données

La carte interactive utilise désormais **deux sources complémentaires** :

### 1. Base de données centralisée (`seedStores.js`)
- **27 magasins** référencés manuellement
- **11 territoires** DROM-COM couverts
- Coordonnées GPS précises
- Informations complètes (horaires, services, etc.)

### 2. Tickets de caisse (`data/observations/*.json`)
- Découverte automatique de nouveaux magasins
- Mise à jour de la fréquence d'observation
- Validation par preuve physique
- Enrichissement progressif des données

## 🔄 Fonctionnement

### Extraction des informations

Chaque ticket de caisse contient :
```json
{
  "territoire": "Guadeloupe",
  "commune": "Morne-à-l'Eau",
  "enseigne": "U express",
  "magasin_id": "37966",
  "date": "2025-12-31",
  "heure": "12:07:56",
  "produits": [...]
}
```

### Processus d'intégration

1. **Scan du ticket** → Extraction OCR des informations
2. **Normalisation** → Création d'un identifiant unique pour le magasin
3. **Correspondance** → Matching avec les magasins connus de `seedStores.js`
4. **Enrichissement** → Ajout ou mise à jour des informations
5. **Affichage** → Intégration automatique sur la carte

### Matching avec les magasins connus

Le système essaie de faire correspondre les tickets avec les magasins existants par :
- **ID magasin** (si disponible dans le ticket)
- **Nom de l'enseigne + ville**
- **Similarité de nom**

## 📁 Architecture

```
src/
├── services/
│   ├── mapService.js                    # Service principal de la carte
│   ├── storeFromReceiptsService.js      # Extraction depuis les tickets
│   └── receiptScanService.ts            # Scan et analyse des tickets
├── data/
│   ├── seedStores.js                    # Base de données centralisée
│   └── observations/                    # Tickets de caisse
│       ├── index.json                   # Index des observations
│       └── *.json                       # Fichiers de tickets individuels
└── pages/
    └── Carte.jsx                        # Composant de la carte interactive
```

## 🆕 Nouvelles Fonctionnalités

### Service `storeFromReceiptsService.js`

```javascript
// Charger toutes les observations de tickets
await loadReceiptObservations()

// Extraire les magasins des tickets
extractStoresFromReceipts(observations)

// Faire correspondre avec les magasins connus
matchReceiptStoresWithKnown(receiptStores, knownStores)

// Obtenir des statistiques
await getReceiptStoresStats()
```

### Intégration dans `mapService.js`

```javascript
// Obtenir les magasins d'un territoire (inclut les tickets par défaut)
await getStoresByTerritory('Guadeloupe', includeReceiptStores = true)
```

### Métadonnées enrichies

Chaque magasin peut maintenant contenir :
- `source`: 'seed_data' ou 'receipt_observation'
- `observationCount`: Nombre de tickets observés pour ce magasin
- `lastObservation`: Date de la dernière observation
- `hasReceiptObservations`: Booléen indiquant si le magasin a des tickets

## 📈 Métriques de Qualité

### Statut d'un magasin

Les magasins découverts via tickets peuvent avoir différents statuts :

- ✅ **Matched** : Correspondance trouvée avec un magasin connu
  - Coordonnées GPS disponibles
  - Affiché sur la carte
  - Informations complètes

- ⏳ **Needs Geocoding** : Nouveau magasin sans coordonnées
  - Détecté mais non géolocalisé
  - Nécessite un traitement manuel ou un service de géocodage
  - Non affiché sur la carte (en attente)

### Exemple de statistiques

```javascript
{
  totalStores: 10,
  storesWithCoordinates: 8,
  storesNeedingGeocoding: 2,
  byTerritory: {
    'Guadeloupe': 5,
    'Martinique': 3,
    'Guyane': 2
  },
  byChain: {
    'U express': 3,
    'Carrefour': 4,
    'Leader Price': 3
  },
  totalObservations: 45
}
```

## 🔐 Considérations de Confidentialité

### Protection des données

- **Aucune donnée personnelle** collectée depuis les tickets
- **Anonymisation** automatique des informations sensibles
- **Traitement local** des données (navigation uniquement)
- **RGPD compliant** : pas de stockage sans consentement

### Données publiques uniquement

Les informations extraites des tickets sont **d'intérêt général** :
- Nom de l'enseigne (public)
- Localisation générale (commune)
- Prix des produits (données factuelles)

❌ **NON collecté** : noms, adresses, moyens de paiement

## 🚀 Évolutions Futures

### Phase 1 : Actuel ✅
- [x] Extraction des informations de magasins depuis les tickets
- [x] Matching avec la base de données connue
- [x] Affichage sur la carte des magasins matchés

### Phase 2 : En cours ⏳
- [ ] Géocodage automatique des nouvelles adresses
- [ ] Interface de validation pour les nouveaux magasins
- [ ] Clustering des observations similaires

### Phase 3 : Planifié 📋
- [ ] ML pour améliorer le matching automatique
- [ ] Détection automatique des horaires d'ouverture depuis les tickets
- [ ] Enrichissement collaboratif par la communauté
- [ ] API de contribution externe

## 📝 Utilisation

### Pour les Développeurs

```javascript
// Obtenir les magasins d'un territoire avec les tickets
import { getStoresByTerritory } from './services/mapService';

const stores = await getStoresByTerritory('Guadeloupe');
// Retourne les magasins de la base + ceux découverts via tickets

// Obtenir seulement les magasins de la base
const storesOnly = await getStoresByTerritory('Guadeloupe', false);
```

### Pour les Contributeurs

1. **Scanner un ticket** via l'application
2. **Vérifier les informations** extraites
3. **Valider** les données du magasin
4. **Contribution automatique** à la carte

## 🎯 Impact

### Avant
- 27 magasins référencés
- Mise à jour manuelle uniquement
- Couverture limitée

### Après
- **27+ magasins** (base + découvertes)
- **Mise à jour automatique** via tickets
- **Couverture évolutive** avec chaque contribution
- **Validation continue** des données

## 📚 Documentation Technique

### Format des observations

```typescript
interface ReceiptObservation {
  territoire: string;           // Territoire DROM-COM
  commune?: string;             // Ville/commune du magasin
  enseigne: string;             // Nom de l'enseigne
  magasin_id?: string;          // ID unique du magasin (si disponible)
  date: string;                 // Date du ticket (YYYY-MM-DD)
  heure?: string;               // Heure du ticket (HH:MM:SS)
  produits: Product[];          // Liste des produits achetés
  total_ttc: number;            // Montant total TTC
  source: 'ticket_caisse';      // Source de l'observation
  fiabilite: string;            // Niveau de fiabilité
  verifie: boolean;             // Ticket vérifié ?
}
```

### Format des magasins enrichis

```typescript
interface EnrichedStore {
  // Informations de base
  id: string;
  name: string;
  chain: string;
  territory: string;
  city: string;
  
  // Coordonnées GPS
  lat: number;
  lon: number;
  
  // Métadonnées
  source: 'seed_data' | 'receipt_observation';
  observationCount?: number;     // Nombre de tickets observés
  lastObservation?: string;      // Date de la dernière observation
  hasReceiptObservations?: boolean; // A des observations de tickets
  
  // Informations complémentaires (si disponibles)
  address?: string;
  phone?: string;
  openingHours?: string;
  services?: string[];
}
```

## 🤝 Contribution

Pour ajouter un nouveau magasin via ticket :

1. Placer le fichier JSON dans `data/observations/`
2. Mettre à jour `data/observations/index.json`
3. S'assurer que les champs obligatoires sont remplis :
   - `territoire`
   - `enseigne`
   - `date`
   - `produits`

## ✅ Tests

```bash
# Tester l'extraction de magasins depuis les tickets
npm run test -- storeFromReceiptsService

# Vérifier que la carte charge correctement
npm run build
npm run dev
```

## 📞 Support

Pour toute question ou suggestion :
- Ouvrir une issue sur GitHub
- Consulter la documentation technique
- Contacter l'équipe de développement

---

**Note** : Ce système est en amélioration continue. Les feedbacks et contributions sont les bienvenus !
