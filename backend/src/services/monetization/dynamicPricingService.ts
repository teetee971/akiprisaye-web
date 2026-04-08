/**
 * Dynamic Pricing Service
 *
 * Moteur de tarification dynamique : remises volume, saisonnalité, géographie, horaires.
 * Applique des modificateurs de prix selon les règles configurées.
 */

export type PricingRuleType = 'volume' | 'seasonal' | 'geographic' | 'time';

export interface PricingRule {
  id: string;
  name: string;
  type: PricingRuleType;
  modifier: number;   // multiplier: 1.2 = +20%, 0.8 = -20%
  conditions: Record<string, unknown>;
  isActive: boolean;
  priority: number;
}

export interface PricingContext {
  volumeMonthly?: number;  // API calls this month
  territory?: string;
  hourOfDay?: number;      // 0–23
  month?: number;          // 1–12
  planKey?: string;
}

const BUILT_IN_RULES: PricingRule[] = [
  // Volume discounts
  {
    id: 'volume-10k',
    name: 'Remise Volume 10k',
    type: 'volume',
    modifier: 0.80,
    conditions: { minMonthlyVolume: 10000 },
    isActive: true,
    priority: 1,
  },
  {
    id: 'volume-50k',
    name: 'Remise Volume 50k',
    type: 'volume',
    modifier: 0.60,
    conditions: { minMonthlyVolume: 50000 },
    isActive: true,
    priority: 2,
  },
  // Seasonal pricing
  {
    id: 'seasonal-christmas',
    name: 'Majoration Fêtes',
    type: 'seasonal',
    modifier: 1.20,
    conditions: { months: [11, 12] },  // Nov–Dec
    isActive: true,
    priority: 3,
  },
  {
    id: 'seasonal-back-to-school',
    name: 'Majoration Rentrée',
    type: 'seasonal',
    modifier: 1.15,
    conditions: { months: [8, 9] },  // Aug–Sep
    isActive: true,
    priority: 3,
  },
  {
    id: 'seasonal-black-friday',
    name: 'Promo Black Friday',
    type: 'seasonal',
    modifier: 0.90,
    conditions: { months: [11], days: [25, 26, 27, 28, 29] },
    isActive: false, // enabled manually
    priority: 4,
  },
  // Geographic pricing
  {
    id: 'geo-dom-tom',
    name: 'Majoration DOM-TOM',
    type: 'geographic',
    modifier: 1.30,
    conditions: { territories: ['re', 'gp', 'mq', 'gf', 'yt', 'pm', 'nc', 'pf', 'wf', 'tf'] },
    isActive: true,
    priority: 2,
  },
  // Time-based pricing
  {
    id: 'time-peak',
    name: 'Heure de pointe (19h–21h)',
    type: 'time',
    modifier: 1.20,
    conditions: { hours: [19, 20, 21] },
    isActive: false, // can be enabled
    priority: 1,
  },
  {
    id: 'time-offpeak',
    name: 'Creux de nuit (3h–6h)',
    type: 'time',
    modifier: 0.70,
    conditions: { hours: [3, 4, 5, 6] },
    isActive: false,
    priority: 1,
  },
];

export class DynamicPricingService {
  /**
   * Apply pricing rules to a base price given a context.
   * Rules are applied in priority order; only the highest priority matching rule per type is applied.
   */
  static applyRules(basePrice: number, context: PricingContext, customRules?: PricingRule[]): {
    finalPrice: number;
    appliedRules: PricingRule[];
    modifier: number;
  } {
    const allRules = [...BUILT_IN_RULES, ...(customRules ?? [])].filter((r) => r.isActive);
    const appliedRules: PricingRule[] = [];

    // Volume rules
    if (context.volumeMonthly !== undefined) {
      const volumeRules = allRules
        .filter((r) => r.type === 'volume')
        .filter((r) => {
          const cond = r.conditions as { minMonthlyVolume: number };
          return context.volumeMonthly! >= cond.minMonthlyVolume;
        })
        .sort((a, b) => b.priority - a.priority);
      if (volumeRules.length > 0) appliedRules.push(volumeRules[0]);
    }

    // Seasonal rules
    if (context.month !== undefined) {
      const seasonalRules = allRules
        .filter((r) => r.type === 'seasonal')
        .filter((r) => {
          const cond = r.conditions as { months: number[]; days?: number[] };
          return (cond.months ?? []).includes(context.month!);
        })
        .sort((a, b) => b.priority - a.priority);
      if (seasonalRules.length > 0) appliedRules.push(seasonalRules[0]);
    }

    // Geographic rules
    if (context.territory) {
      const geoRules = allRules
        .filter((r) => r.type === 'geographic')
        .filter((r) => {
          const cond = r.conditions as { territories: string[] };
          return (cond.territories ?? []).includes(context.territory!.toLowerCase());
        })
        .sort((a, b) => b.priority - a.priority);
      if (geoRules.length > 0) appliedRules.push(geoRules[0]);
    }

    // Time rules
    if (context.hourOfDay !== undefined) {
      const timeRules = allRules
        .filter((r) => r.type === 'time')
        .filter((r) => {
          const cond = r.conditions as { hours: number[] };
          return (cond.hours ?? []).includes(context.hourOfDay!);
        })
        .sort((a, b) => b.priority - a.priority);
      if (timeRules.length > 0) appliedRules.push(timeRules[0]);
    }

    // Combine modifiers (multiplicative)
    const combinedModifier = appliedRules.reduce((m, r) => m * r.modifier, 1);
    const finalPrice = Math.round(basePrice * combinedModifier * 10000) / 10000;

    return { finalPrice, appliedRules, modifier: combinedModifier };
  }

  static getBuiltInRules(): PricingRule[] {
    return BUILT_IN_RULES;
  }

  static getActiveRules(): PricingRule[] {
    return BUILT_IN_RULES.filter((r) => r.isActive);
  }
}
