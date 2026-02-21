import { describe, it, expect } from 'vitest';
import { decidePriceAction } from '../services/priceDecisionEngine';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function obs(price: number, daysAgo: number) {
  return {
    price,
    observedAt: new Date(now - daysAgo * day).toISOString(),
    source: 'test',
  };
}

describe('decidePriceAction', () => {
  it('returns monitor when insufficient data', () => {
    const result = decidePriceAction({ history: [obs(10, 1)], lastPrice: 10 });
    expect(result.recommendation).toBe('monitor');
  });

  it('returns buy_now on upward trend', () => {
    const history = [obs(10, 20), obs(11, 15), obs(12, 10), obs(14, 4), obs(15, 1)];
    const result = decidePriceAction({ history, lastPrice: 15 });
    expect(result.trend).toBe('up');
    expect(result.recommendation).toBe('buy_now');
  });

  it('returns wait on down trend with high current price', () => {
    const history = [obs(20, 25), obs(19, 18), obs(18, 10), obs(17, 4), obs(16, 1)];
    const result = decidePriceAction({ history, lastPrice: 19 });
    expect(result.trend).toBe('down');
    expect(result.recommendation).toBe('wait');
  });

  it('returns monitor on low volatility stable prices', () => {
    const history = [obs(10, 25), obs(10.1, 18), obs(10, 10), obs(10.05, 4), obs(10, 1)];
    const result = decidePriceAction({ history, lastPrice: 10.08 });
    expect(result.recommendation).toBe('monitor');
  });
});
