import type { TerritoryCode } from '../../types/PriceObservation';

const TERRITORY_CODES: TerritoryCode[] = [
  'FR',
  'GP',
  'MQ',
  'GF',
  'RE',
  'YT',
  'PM',
  'BL',
  'MF',
  'WF',
  'PF',
  'NC',
];

const TERRITORY_ALIASES: Record<string, TerritoryCode> = {
  fr: 'FR',
  gp: 'GP',
  mq: 'MQ',
  gf: 'GF',
  gy: 'GF',
  re: 'RE',
  yt: 'YT',
  pm: 'PM',
  bl: 'BL',
  mf: 'MF',
  wf: 'WF',
  pf: 'PF',
  nc: 'NC',
};

export function normalizeTerritoryCode(value?: string): TerritoryCode {
  if (!value) return 'FR';
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (TERRITORY_CODES.includes(upper as TerritoryCode)) {
    return upper as TerritoryCode;
  }
  const alias = TERRITORY_ALIASES[trimmed.toLowerCase()];
  return alias ?? 'FR';
}
