import { describe, expect, test } from 'vitest';

import { generateFoodBasketMetadata } from '../foodBasketService';
import { generateLandMobilityMetadata } from '../landMobilityPriceService';
import { generateComparisonMetadata } from '../priceComparisonService';
import { generateTransportMetadata } from '../transportPriceService';

describe('metadata bucket guards', () => {
  test('generateTransportMetadata ignores records with missing source type without crashing', () => {
    const metadata = generateTransportMetadata([
      {
        id: 'row-1',
        operatorId: 'aircaraibes',
        operatorName: 'Air Caraïbes',
        mode: 'plane',
        route: {
          from: 'PTP',
          to: 'FDF',
          fromTerritory: 'guadeloupe',
          toTerritory: 'martinique',
        },
        price: 120,
        currency: 'EUR',
        serviceClass: 'economy',
        observationDate: '2025-01-10T00:00:00.000Z',
        source: {} as never,
        metadata: {
          bookingAdvanceDays: 7,
        },
      },
    ] as never);

    expect(metadata.sources).toEqual([]);
  });

  test('generateLandMobilityMetadata ignores records with missing source type without crashing', () => {
    const metadata = generateLandMobilityMetadata([
      {
        category: 'BUS',
        line: { operator: 'KARU BUS', territory: 'guadeloupe' },
        observationDate: '2025-01-10T00:00:00.000Z',
        source: {} as never,
        price: 2.2,
        confidence: 'high',
        verified: true,
        volume: 1,
      },
    ] as never);

    expect(metadata.sources).toEqual([]);
  });

  test('generateComparisonMetadata ignores records with missing source without crashing', () => {
    const metadata = generateComparisonMetadata([
      {
        storeId: 'store-1',
        territory: 'guadeloupe',
        price: 4.5,
        volume: 1,
        observationDate: '2025-01-10T00:00:00.000Z',
        source: undefined,
      },
    ] as never);

    expect(metadata.sources).toEqual([]);
  });

  test('generateFoodBasketMetadata ignores records with missing source type without crashing', () => {
    const metadata = generateFoodBasketMetadata([
      {
        territory: 'martinique',
        storeName: 'Store A',
        observationDate: '2025-01-10T00:00:00.000Z',
        completeness: 90,
        totalCost: 50,
        itemPrices: [],
        sources: [{ type: undefined }],
      },
    ] as never);

    expect(metadata.sources).toEqual([]);
  });
});
