/**
 * Unit Tests for Freight Comparison Service
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOctroiDeMer,
  calculateTotalCost,
  rankQuotes,
  calculateRouteAggregation,
} from '../freightComparisonService';
import type { FreightQuote, FreightRoute, PackageDetails } from '../../types/freightComparison';

const mockRoute: FreightRoute = {
  origin: 'Paris',
  destination: 'GP',
};

const mockPackage: PackageDetails = {
  weight: 10,
  dimensions: { length: 40, width: 30, height: 20 },
  type: 'standard',
};

const makeQuote = (
  id: string,
  carrier: string,
  basePrice: number,
  totalTTC: number
): FreightQuote => ({
  id,
  carrier,
  carrierCode: carrier.substring(0, 3).toUpperCase(),
  route: mockRoute,
  package: mockPackage,
  urgency: 'standard',
  pricing: {
    basePrice,
    handlingFee: basePrice * 0.05,
    octroi: basePrice * 0.025,
    totalTTC,
    breakdown: [{ name: 'Prix de base', amount: basePrice }],
  },
  timing: { announcedDays: 12 },
  reliability: { score: 4.0, basedOnContributions: 20, onTimeRate: 90, issuesReported: 2 },
  source: {
    type: 'official_website',
    observedAt: '2026-01-10T10:00:00Z',
    verificationMethod: 'automated',
    reliability: 'high',
  },
  lastUpdated: '2026-01-10T10:00:00Z',
  trackingAvailable: true,
  insuranceIncluded: false,
  pickupAvailable: false,
});

describe('calculateOctroiDeMer', () => {
  it('calculates correct octroi for Guadeloupe (2.5%)', () => {
    const octroi = calculateOctroiDeMer(100, 'GP');
    expect(octroi).toBeCloseTo(2.5, 5);
  });

  it('calculates correct octroi for Guyane (5.0%)', () => {
    const octroi = calculateOctroiDeMer(100, 'GF');
    expect(octroi).toBeCloseTo(5.0, 5);
  });

  it('calculates zero octroi for Terres australes', () => {
    const octroi = calculateOctroiDeMer(100, 'TF');
    expect(octroi).toBe(0);
  });

  it('returns 0 for unknown territory', () => {
    // @ts-expect-error - testing unknown territory
    const octroi = calculateOctroiDeMer(100, 'UNKNOWN');
    expect(octroi).toBe(0);
  });

  it('scales linearly with base price', () => {
    const octroi100 = calculateOctroiDeMer(100, 'MQ');
    const octroi200 = calculateOctroiDeMer(200, 'MQ');
    expect(octroi200).toBeCloseTo(octroi100 * 2, 5);
  });
});

describe('calculateTotalCost', () => {
  it('returns correct structure', () => {
    const pricing = calculateTotalCost(100, mockPackage, 'GP');
    expect(pricing).toHaveProperty('basePrice');
    expect(pricing).toHaveProperty('handlingFee');
    expect(pricing).toHaveProperty('octroi');
    expect(pricing).toHaveProperty('totalTTC');
    expect(pricing).toHaveProperty('breakdown');
  });

  it('calculates handling fee at 5% of base price', () => {
    const pricing = calculateTotalCost(100, mockPackage, 'GP');
    expect(pricing.handlingFee).toBeCloseTo(5, 5);
  });

  it('includes octroi de mer in total', () => {
    const pricing = calculateTotalCost(100, mockPackage, 'GF'); // Guyane = 5%
    expect(pricing.octroi).toBeCloseTo(5, 5);
    // base(100) + handling(5%) + octroi(5%) = 110
    expect(pricing.totalTTC).toBeCloseTo(110, 5);
  });

  it('adds urgency surcharge for express', () => {
    const standard = calculateTotalCost(100, mockPackage, 'GP', 'standard');
    const express = calculateTotalCost(100, mockPackage, 'GP', 'express');
    expect(express.totalTTC).toBeGreaterThan(standard.totalTTC);
  });

  it('adds urgency surcharge for urgent', () => {
    const standard = calculateTotalCost(100, mockPackage, 'GP', 'standard');
    const urgent = calculateTotalCost(100, mockPackage, 'GP', 'urgent');
    expect(urgent.totalTTC).toBeGreaterThan(standard.totalTTC);
  });

  it('includes insurance when declared value is provided', () => {
    const withInsurance = calculateTotalCost(100, { ...mockPackage, declaredValue: 500 }, 'GP');
    expect(withInsurance.insurance).toBeDefined();
    expect(withInsurance.insurance).toBeCloseTo(10, 5); // 500 * 0.02
  });

  it('does not include insurance when no declared value', () => {
    const pricing = calculateTotalCost(100, mockPackage, 'GP');
    expect(pricing.insurance).toBeUndefined();
  });
});

describe('rankQuotes', () => {
  const q1 = makeQuote('q1', 'Colissimo', 80, 90);
  const q2 = makeQuote('q2', 'DHL', 100, 115);
  const q3 = makeQuote('q3', 'GLS', 120, 135);

  it('returns empty array for empty input', () => {
    expect(rankQuotes([])).toHaveLength(0);
  });

  it('ranks quotes from cheapest to most expensive', () => {
    const ranked = rankQuotes([q3, q1, q2]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].quote.carrier).toBe('Colissimo');
    expect(ranked[2].rank).toBe(3);
    expect(ranked[2].quote.carrier).toBe('GLS');
  });

  it('assigns zero difference from cheapest for rank 1', () => {
    const ranked = rankQuotes([q1, q2]);
    expect(ranked[0].savingsVsCheapest).toBe(0);
  });

  it('marks most expensive as most_expensive', () => {
    const ranked = rankQuotes([q1, q2, q3]);
    const last = ranked[ranked.length - 1];
    expect(last.priceCategory).toBe('most_expensive');
  });

  it('marks cheapest as cheapest', () => {
    const ranked = rankQuotes([q1, q2, q3]);
    expect(ranked[0].priceCategory).toBe('cheapest');
  });
});

describe('calculateRouteAggregation', () => {
  it('returns aggregation for a valid route and quotes', () => {
    const q1 = makeQuote('q1', 'Colissimo', 80, 90);
    const q2 = makeQuote('q2', 'DHL', 100, 115);
    const agg = calculateRouteAggregation(mockRoute, [q1, q2]);
    expect(agg.carrierCount).toBe(2);
    expect(agg.minPrice).toBe(90);
    expect(agg.maxPrice).toBe(115);
    expect(agg.averagePrice).toBeCloseTo(102.5, 1);
  });

  it('handles single quote', () => {
    const q1 = makeQuote('q1', 'Colissimo', 80, 90);
    const agg = calculateRouteAggregation(mockRoute, [q1]);
    expect(agg.carrierCount).toBe(1);
    expect(agg.priceRange).toBe(0);
  });
});
