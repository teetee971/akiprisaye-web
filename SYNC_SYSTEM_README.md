# Système de Synchronisation Automatique

## 📋 Vue d'ensemble

Ce système permet la synchronisation automatique des données de produits et de prix depuis les sources externes OpenFoodFacts et OpenPrices.

## 🗂️ Structure des fichiers

```
frontend/src/
├── services/sync/
│   ├── types.ts                    # Types et interfaces TypeScript
│   ├── openFoodFactsService.ts     # Service API OpenFoodFacts
│   ├── openPricesService.ts        # Service API OpenPrices
│   ├── conflictResolver.ts         # Résolution de conflits et déduplication
│   ├── syncLogger.ts               # Logging des synchronisations
│   ├── syncScheduler.ts            # Planificateur de tâches
│   └── index.ts                    # Exports centralisés
│
├── pages/admin/sync/
│   └── SyncDashboard.tsx           # Dashboard admin de synchronisation
│
└── components/admin/sync/
    ├── SyncStats.tsx               # Statistiques de sync
    ├── SyncHistory.tsx             # Historique des syncs
    ├── SyncConfig.tsx              # Configuration du scheduler
    └── ManualSync.tsx              # Synchronisation manuelle
```

## 🚀 Fonctionnalités

### 1. Service OpenFoodFacts

Le service `openFoodFactsService` permet de :

- Récupérer un produit par code-barres (EAN)
- Rechercher des produits
- Synchroniser des produits en masse
- Mapper les données OFF vers le modèle local

**Exemple d'utilisation :**

```typescript
import { openFoodFactsService } from './services/sync';

// Récupérer un produit
const product = await openFoodFactsService.getProductByBarcode('3017620422003');

// Rechercher des produits
const products = await openFoodFactsService.searchProducts('Nutella');

// Synchronisation en masse
const result = await openFoodFactsService.bulkSync(['ean1', 'ean2', 'ean3']);
```

### 2. Service OpenPrices

Le service `openPricesService` permet de :

- Récupérer les prix d'un produit
- Récupérer les prix par localisation
- Filtrer par territoire DOM-TOM
- Synchronisation complète

**Exemple d'utilisation :**

```typescript
import { openPricesService } from './services/sync';

// Récupérer les prix d'un produit
const prices = await openPricesService.getPricesByProduct('3017620422003');

// Synchronisation complète
const result = await openPricesService.fullSync();
```

### 3. Résolution de conflits

Le service `conflictResolverService` gère :

- Détection de doublons
- Calcul de similarité entre produits
- Fusion intelligente des données
- Stratégies de résolution (local_wins, remote_wins, newest_wins, manual)

**Exemple d'utilisation :**

```typescript
import { conflictResolverService } from './services/sync';

// Résoudre un conflit
const resolved = conflictResolverService.resolveConflict(
  localProduct,
  remoteProduct,
  'newest_wins'
);

// Dédupliquer une liste
const unique = conflictResolverService.deduplicateProducts(products);
```

### 4. Logging

Le service `syncLoggerService` enregistre :

- Logs de synchronisation dans localStorage
- Statistiques (taux de réussite, durée moyenne)
- Historique des 100 derniers logs

**Exemple d'utilisation :**

```typescript
import { syncLoggerService } from './services/sync';

// Créer un log
const log = syncLoggerService.createSyncLog('job-id');

// Marquer comme complété
syncLoggerService.completeSyncLog(log.id, result);

// Obtenir les statistiques
const stats = syncLoggerService.getLogsStats();
```

### 5. Scheduler

Le service `syncSchedulerService` gère :

- 3 jobs planifiés par défaut :
  - `sync-off-products`: Sync OpenFoodFacts (2h du matin)
  - `sync-op-prices`: Sync OpenPrices (toutes les 6h)
  - `cleanup-old-prices`: Nettoyage (dimanche à 3h)
- Exécution manuelle
- Configuration des intervalles
- Retry automatique

**Exemple d'utilisation :**

```typescript
import { syncSchedulerService } from './services/sync';

// Exécuter un job manuellement
await syncSchedulerService.runJobManually('sync-op-prices');

// Configurer le scheduler
syncSchedulerService.setSchedulerConfig({
  maxRetries: 5,
  retryDelayMs: 3000,
});
```

## 🖥️ Dashboard Admin

Le dashboard de synchronisation est accessible à l'URL `/admin/sync`.

### Onglets disponibles :

1. **Vue d'ensemble**
   - Statistiques globales
   - Statut des jobs planifiés
   - Synchronisation manuelle

2. **Historique**
   - Liste complète des synchronisations
   - Détails des résultats
   - Erreurs éventuelles

3. **Configuration**
   - Intervalles de synchronisation (cron)
   - Limites (max produits/prix)
   - Retry et notifications

## ⚙️ Configuration

### Configuration par défaut :

```typescript
{
  productsSyncInterval: '0 2 * * *',    // 2h du matin
  pricesSyncInterval: '0 */6 * * *',    // Toutes les 6h
  maxProductsPerSync: 1000,
  maxPricesPerSync: 5000,
  maxRetries: 3,
  retryDelayMs: 5000,
  notifyOnError: true,
  notifyOnComplete: false,
}
```

## 🔒 Rate Limiting

Les services respectent les rate limits des API externes :

- **OpenFoodFacts**: 600ms entre chaque requête (≈100 req/min max)
  - Note: Ce délai inclut une marge de sécurité pour la latence réseau
  - En production, monitorer et ajuster si nécessaire selon charge
- **OpenPrices**: 500ms entre chaque requête
  - Note: L'API OpenPrices n'a pas de limite documentée stricte
  - Ce délai conservateur assure une utilisation respectueuse

## 🎯 Territoires DOM-TOM

Les territoires supportés :

- Guadeloupe
- Martinique
- Guyane
- Réunion
- Mayotte

## 📊 Types de données

### SyncResult

```typescript
interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // ms
}
```

### Product

```typescript
interface Product {
  id?: string;
  ean: string;
  nom: string;
  marque?: string;
  categorie?: string;
  contenance?: number;
  unite?: string;
  imageUrl?: string;
  metadata?: {
    nutriscore?: string;
    ecoscore?: string;
    source?: string;
    lastSync?: string;
    manuallyEdited?: boolean;
  };
}
```

## 🔧 Développement futur

### Backend (à implémenter)

Pour une version production complète, il est recommandé d'ajouter :

1. **Backend Node.js avec cron jobs**
   ```
   backend/src/jobs/
   ├── syncOpenFoodFactsJob.ts
   ├── syncOpenPricesJob.ts
   └── scheduler.ts
   ```

2. **Base de données**
   - Table `products` pour les produits
   - Table `prices` pour les prix
   - Table `sync_logs` pour l'historique

3. **API endpoints**
   ```
   GET  /api/sync/jobs          - Liste des jobs
   POST /api/sync/jobs/:id/run  - Exécuter un job
   GET  /api/sync/logs          - Historique
   GET  /api/sync/stats         - Statistiques
   ```

4. **Notifications**
   - Email en cas d'erreur
   - Webhook Slack
   - Dashboard temps réel

## 📝 Notes importantes

1. **localStorage**: Les données sont actuellement stockées dans le localStorage du navigateur. En production, utiliser une vraie base de données.

2. **Scheduler frontend**: Le scheduler actuel est côté client (frontend). Pour une vraie planification automatique, implémenter un scheduler backend avec node-cron ou Cloudflare Workers Cron Triggers.

3. **Sécurité**: Ajouter une vraie vérification de rôle admin pour accéder au dashboard.

4. **Tests**: Ajouter des tests unitaires pour chaque service.

## 🧪 Tests manuels

Pour tester le système :

1. Accéder à `/admin/sync`
2. Onglet "Vue d'ensemble" > Synchronisation manuelle
3. Entrer un EAN (ex: `3017620422003` pour Nutella)
4. Cliquer sur "Sync Produit" ou "Sync Prix"
5. Vérifier les résultats et l'historique

## 🤝 Contribution

Pour contribuer au système de synchronisation :

1. Suivre la structure existante
2. Ajouter des tests pour les nouvelles fonctionnalités
3. Respecter les rate limits des API externes
4. Documenter les changements

## 📚 Ressources

- [OpenFoodFacts API](https://world.openfoodfacts.org/data)
- [OpenPrices API](https://prices.openfoodfacts.org/api/docs)
- [Cron expressions](https://crontab.guru/)
