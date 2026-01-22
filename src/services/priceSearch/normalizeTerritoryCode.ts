// src/services/priceSearch/normalizeTerritoryCode.ts

import type { TerritoryCode } from './price.types';

/**
 * Normalise les codes territoire vers un format ISO DOM/FR cohérent
 */
export function normalizeTerritoryCode(input?: string): TerritoryCode {
  const normalizedInput = input?.trim();
  if (!normalizedInput) {
    return 'fr';
  }
  const value = normalizedInput
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  switch (value) {
    case 'FR':
    case 'FRANCE':
    case 'FRANCE METROPOLE':
    case 'FRANCE METROPOLITAINE':
      return 'fr';

    case 'GP':
    case 'GUADELOUPE':
      return 'gp';

    case 'MQ':
    case 'MARTINIQUE':
      return 'mq';

    case 'GF':
    case 'GUYANE':
      return 'gf';

    case 'RE':
    case 'REUNION':
    case 'LA REUNION':
      return 're';

    case 'YT':
    case 'MAYOTTE':
      return 'yt';

    case 'PM':
    case 'SAINT PIERRE ET MIQUELON':
      return 'pm';

    case 'BL':
    case 'SAINT BARTHELEMY':
      return 'bl';

    case 'MF':
    case 'SAINT MARTIN':
      return 'mf';

    case 'WF':
    case 'WALLIS ET FUTUNA':
      return 'wf';

    case 'PF':
    case 'POLYNESIE FRANCAISE':
      return 'pf';

    case 'NC':
    case 'NOUVELLE CALEDONIE':
      return 'nc';

    default:
      return 'fr';
  }
}
