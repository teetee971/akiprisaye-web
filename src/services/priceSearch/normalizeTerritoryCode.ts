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
  france: 'FR',
  hexagone: 'FR',
  metropole: 'FR',
  'france metropole': 'FR',
  gp: 'GP',
  guadeloupe: 'GP',
  mq: 'MQ',
  martinique: 'MQ',
  gf: 'GF',
  guyane: 'GF',
  gy: 'GF',
  re: 'RE',
  reunion: 'RE',
  'la reunion': 'RE',
  yt: 'YT',
  mayotte: 'YT',
  pm: 'PM',
  'saint pierre et miquelon': 'PM',
  bl: 'BL',
  'saint barthelemy': 'BL',
  mf: 'MF',
  'saint martin': 'MF',
  wf: 'WF',
  'wallis et futuna': 'WF',
  pf: 'PF',
  'polynesie francaise': 'PF',
  nc: 'NC',
  'nouvelle caledonie': 'NC',
};

export function normalizeTerritoryCode(value?: string): TerritoryCode {
  if (!value) return 'FR';
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (TERRITORY_CODES.includes(upper as TerritoryCode)) {
    return upper as TerritoryCode;
  }
  const normalized = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const alias = TERRITORY_ALIASES[normalized] ?? TERRITORY_ALIASES[trimmed.toLowerCase()];
  return alias ?? 'FR';
}
