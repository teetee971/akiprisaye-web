import type { Env } from '../types';
import { dummyExtractor } from './extractors/dummy';
import type { ReceiptExtractor } from './types';

export function getReceiptExtractor(env: Env): ReceiptExtractor {
  switch (env.OCR_PROVIDER ?? 'dummy') {
    case 'google':
    case 'azure':
    case 'aws':
    case 'mindee':
      return dummyExtractor;
    case 'dummy':
    default:
      return dummyExtractor;
  }
}

export * from './types';
