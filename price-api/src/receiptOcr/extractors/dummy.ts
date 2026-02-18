import type { ReceiptExtractor } from '../types';

export const dummyExtractor: ReceiptExtractor = {
  id: 'dummy',
  async extract() {
    return {
      merchantCandidates: [],
      storeCandidates: [],
      dateCandidates: [],
      totals: {},
      lines: [],
      rawText: '',
      confidence: 0,
      status: 'NO_DATA',
    };
  },
};
