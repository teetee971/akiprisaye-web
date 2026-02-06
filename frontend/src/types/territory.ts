/**
 * Territory codes used across the application.
 *
 * ⚠️ RÈGLES IMPORTANTES
 * - Codes ISO / DOM en MAJUSCULES uniquement
 * - UNE seule source de vérité
 * - Utilisé par : services, tests, comparaisons, exports
 *
 * Toute valeur en dehors de cette liste doit être refusée par TypeScript.
 */

export type TerritoryCode =
  | 'FR' // France métropolitaine
  | 'GP' // Guadeloupe
  | 'MQ' // Martinique
  | 'GF' // Guyane
  | 'RE' // La Réunion
  | 'YT' // Mayotte
  | 'PM' // Saint-Pierre-et-Miquelon
  | 'BL' // Saint-Barthélemy
  | 'MF'; // Saint-Martin

/**
 * Liste complète des territoires (utile pour boucles, selects, validations)
 */
export const ALL_TERRITORIES: readonly TerritoryCode[] = [
  'FR',
  'GP',
  'MQ',
  'GF',
  'RE',
  'YT',
  'PM',
  'BL',
  'MF',
] as const;

/**
 * Type guard sécurisé
 */
export function isTerritoryCode(value: unknown): value is TerritoryCode {
  return (
    typeof value === 'string' &&
    (ALL_TERRITORIES as readonly string[]).includes(value)
  );
}