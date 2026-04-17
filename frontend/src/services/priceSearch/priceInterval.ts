import type { NormalizedPriceObservation, PriceInterval } from './price.types';
import { computeMedian, normalizePriceValue } from './priceNormalizer';

export function computePriceInterval(observations: NormalizedPriceObservation[]): PriceInterval {
  const values = observations
    .map((observation) => observation.pricePerUnit ?? observation.price)
    .filter((value) => Number.isFinite(value));

  if (values.length === 0) {
    return {
      min: null,
      median: null,
      max: null,
      currency: 'EUR',
      priceCount: 0,
    };
  }

  const min = normalizePriceValue(Math.min(...values));
  const max = normalizePriceValue(Math.max(...values));
  const median = computeMedian(values);

  return {
    min,
    median,
    max,
    currency: 'EUR',
    priceCount: values.length,
  };
}
