 
/**
 * Types et interfaces pour le système de synchronisation
 */

// ============================================
// OpenFoodFacts Types
// ============================================

export interface OFFProduct {
  code: string; // EAN
  product_name: string; // Nom
  brands: string; // Marque
  categories_tags: string[]; // Catégories
  quantity: string; // Contenance (ex: "500 g")
  image_url: string; // Image principale
  image_small_url: string; // Thumbnail
  nutriscore_grade?: string; // Nutri-Score
  ecoscore_grade?: string; // Eco-Score
  ingredients_text?: string; // Ingrédients
  allergens_tags?: string[]; // Allergènes
  countries_tags?: string[]; // Pays de vente
}

export interface OFFSearchOptions {
  page?: number;
  page_size?: number;
  country?: string;
  categories?: string[];
  brands?: string[];
}

export interface OFFSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OFFProduct[];
}

// ============================================
// OpenPrices Types
// ============================================

export interface OPPrice {
  product_code: string; // EAN
  price: number; // Prix
  currency: string; // EUR
  location_osm_id: number; // ID OpenStreetMap
  location_osm_type: string; // node/way/relation
  date: string; // Date observation
  proof_id?: number; // ID preuve (ticket)
}

export interface PriceOptions {
  location?: string;
  country?: string;
  limit?: number;
  offset?: number;
}

export interface Territory {
  name: string;
  bounds: {
    lat: [number, number];
    lon: [number, number];
  };
}

// Territoires DOM-TOM
export const DOM_TOM_TERRITORIES: Record<string, Territory> = {
  guadeloupe: {
    name: 'Guadeloupe',
    bounds: { lat: [15.8, 16.6], lon: [-61.9, -60.8] }
  },
  martinique: {
    name: 'Martinique',
    bounds: { lat: [14.3, 14.9], lon: [-61.3, -60.8] }
  },
  guyane: {
    name: 'Guyane',
    bounds: { lat: [2.0, 6.0], lon: [-54.6, -51.6] }
  },
  reunion: {
    name: 'Réunion',
    bounds: { lat: [-21.4, -20.8], lon: [55.2, 55.9] }
  },
  mayotte: {
    name: 'Mayotte',
    bounds: { lat: [-13.1, -12.6], lon: [44.9, 45.4] }
  }
};

// ============================================
// Sync Types
// ============================================

export interface SyncResult {
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

export interface BulkSyncResult extends SyncResult {
  totalItems: number;
  batches: number;
  batchResults: SyncResult[];
}

export interface Product {
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
    [key: string]: any;
  };
}

export interface ProductWithPrice extends Product {
  prix?: number;
  magasin?: string;
  territoire?: string;
  dateObservation?: string;
}

// ============================================
// Scheduler Types
// ============================================

export interface SyncSchedulerConfig {
  productsSyncInterval: string; // Cron: "0 2 * * *" (2h du matin)
  pricesSyncInterval: string; // Cron: "0 */6 * * *" (toutes les 6h)
  maxProductsPerSync: number; // 1000
  maxPricesPerSync: number; // 5000
  maxRetries: number; // 3
  retryDelayMs: number; // 5000
  notifyOnError: boolean;
  notifyOnComplete: boolean;
}

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error';
  lastResult?: SyncResult;
  enabled: boolean;
}

export type JobHandler = () => Promise<SyncResult>;

export interface JobDefinition {
  id: string;
  name: string;
  schedule: string;
  handler: JobHandler;
  description?: string;
}

// ============================================
// Conflict Resolution Types
// ============================================

export type ConflictStrategy = 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';

export interface ConflictResolution {
  strategy: ConflictStrategy;
  compareFields: string[];
  deduplicationThreshold: number; // 0.85 (85%)
}

export interface SyncLog {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  result?: SyncResult;
  error?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// Utility Types
// ============================================

export interface QuantityParsed {
  value: number;
  unit: string;
}

export interface SyncStats {
  totalProducts: number;
  totalPrices: number;
  lastProductSync?: Date;
  lastPriceSync?: Date;
  syncInProgress: boolean;
}
