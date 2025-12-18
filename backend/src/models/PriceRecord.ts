// backend/src/models/PriceRecord.ts
/**
 * PriceRecord Model
 * 
 * Represents a price observation from official sources
 * ONLY official data sources allowed (INSEE, OPMR, DGCCRF, data.gouv.fr)
 */

export interface PriceRecord {
  id: string;
  ean: string; // European Article Number
  productName: string;
  price: number; // Price in euros
  unit: string; // e.g., "€/kg", "€/unité", "€/litre"
  
  // Source tracking - MANDATORY for transparency
  source: 'INSEE' | 'OPMR' | 'DGCCRF' | 'DATA_GOUV' | 'OPEN_FOOD_FACTS';
  sourceUrl?: string;
  sourceDate: Date; // Date when source published the data
  
  // Location
  territory: string; // Territory code (GP, MQ, GF, RE, YT, etc.)
  storeId?: string; // Optional store identifier
  storeName?: string;
  storeChain?: string; // e.g., "Carrefour", "Leader Price"
  
  // Metadata
  collectedAt: Date; // When we collected this data
  validUntil?: Date; // When this price is expected to be outdated
  
  // Validation
  isVerified: boolean; // Manual verification by admin
  confidence: number; // Confidence score 0-100
  
  // Additional info
  promotion?: boolean;
  promotionDetails?: string;
  notes?: string;
}

export interface PriceQuery {
  ean?: string;
  productName?: string;
  territory?: string;
  storeChain?: string;
  source?: PriceRecord['source'];
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export interface PriceComparison {
  product: {
    ean: string;
    name: string;
  };
  territory: string;
  prices: Array<{
    store: string;
    chain: string;
    price: number;
    unit: string;
    distance?: number; // in km
    lastUpdate: Date;
    source: string;
  }>;
  statistics: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  bestDeal: {
    store: string;
    price: number;
    savings: number; // vs average
    savingsPercent: number;
  };
}

/**
 * In-memory storage for development
 * In production: Replace with PostgreSQL queries
 */
class PriceRecordStore {
  private records: Map<string, PriceRecord> = new Map();

  async create(record: Omit<PriceRecord, 'id' | 'collectedAt'>): Promise<PriceRecord> {
    const newRecord: PriceRecord = {
      ...record,
      id: `price_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      collectedAt: new Date(),
    };
    
    this.records.set(newRecord.id, newRecord);
    return newRecord;
  }

  async findById(id: string): Promise<PriceRecord | null> {
    return this.records.get(id) || null;
  }

  async findByQuery(query: PriceQuery): Promise<PriceRecord[]> {
    let results = Array.from(this.records.values());

    if (query.ean) {
      results = results.filter(r => r.ean === query.ean);
    }

    if (query.territory) {
      results = results.filter(r => r.territory === query.territory);
    }

    if (query.source) {
      results = results.filter(r => r.source === query.source);
    }

    if (query.storeChain) {
      results = results.filter(r => r.storeChain?.toLowerCase().includes(query.storeChain!.toLowerCase()));
    }

    if (query.minPrice !== undefined) {
      results = results.filter(r => r.price >= query.minPrice!);
    }

    if (query.maxPrice !== undefined) {
      results = results.filter(r => r.price <= query.maxPrice!);
    }

    // Sort by date (most recent first)
    results.sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return results.slice(offset, offset + limit);
  }

  async update(id: string, updates: Partial<PriceRecord>): Promise<PriceRecord | null> {
    const existing = this.records.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.records.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }

  async getLatestByEAN(ean: string, territory?: string): Promise<PriceRecord | null> {
    const query: PriceQuery = { ean, territory, limit: 1 };
    const results = await this.findByQuery(query);
    return results[0] || null;
  }
}

export const priceRecordStore = new PriceRecordStore();
export default PriceRecordStore;
