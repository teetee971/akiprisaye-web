# Infrastructure des Comparateurs Citoyens

## Vue d'ensemble

Cette infrastructure fournit une base commune réutilisable pour créer rapidement des comparateurs citoyens ultramarins. Elle accélère le développement de nouveaux comparateurs de 70-80% en fournissant des composants, services et utilitaires pré-construits.

## Architecture

```
src/
├── types/
│   └── comparatorCommon.ts         # Types communs
├── utils/
│   ├── territoryMapper.ts          # Gestion des territoires
│   ├── priceCalculator.ts          # Calculs de prix
│   └── dataValidator.ts            # Validation de données
├── services/
│   ├── comparatorOcrService.ts     # Service OCR
│   ├── contributionService.ts      # Contributions citoyennes
│   └── alertService.ts             # Système d'alertes
├── hooks/
│   ├── useContribution.ts          # Hook contributions
│   ├── useOCR.ts                   # Hook OCR
│   └── useAlerts.ts                # Hook alertes
└── components/comparateurs/
    ├── UniversalComparatorLayout.tsx    # Layout universel
    ├── DataUploadZone.tsx               # Upload de fichiers
    ├── OCRScanner.tsx                   # Scanner OCR
    ├── ContributionForm.tsx             # Formulaire contribution
    ├── AlertSystem.tsx                  # Système d'alertes
    └── SolidaryBadge.tsx                # Badge solidaire
```

## Composants disponibles

### 1. UniversalComparatorLayout

Layout standardisé pour tous les comparateurs avec header, filtres, résultats et footer.

**Utilisation :**

```tsx
import { UniversalComparatorLayout } from '../components/comparateurs/UniversalComparatorLayout';
import { Plane } from 'lucide-react';

<UniversalComparatorLayout
  title="Comparateur de vols"
  icon={<Plane className="w-8 h-8" />}
  description="Comparez les prix des vols DOM ↔ Métropole"
  filters={<YourFiltersComponent />}
  results={<YourResultsComponent />}
  metadata={{
    lastUpdate: '2026-01-14',
    dataSource: 'API officielle + contributions citoyennes',
    methodology: 'Comparaison basée sur les observations réelles',
    totalEntries: 150,
    coverage: {
      territories: ['GP', 'MQ', 'RE'],
      percentage: 85,
    },
  }}
/>
```

### 2. DataUploadZone

Zone de drag & drop pour l'upload de fichiers (images, PDF).

**Utilisation :**

```tsx
import { DataUploadZone } from '../components/comparateurs/DataUploadZone';

<DataUploadZone
  acceptedTypes={['image/*', 'application/pdf']}
  maxSizeMB={10}
  onFilesSelected={(files) => handleFiles(files)}
  multiple={false}
  processingState="idle"
/>
```

### 3. OCRScanner

Scanner OCR avec parsing intelligent selon le type de document.

**Utilisation :**

```tsx
import { OCRScanner } from '../components/comparateurs/OCRScanner';

<OCRScanner
  documentType="invoice"
  onTextExtracted={(text, structured) => {
    console.log('Texte:', text);
    console.log('Données structurées:', structured);
  }}
  language="fra"
  allowEdit={true}
/>
```

**Types de documents supportés :**
- `invoice` : Factures (extrait fournisseur, montant, date, items)
- `receipt` : Tickets de caisse (extrait magasin, items, prix, total)
- `list` : Listes (ligne par ligne)
- `id_card` : Cartes d'identité
- `generic` : Document générique

### 4. ContributionForm

Formulaire générique pour contributions citoyennes.

**Utilisation :**

```tsx
import { ContributionForm } from '../components/comparateurs/ContributionForm';

const fields = [
  {
    name: 'productName',
    type: 'text',
    label: 'Nom du produit',
    required: true,
    placeholder: 'Ex: Pain de mie',
  },
  {
    name: 'price',
    type: 'number',
    label: 'Prix observé',
    required: true,
    placeholder: '0.00',
  },
  {
    name: 'territory',
    type: 'territory',
    label: 'Territoire',
    required: true,
  },
];

<ContributionForm
  comparatorType="products"
  fields={fields}
  onSubmit={async (data) => {
    await submitContribution(data);
  }}
  requireProof={true}
  allowAnonymous={true}
/>
```

### 5. AlertSystem

Interface de gestion des alertes utilisateur.

**Utilisation :**

```tsx
import { AlertSystem } from '../components/comparateurs/AlertSystem';

<AlertSystem
  userId="user-123"
  comparatorType="flights"
  availableAlertTypes={[
    {
      id: 'price_threshold',
      name: 'Seuil de prix',
      description: 'Alerte quand le prix franchit un seuil',
    },
  ]}
/>
```

### 6. SolidaryBadge

Badge visuel pour identifier produits/services solidaires.

**Utilisation :**

```tsx
import { SolidaryBadge } from '../components/comparateurs/SolidaryBadge';

<SolidaryBadge type="local" size="medium" showTooltip={true} />
<SolidaryBadge type="fair_trade" label="Commerce équitable" />
<SolidaryBadge type="social" size="small" />
```

**Types disponibles :**
- `local` 🌿 : Produit local
- `fair_trade` 🤝 : Commerce équitable
- `social` 🎗️ : Économie solidaire
- `public` 🏛️ : Service public
- `free` 🆓 : Gratuit
- `eco` ♻️ : Écologique

## Services

### ocrService (comparatorOcrService.ts)

Service d'extraction de texte avec parsing intelligent.

```tsx
import { processDocument, parseInvoice, parseList } from '../services/comparatorOcrService';

// Traiter un document
const result = await processDocument(file, 'invoice', 'fra');
console.log(result.text); // Texte brut
console.log(result.structured); // Données structurées

// Parser manuellement
const invoiceData = parseInvoice(rawText);
const items = parseList(rawText);
```

### alertService.ts

Gestion des alertes utilisateur.

```tsx
import { createAlert, getUserAlerts, updateAlert, deleteAlert } from '../services/alertService';

// Créer une alerte
const alert = await createAlert({
  userId: 'user-123',
  comparatorType: 'flights',
  type: 'price_threshold',
  territory: 'GP',
  conditions: { threshold: 500, operator: 'below' },
  notificationMethod: 'email',
  active: true,
  label: 'Vol < 500€',
});

// Récupérer les alertes
const alerts = await getUserAlerts('user-123');

// Mettre à jour
await updateAlert(alert.id, { active: false });

// Supprimer
await deleteAlert(alert.id);
```

### contributionService.ts

Service existant pour les contributions citoyennes (photos, prix, produits manquants).

## Hooks

### useContribution

```tsx
import { useContribution } from '../hooks/useContribution';

const { submitPhoto, submitPrice, loading, error, success } = useContribution('products');

await submitPhoto(photoContribution, userId);
await submitPrice(priceObservation, userId);
```

### useOCR

```tsx
import { useOCR } from '../hooks/useOCR';

const { processFile, processing, result, error, progress } = useOCR();

const ocrResult = await processFile(file, 'invoice', 'fra');
```

### useAlerts

```tsx
import { useAlerts } from '../hooks/useAlerts';

const { 
  alerts, 
  statistics, 
  createAlert, 
  updateAlert, 
  deleteAlert, 
  toggleAlertStatus 
} = useAlerts('user-123');
```

## Utilitaires

### territoryMapper.ts

```tsx
import { 
  TERRITORIES, 
  getTerritoryByCode, 
  getTerritoryLabel,
  getAllTerritories 
} from '../utils/territoryMapper';

const gp = getTerritoryByCode('GP');
console.log(gp.name); // "Guadeloupe"

const label = getTerritoryLabel('MQ'); // "Martinique"
const all = getAllTerritories(); // Tous les territoires
```

### priceCalculator.ts

```tsx
import { 
  comparePrices, 
  calculateSavings, 
  formatPrice,
  calculatePricePerUnit 
} from '../utils/priceCalculator';

const comparison = comparePrices([10, 15, 12, 18]);
// { min: 10, max: 18, average: 13.75, median: 13.5, range: 8, rangePercentage: 80 }

const savings = calculateSavings(15, 10);
// { absolute: 5, percentage: 50 }

const formatted = formatPrice(12.50); // "12,50 €"
```

### dataValidator.ts

```tsx
import { 
  validateContribution, 
  validatePrice, 
  validateFile,
  sanitizeInput 
} from '../utils/dataValidator';

const result = validateContribution(data, rules);
if (!result.valid) {
  console.log(result.errors);
}

const isValid = validatePrice(10.50); // true
const fileValidation = validateFile(file, 10, ['image/*']);
```

## Types communs

```tsx
import type { 
  Territory, 
  ComparatorMetadata, 
  Alert, 
  ContributionData,
  OCRResult 
} from '../types/comparatorCommon';
```

## Exemple complet : Créer un nouveau comparateur

```tsx
import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { UniversalComparatorLayout } from '../components/comparateurs/UniversalComparatorLayout';
import { ContributionForm } from '../components/comparateurs/ContributionForm';
import { SolidaryBadge } from '../components/comparateurs/SolidaryBadge';
import type { ContributionField } from '../types/comparatorCommon';

const NewComparator: React.FC = () => {
  const [results, setResults] = useState([]);

  const fields: ContributionField[] = [
    { name: 'productName', type: 'text', label: 'Produit', required: true },
    { name: 'price', type: 'number', label: 'Prix', required: true },
    { name: 'territory', type: 'territory', label: 'Territoire', required: true },
  ];

  return (
    <UniversalComparatorLayout
      title="Comparateur de prix"
      icon={<ShoppingCart className="w-8 h-8" />}
      description="Comparez les prix des produits de grande consommation"
      filters={
        <div>
          {/* Vos filtres ici */}
        </div>
      }
      results={
        <div>
          {results.map((item, i) => (
            <div key={i} className="bg-slate-800 p-4 rounded-lg">
              <h3>{item.name}</h3>
              <p>{item.price}€</p>
              {item.isLocal && <SolidaryBadge type="local" />}
            </div>
          ))}
        </div>
      }
      metadata={{
        lastUpdate: new Date().toISOString(),
        dataSource: 'Contributions citoyennes',
        methodology: 'Prix observés et vérifiés par les citoyens',
        totalEntries: results.length,
      }}
    >
      {/* Section contributions */}
      <section className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-5">
        <h2 className="text-xl font-bold text-gray-100 mb-4">
          Contribuer
        </h2>
        <ContributionForm
          comparatorType="products"
          fields={fields}
          onSubmit={async (data) => {
            console.log('Nouvelle contribution:', data);
          }}
          requireProof={true}
        />
      </section>
    </UniversalComparatorLayout>
  );
};

export default NewComparator;
```

## Bonnes pratiques

### 1. Réutilisabilité
- Utilisez `UniversalComparatorLayout` pour tous les comparateurs
- Composez les composants existants plutôt que de les dupliquer
- Partagez les types communs

### 2. Types TypeScript
- Toujours typer strictement (pas de `any`)
- Utiliser les types de `comparatorCommon.ts`
- Documenter les props avec JSDoc

### 3. Accessibilité
- Ajouter les labels ARIA appropriés
- Support clavier complet
- Contrastes de couleurs respectés

### 4. Performance
- Lazy loading pour les composants lourds
- Mémorisation avec `useMemo` et `useCallback`
- Pagination pour grandes listes

### 5. Mobile
- Design mobile-first
- Touch-friendly (boutons ≥ 44px)
- Responsive breakpoints

## Compatibilité

- ✅ React 18+
- ✅ TypeScript 5+
- ✅ Tailwind CSS 4+
- ✅ Dark mode
- ✅ Mobile / Desktop
- ✅ Firebase (contributions et alertes)
- ✅ Tesseract.js (OCR)

## Prochaines étapes

Pour étendre l'infrastructure :

1. **MapView Component** : Carte interactive avec Leaflet pour visualiser géographiquement les données
2. **Graphiques avancés** : Composants de visualisation réutilisables
3. **Export de données** : CSV, PDF, Excel
4. **Notifications push** : Intégration Firebase Cloud Messaging
5. **Mode hors-ligne** : PWA avec cache local

## Support

Pour toute question ou amélioration, créer une issue GitHub ou contacter l'équipe de développement.

## Licence

Voir LICENSE.md
