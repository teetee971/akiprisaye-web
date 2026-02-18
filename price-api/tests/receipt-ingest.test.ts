import { describe, expect, it } from 'vitest';
import { normalizeReceipt } from '../src/receiptNormalize/normalize';
import { redactReceipt } from '../src/pii/redact';
import { resolveJobStatus } from '../src/receiptIngest';
import { receiptInitSchema } from '../src/validators';

describe('receipt ingest validators', () => {
  it('validates init payload', () => {
    const parsed = receiptInitSchema.parse({ territory: 'gp', sourceType: 'receipt', imagesCount: 4 });
    expect(parsed.imagesCount).toBe(4);
  });

  it('rejects invalid imagesCount', () => {
    expect(() => receiptInitSchema.parse({ territory: 'gp', sourceType: 'receipt', imagesCount: 7 })).toThrow();
  });
});

describe('PII redaction', () => {
  it('redacts email/phone/card/iban and removes suspicious line', () => {
    const sanitized = redactReceipt({
      merchantCandidates: ['Super U'],
      storeCandidates: ['Rue Victor Hugo'],
      dateCandidates: ['2026-02-18T12:00:00.000Z'],
      totals: { total: 9.99 },
      lines: [
        { label: 'Pommes 2kg', lineTotal: 4.2, confidence: 0.9 },
        { label: 'contact jean.dupont@example.com +33601020304 4111 1111 1111 1111 FR1420041010050500013M02606' },
      ],
      rawText: 'debug only',
      confidence: 0.7,
      status: 'PARTIAL',
    });

    expect(sanitized.items.length).toBeGreaterThanOrEqual(1);
    expect(sanitized.items.some((item) => item.productLabel.includes('@'))).toBe(false);
    expect(Object.keys(sanitized.piiRedaction).length).toBeGreaterThan(0);
  });
});

describe('normalization', () => {
  it('normalizes cents and retailer', () => {
    const normalized = normalizeReceipt({
      retailer: 'E.Leclerc',
      storeName: ' Leclerc Centre ',
      observedAt: '2026-02-18T12:00:00.000Z',
      totals: { total: 3.99, tax: 0.2, subtotal: 3.79 },
      items: [{ lineIndex: 0, productLabel: 'Lait demi-écrémé', unitPrice: 1.35, lineTotal: 2.7, confidence: 0.8 }],
      piiRedaction: {},
      confidence: 0.8,
    });

    expect(normalized.retailer).toBe('leclerc');
    expect(normalized.items[0].lineTotalCents).toBe(270);
    expect(normalized.totals.totalCents).toBe(399);
  });
});

describe('status transitions', () => {
  it('resolves queued/running result to success or partial outcome', () => {
    expect(resolveJobStatus(1)).toBe('success');
    expect(resolveJobStatus(0)).toBe('partial');
  });
});
