export const TERRITORY_CODES = [
  'FR',
  'GP',
  'MQ',
  'GF',
  'RE',
  'YT',
  'BL',
  'MF',
  'PM',
  'WF',
  'PF',
  'NC',
  'TF',
] as const;

export type TerritoryCode = typeof TERRITORY_CODES[number];

export const DEFAULT_TERRITORY: TerritoryCode = 'FR';