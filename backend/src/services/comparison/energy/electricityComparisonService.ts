/**
 * ElectricityComparisonService - Comparateur citoyen d'électricité
 * Version: 1.6.1
 * 
 * Conformité:
 * - Lecture seule - Données observées uniquement
 * - Aucune recommandation - Classement objectif
 * - Multi-territoires - Historique temporel
 * - Sources traçables
 * 
 * Données observées:
 * - Prix TTC (€/kWh ou abonnement mensuel)
 * - Puissance souscrite (kVA)
 * - Option tarifaire (base, heures creuses)
 * - Territoire
 * - Date d'observation
 * - Source
 */

import { ServiceComparisonCore } from '../ServiceComparisonCore.js';
import {
  ServiceOffer,
  ServiceFilters,
  Territory,
  DataSource,
} from '../types.js';

/**
 * Spécifications d'une offre électrique
 */
export interface ElectricitySpecifications {
  /** Puissance souscrite en kVA (3, 6, 9, 12, 15, etc.) */
  powerSubscribed: number;
  /** Option tarifaire */
  tariffOption: 'base' | 'heures_creuses' | 'tempo' | 'ejp';
  /** Prix de l'abonnement mensuel TTC en € */
  subscriptionPriceMonthly: number;
  /** Prix du kWh TTC en € (heures pleines ou base) */
  pricePerKwhPeak: number;
  /** Prix du kWh TTC en € heures creuses (si applicable) */
  pricePerKwhOffPeak?: number;
  /** Type de compteur */
  meterType?: 'classique' | 'linky';
  /** Engagement (en mois) */
  commitmentMonths?: number;
}

/**
 * Filtres spécifiques pour l'électricité
 */
export interface ElectricityFilters extends Omit<ServiceFilters, 'specificFilters'> {
  /** Puissance souscrite */
  powerSubscribed?: number;
  /** Option tarifaire */
  tariffOption?: ElectricitySpecifications['tariffOption'];
  /** Consommation annuelle estimée en kWh (pour calcul coût total) */
  estimatedAnnualConsumption?: number;
}

/**
 * Shape of each entry in the services-prices.json data file
 * published by the auto-scraper pipeline.
 */
interface ServicesPriceEntry {
  type?: string;
  provider?: string;
  territory?: string;
  pricePerKwh?: number;
  subscriptionMonthly?: number;
  tariffOption?: string;
  powerKva?: number;
  validFrom?: string;
  source?: string;
}

/** URL of the published services data (set via SERVICES_DATA_URL env var or falls back to GitHub Pages). */
const SERVICES_DATA_URL =
  process.env.SERVICES_DATA_URL ??
  'https://teetee971.github.io/akiprisaye-web/data/services-prices.json';

/** In-memory cache to avoid re-fetching within the same process lifetime. */
let productionOfferCache: ServiceOffer[] | null = null;
let productionOfferCacheTs = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch electricity offers from the published services-prices.json file.
 * Results are cached in memory for CACHE_TTL_MS milliseconds.
 */
async function fetchProductionOffers(): Promise<ServiceOffer[]> {
  const now = Date.now();
  if (productionOfferCache !== null && now - productionOfferCacheTs < CACHE_TTL_MS) {
    return productionOfferCache;
  }

  try {
    const res = await fetch(SERVICES_DATA_URL, {
      headers: { 'User-Agent': 'AKiPriSaYe-backend/1.0' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`[ElectricityService] services data fetch failed: HTTP ${res.status}`);
      return productionOfferCache ?? [];
    }

    const raw = (await res.json()) as ServicesPriceEntry[];
    const entries = Array.isArray(raw) ? raw : [];

    const offers: ServiceOffer[] = entries
      .filter((e) => e.type === 'electricity' && e.provider && e.territory)
      .map((e, idx): ServiceOffer => {
        const specs: ElectricitySpecifications = {
          powerSubscribed: e.powerKva ?? 6,
          tariffOption: (e.tariffOption as ElectricitySpecifications['tariffOption']) ?? 'base',
          subscriptionPriceMonthly: e.subscriptionMonthly ?? 0,
          pricePerKwhPeak: e.pricePerKwh ?? 0,
        };

        const estimatedMonthlyCost =
          specs.subscriptionPriceMonthly + (5000 / 12) * specs.pricePerKwhPeak;

        return {
          id: `elec-${e.territory}-${e.provider}-${idx}`.replace(/\s+/g, '-').toLowerCase(),
          providerName: e.provider!,
          offerName: `${e.provider} – ${e.tariffOption ?? 'base'} ${e.powerKva ?? 6} kVA`,
          priceIncludingTax: Math.round(estimatedMonthlyCost * 100) / 100,
          territory: e.territory! as Territory,
          specifications: specs as unknown as Record<string, string | number | boolean>,
          source: (e.source ?? 'CRE') as unknown as DataSource,
          validFrom: e.validFrom ? new Date(e.validFrom) : new Date(),
        };
      });

    productionOfferCache = offers;
    productionOfferCacheTs = now;
    return offers;
  } catch (err) {
    console.error('[ElectricityService] failed to load production offers:', err);
    return productionOfferCache ?? [];
  }
}

export class ElectricityComparisonService extends ServiceComparisonCore {
  private static instance: ElectricityComparisonService;
  private mockData: ServiceOffer[] = [];

  private constructor() {
    super('electricity');
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): ElectricityComparisonService {
    if (!ElectricityComparisonService.instance) {
      ElectricityComparisonService.instance = new ElectricityComparisonService();
    }
    return ElectricityComparisonService.instance;
  }

  /**
   * Override mock data (used in tests / local development).
   * When set, production data fetch is bypassed.
   */
  public setMockData(offers: ServiceOffer[]): void {
    this.mockData = offers;
  }

  /**
   * Récupère les offres depuis la source de données.
   * En production, charge depuis services-prices.json (scraper pipeline).
   * En test/dev, utilise les données mock injectées via setMockData().
   */
  protected async fetchOffers(filters: ServiceFilters): Promise<ServiceOffer[]> {
    let offers = this.mockData.length > 0
      ? [...this.mockData]
      : await fetchProductionOffers();

    // Filtrage par territoire
    if (filters.territories && filters.territories.length > 0) {
      offers = offers.filter((o) => filters.territories!.includes(o.territory));
    }

    // Filtrage par prix
    if (filters.minPrice !== undefined) {
      offers = offers.filter((o) => o.priceIncludingTax >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      offers = offers.filter((o) => o.priceIncludingTax <= filters.maxPrice!);
    }

    // Filtrage par date
    if (filters.startDate) {
      offers = offers.filter((o) => o.validFrom >= filters.startDate!);
    }
    if (filters.endDate) {
      offers = offers.filter(
        (o) => !o.validUntil || o.validUntil <= filters.endDate!,
      );
    }

    // Filtres spécifiques à l'électricité
    if (filters.specificFilters) {
      const electricityFilters = filters.specificFilters as Partial<ElectricityFilters>;

      if (electricityFilters.powerSubscribed !== undefined) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as ElectricitySpecifications;
          return specs.powerSubscribed === electricityFilters.powerSubscribed;
        });
      }

      if (electricityFilters.tariffOption) {
        offers = offers.filter((o) => {
          const specs = o.specifications as unknown as ElectricitySpecifications;
          return specs.tariffOption === electricityFilters.tariffOption;
        });
      }
    }

    // Validation des offres
    offers = offers.filter((o) => this.validateOffer(o));

    return offers;
  }

  /**
   * Calcule le coût annuel estimé d'une offre
   * Basé sur une consommation annuelle en kWh
   */
  public calculateAnnualCost(
    offer: ServiceOffer,
    annualConsumptionKwh: number,
  ): number {
    const specs = offer.specifications as unknown as ElectricitySpecifications;

    // Coût de l'abonnement annuel
    const subscriptionCost = specs.subscriptionPriceMonthly * 12;

    // Coût de la consommation
    let consumptionCost = 0;

    if (specs.tariffOption === 'heures_creuses' && specs.pricePerKwhOffPeak) {
      // Approximation: 60% heures pleines, 40% heures creuses
      consumptionCost =
        annualConsumptionKwh * 0.6 * specs.pricePerKwhPeak +
        annualConsumptionKwh * 0.4 * specs.pricePerKwhOffPeak;
    } else {
      // Base ou autres options
      consumptionCost = annualConsumptionKwh * specs.pricePerKwhPeak;
    }

    return Math.round((subscriptionCost + consumptionCost) * 100) / 100;
  }

  /**
   * Compare les offres avec un coût annuel estimé
   * Utile pour classifier selon la consommation réelle
   */
  public async compareWithEstimatedCost(
    territory: Territory,
    annualConsumptionKwh: number,
    filters?: ElectricityFilters,
  ) {
    const result = await this.compareOffers(territory, filters);

    // Ajouter le coût annuel estimé à chaque offre classée
    const rankedWithEstimatedCost = result.rankedOffers.map((offer) => ({
      ...offer,
      estimatedAnnualCost: this.calculateAnnualCost(offer, annualConsumptionKwh),
    }));

    return {
      ...result,
      rankedOffers: rankedWithEstimatedCost,
      metadata: {
        ...result.metadata,
        estimatedAnnualConsumption: annualConsumptionKwh,
      },
    };
  }
}

/**
 * Helper pour créer une offre électrique
 * Utile pour les tests et le développement
 */
export function createElectricityOffer(
  id: string,
  providerName: string,
  offerName: string,
  territory: Territory,
  specifications: ElectricitySpecifications,
  source: DataSource,
  validFrom: Date = new Date(),
): ServiceOffer {
  // Le prix affiché est le coût mensuel moyen pour un usage standard
  // (abonnement + consommation de 5000 kWh/an)
  const estimatedMonthlyCost =
    specifications.subscriptionPriceMonthly +
    ((5000 / 12) * specifications.pricePerKwhPeak);

  return {
    id,
    providerName,
    offerName,
    priceIncludingTax: Math.round(estimatedMonthlyCost * 100) / 100,
    territory,
    specifications: specifications as unknown as Record<string, string | number | boolean>,
    source,
    validFrom,
  };
}


