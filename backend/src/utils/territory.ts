export const TERRITORY_CODES = ['GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'NC', 'PF', 'WF'] as const;
export type TerritoryCode = typeof TERRITORY_CODES[number];

export function isTerritoryCode(code: string): code is TerritoryCode {
  return TERRITORY_CODES.includes(code.toUpperCase() as TerritoryCode);
}
