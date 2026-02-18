import { describe, expect, it } from 'vitest';
import { parseReceipt, redactPII } from '../services/receiptOcrClient';

describe('receiptOcrClient', () => {
  it('redacts common pii fields', () => {
    const input = 'Email john@doe.com\nTel 0690 12 34 56\nCB 1234 5678 9012 3456';
    const output = redactPII(input);

    expect(output).not.toContain('john@doe.com');
    expect(output).not.toContain('0690 12 34 56');
    expect(output).not.toContain('1234 5678 9012 3456');
    expect(output).toContain('[REDACTED]');
  });

  it('parses normalized receipt payload', () => {
    const text = `CARREFOUR MARKET\n12/02/2026 14:33\nPOMME GOLDEN 2,99€\nTOTAL TTC 2,99€`;
    const parsed = parseReceipt(text);

    expect(parsed.retailer).toBe('carrefour');
    expect(parsed.currency).toBe('EUR');
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].priceCents).toBe(299);
    expect(parsed.purchasedAt).toContain('2026-02-12');
  });
});
