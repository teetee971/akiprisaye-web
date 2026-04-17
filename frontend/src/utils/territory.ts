export const TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫' },
] as const;

export type TerritoryCode = (typeof TERRITORIES)[number]['code'];

export function getTerritoryName(code: string): string {
  return TERRITORIES.find((t) => t.code === code)?.name ?? code;
}

export function getTerritoryFlag(code: string): string {
  return TERRITORIES.find((t) => t.code === code)?.flag ?? '';
}
