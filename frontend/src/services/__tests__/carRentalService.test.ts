/**
 * Unit Tests for Car Rental Comparison Service
 */

import { describe, it, expect } from 'vitest';
import { compareCarRentals, filterCarRentals, CAR_CATEGORY_LABELS } from '../carRentalService';
import type { CarRentalPricePoint } from '../../types/carRental';

const makeSource = () => ({
  type: 'official_site' as const,
  observedAt: '2026-01-10T10:00:00Z',
  verificationMethod: 'manual' as const,
  reliability: 'high' as const,
});

const makeInclusions = (unlimitedMileage = true) => ({
  unlimitedMileage,
  cdwIncluded: true,
  tplIncluded: true,
  airportFee: false,
  gpsIncluded: false,
  childSeatAvailable: true,
});

const mockPrices: CarRentalPricePoint[] = [
  {
    id: 'r1',
    agency: 'Jumbo Car',
    agencyCode: 'JMB',
    isLocalAgency: true,
    territory: 'GP',
    pickupLocation: 'Aéroport Pointe-à-Pitre',
    category: 'economy',
    vehicleExample: 'Peugeot 208',
    transmission: 'manual',
    pricing: { dailyRate: 35, deposit: 500, currency: 'EUR' },
    inclusions: makeInclusions(),
    minAge: 21,
    observationDate: '2026-01-10T10:00:00Z',
    source: makeSource(),
    confidence: 'high',
    verified: true,
  },
  {
    id: 'r2',
    agency: 'Hertz',
    agencyCode: 'HTZ',
    isLocalAgency: false,
    territory: 'GP',
    pickupLocation: 'Aéroport Pointe-à-Pitre',
    category: 'economy',
    vehicleExample: 'Renault Clio',
    transmission: 'manual',
    pricing: { dailyRate: 45, deposit: 800, currency: 'EUR' },
    inclusions: makeInclusions(),
    minAge: 21,
    observationDate: '2026-01-12T10:00:00Z',
    source: makeSource(),
    confidence: 'high',
    verified: true,
  },
  {
    id: 'r3',
    agency: 'Europcar',
    agencyCode: 'EPC',
    isLocalAgency: false,
    territory: 'GP',
    pickupLocation: 'Aéroport Pointe-à-Pitre',
    category: 'economy',
    vehicleExample: 'Toyota Yaris',
    transmission: 'automatic',
    pricing: { dailyRate: 50, deposit: 900, currency: 'EUR' },
    inclusions: makeInclusions(false),
    minAge: 21,
    observationDate: '2026-01-14T10:00:00Z',
    source: makeSource(),
    confidence: 'medium',
    verified: false,
  },
];

describe('compareCarRentals', () => {
  it('returns null for empty prices array', () => {
    const result = compareCarRentals('GP', 'economy', []);
    expect(result).toBeNull();
  });

  it('returns null when no prices match territory and category', () => {
    const result = compareCarRentals('MQ', 'economy', mockPrices);
    expect(result).toBeNull();
  });

  it('returns valid comparison result', () => {
    const result = compareCarRentals('GP', 'economy', mockPrices);
    expect(result).not.toBeNull();
    expect(result!.territory).toBe('GP');
    expect(result!.category).toBe('economy');
    expect(result!.agencies).toHaveLength(3);
  });

  it('ranks agencies from cheapest to most expensive', () => {
    const result = compareCarRentals('GP', 'economy', mockPrices);
    expect(result!.agencies[0].rank).toBe(1);
    expect(result!.agencies[0].rentalPrice.pricing.dailyRate).toBe(35);
    expect(result!.agencies[2].rank).toBe(3);
    expect(result!.agencies[2].rentalPrice.pricing.dailyRate).toBe(50);
  });

  it('marks cheapest agency as cheapest', () => {
    const result = compareCarRentals('GP', 'economy', mockPrices);
    expect(result!.agencies[0].priceCategory).toBe('cheapest');
  });

  it('computes correct aggregation statistics', () => {
    const result = compareCarRentals('GP', 'economy', mockPrices);
    const agg = result!.aggregation;
    expect(agg.pricing.minDailyRate).toBe(35);
    expect(agg.pricing.maxDailyRate).toBe(50);
    expect(agg.agencyCount).toBe(3);
    expect(agg.localAgencyCount).toBe(1);
    expect(agg.internationalAgencyCount).toBe(2);
  });

  it('computes correct average daily rate', () => {
    const result = compareCarRentals('GP', 'economy', mockPrices);
    // (35 + 45 + 50) / 3 ≈ 43.33
    expect(result!.aggregation.pricing.averageDailyRate).toBeCloseTo(43.33, 1);
  });

  it('includes metadata with correct methodology', () => {
    const result = compareCarRentals('GP', 'economy', mockPrices);
    expect(result!.metadata.methodology).toBe('v1.0.0');
    expect(result!.metadata.dataQuality.totalAgencies).toBe(3);
  });

  it('compares correctly with single price', () => {
    const result = compareCarRentals('GP', 'economy', [mockPrices[0]]);
    expect(result).not.toBeNull();
    expect(result!.agencies[0].rank).toBe(1);
    expect(result!.agencies[0].absoluteDifferenceFromCheapest).toBe(0);
  });
});

describe('filterCarRentals', () => {
  it('returns all prices when filter is empty', () => {
    const filtered = filterCarRentals(mockPrices, {});
    expect(filtered).toHaveLength(3);
  });

  it('filters by territory', () => {
    const filtered = filterCarRentals(
      [...mockPrices, { ...mockPrices[0], id: 'r4', territory: 'MQ' as const }],
      { territory: 'MQ' }
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].territory).toBe('MQ');
  });

  it('filters by category', () => {
    const filtered = filterCarRentals(
      [...mockPrices, { ...mockPrices[0], id: 'r5', category: 'suv' as const }],
      { category: 'suv' }
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].category).toBe('suv');
  });

  it('filters by transmission', () => {
    const filtered = filterCarRentals(mockPrices, { transmission: 'automatic' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].transmission).toBe('automatic');
  });

  it('filters by maxDailyRate', () => {
    const filtered = filterCarRentals(mockPrices, { maxDailyRate: 40 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].pricing.dailyRate).toBeLessThanOrEqual(40);
  });

  it('filters by unlimitedMileageOnly', () => {
    const filtered = filterCarRentals(mockPrices, { unlimitedMileageOnly: true });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.inclusions.unlimitedMileage)).toBe(true);
  });

  it('filters by localAgencyOnly', () => {
    const filtered = filterCarRentals(mockPrices, { localAgencyOnly: true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].isLocalAgency).toBe(true);
  });

  it('filters by verifiedOnly', () => {
    const filtered = filterCarRentals(mockPrices, { verifiedOnly: true });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((p) => p.verified)).toBe(true);
  });

  it('combines multiple filters', () => {
    const filtered = filterCarRentals(mockPrices, {
      verifiedOnly: true,
      maxDailyRate: 40,
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].agency).toBe('Jumbo Car');
  });
});

describe('CAR_CATEGORY_LABELS', () => {
  it('provides a French label for each car category', () => {
    expect(CAR_CATEGORY_LABELS.economy).toBe('Économique');
    expect(CAR_CATEGORY_LABELS.suv).toBeTruthy();
    expect(CAR_CATEGORY_LABELS.electric).toBeTruthy();
  });
});
