// src/services/priceSearch/normalizeTerritoryCode.ts

import type { TerritoryCode } from '../../types/PriceObservation';

/**
 * Normalise les codes territoire vers un format ISO DOM/FR cohérent
 */
export function normalizeTerritoryCode(input: string): TerritoryCode {
  const value = input.trim().toUpperCase();

  switch (value) {
    case 'FR':
    case 'FRANCE':
      return 'FR';

    case 'GP':
    case 'GUADELOUPE':
      return 'GP';

    case 'MQ':
    case 'MARTINIQUE':
      return 'MQ';

    case 'GF':
    case 'GUYANE':
      return 'GF';

    case 'RE':
    case 'REUNION':
    case 'RÉUNION':
      return 'RE';

    case 'YT':
    case 'MAYOTTE':
      return 'YT';

    case 'PM':
      return 'PM';

    case 'BL':
      return 'BL';

    case 'MF':
      return 'MF';

    case 'WF':
      return 'WF';

    case 'PF':
      return 'PF';

    case 'NC':
      return 'NC';

    default:
      throw new Error(`Unknown territory code: ${input}`);
  }
}
