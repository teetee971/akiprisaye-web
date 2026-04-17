import { describe, it, expect } from 'vitest';
import {
  MAX_HIGH_PRIORITY,
  MAX_DUPLICATIONS,
  WHITELISTED_PATCH_FILES,
  capHighPriority,
  capDuplications,
  isWhitelisted,
  validateRecommendations,
} from '../utils/autoSeoGuardrails';

describe('autoSeoGuardrails', () => {
  describe('constants', () => {
    it('MAX_HIGH_PRIORITY is 20', () => {
      expect(MAX_HIGH_PRIORITY).toBe(20);
    });

    it('MAX_DUPLICATIONS is 10', () => {
      expect(MAX_DUPLICATIONS).toBe(10);
    });

    it('WHITELISTED_PATCH_FILES has 5 safe entries', () => {
      expect(WHITELISTED_PATCH_FILES).toHaveLength(5);
    });
  });

  describe('capHighPriority', () => {
    it('allows up to 20 high-priority items', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        priority: 'high' as const,
        id: i,
      }));
      const result = capHighPriority(items);
      expect(result.filter((r) => r.priority === 'high')).toHaveLength(20);
    });

    it('keeps all non-high items intact', () => {
      const items = [
        { priority: 'high' as const },
        { priority: 'medium' as const },
        { priority: 'low' as const },
      ];
      const result = capHighPriority(items);
      expect(result.filter((r) => r.priority !== 'high')).toHaveLength(2);
    });

    it('works with empty array', () => {
      expect(capHighPriority([])).toEqual([]);
    });

    it('is deterministic', () => {
      const items = Array.from({ length: 30 }, (_, i) => ({ priority: 'high' as const, idx: i }));
      const a = capHighPriority(items);
      const b = capHighPriority(items);
      expect(a).toEqual(b);
    });
  });

  describe('capDuplications', () => {
    it('limits DUPLICATE_PAGE items to 10', () => {
      const items = Array.from({ length: 15 }, () => ({ type: 'DUPLICATE_PAGE' }));
      const result = capDuplications(items);
      expect(result.filter((r) => r.type === 'DUPLICATE_PAGE')).toHaveLength(10);
    });

    it('keeps non-duplication items untouched', () => {
      const items = [{ type: 'BOOST_CTA' }, { type: 'DUPLICATE_PAGE' }, { type: 'IMPROVE_TITLE' }];
      const result = capDuplications(items);
      expect(result.filter((r) => r.type !== 'DUPLICATE_PAGE')).toHaveLength(2);
    });

    it('supports recommendationType field too', () => {
      const items = Array.from({ length: 12 }, () => ({ recommendationType: 'DUPLICATE_PAGE' }));
      const result = capDuplications(items);
      expect(result.filter((r) => r.recommendationType === 'DUPLICATE_PAGE')).toHaveLength(10);
    });

    it('works with empty array', () => {
      expect(capDuplications([])).toEqual([]);
    });
  });

  describe('isWhitelisted', () => {
    it('accepts all whitelisted files', () => {
      for (const file of WHITELISTED_PATCH_FILES) {
        expect(isWhitelisted(file)).toBe(true);
      }
    });

    it('rejects non-whitelisted files', () => {
      expect(isWhitelisted('frontend/src/App.tsx')).toBe(false);
      expect(isWhitelisted('.github/workflows/deploy-pages.yml')).toBe(false);
      expect(isWhitelisted('frontend/src/lib/firebase.ts')).toBe(false);
      expect(isWhitelisted('')).toBe(false);
    });
  });

  describe('validateRecommendations', () => {
    it('keeps items with non-empty reason', () => {
      const items = [
        { type: 'IMPROVE_TITLE', reason: 'CTR trop faible' },
        { type: 'BOOST_CTA', reason: 'Pas de clics affiliés' },
      ];
      expect(validateRecommendations(items)).toHaveLength(2);
    });

    it('removes items with empty reason', () => {
      const items = [
        { type: 'IMPROVE_TITLE', reason: '' },
        { type: 'BOOST_CTA', reason: '   ' },
        { type: 'DUPLICATE_PAGE', reason: 'Bonne performance' },
      ];
      expect(validateRecommendations(items)).toHaveLength(1);
    });

    it('removes items without reason field', () => {
      const items = [
        { type: 'IMPROVE_TITLE', reason: undefined },
        { type: 'BOOST_CTA', reason: 'ok' },
      ] as { type: string; reason?: string }[];
      expect(validateRecommendations(items)).toHaveLength(1);
    });

    it('works with empty array', () => {
      expect(validateRecommendations([])).toEqual([]);
    });
  });
});
