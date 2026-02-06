/**
 * Constants for multi-territory price comparison
 */

/**
 * Threshold percentage for highlighting significant price differences
 * When a price difference exceeds this percentage, it will be marked with an alert
 */
export const SIGNIFICANT_PRICE_DIFF_THRESHOLD = 20;

/**
 * Territory code to filename mapping
 * Maps 2-letter territory codes to their corresponding data file names
 */
export const TERRITORY_FILE_MAP: Record<string, string> = {
  GP: 'guadeloupe',
  MQ: 'martinique',
  GF: 'guyane',
  RE: 'reunion',
  YT: 'mayotte',
  MF: 'saint-martin',
  BL: 'saint-barthelemy',
  PM: 'saint-pierre-et-miquelon',
  WF: 'wallis-et-futuna',
  PF: 'polynesie-francaise',
  NC: 'nouvelle-caledonie'
};
