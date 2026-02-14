import type { TerritoryCode } from '../types/market';

const DEFAULT_TERRITORY: TerritoryCode = 'gp';
const ALLOWED: TerritoryCode[] = ['gp', 'mq', 'fr', 'gf', 're', 'yt'];

export function getPreferredTerritory(): TerritoryCode {
  if (typeof window === 'undefined') return DEFAULT_TERRITORY;
  const raw = localStorage.getItem('akiprisaye-territory') ?? DEFAULT_TERRITORY;
  const territory = raw.toLowerCase() as TerritoryCode;
  return ALLOWED.includes(territory) ? territory : DEFAULT_TERRITORY;
}
