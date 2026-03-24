import { describe, expect, it } from 'vitest';
import { PAGE_CATEGORIES, getPageCategory } from '../hooks/useVisitorStats';

describe('useVisitorStats category mapping', () => {
  it('maps legacy /scan routes to scanner category', () => {
    const scan = getPageCategory('/scan');
    const scanNested = getPageCategory('/scan/ean');
    const scanner = getPageCategory('/scanner');

    expect(scan?.key).toBe('scanner');
    expect(scanNested?.key).toBe('scanner');
    expect(scanner?.key).toBe('scanner');
  });

  it('keeps a single scanner key in PAGE_CATEGORIES', () => {
    const scannerKeys = PAGE_CATEGORIES.filter((cat) => cat.key === 'scanner');
    const scanKeys = PAGE_CATEGORIES.filter((cat) => cat.key === 'scan');

    expect(scannerKeys).toHaveLength(1);
    expect(scanKeys).toHaveLength(0);
  });
});
