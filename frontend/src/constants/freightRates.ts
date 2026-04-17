/**
 * Freight Rate Constants
 *
 * Official octroi de mer rates by territory
 * Sources: Préfectures DOM-TOM, 2024
 */

import type { Territory } from '../types/priceAlerts';

/**
 * Taux d'octroi de mer par territoire
 * Mise à jour : Janvier 2026
 */
export const OCTROI_DE_MER_RATES: Record<Territory, number> = {
  GP: 0.025, // 2.5% - Guadeloupe
  MQ: 0.025, // 2.5% - Martinique
  GF: 0.05, // 5.0% - Guyane
  RE: 0.025, // 2.5% - La Réunion
  YT: 0.03, // 3.0% - Mayotte
  MF: 0.02, // 2.0% - Saint-Martin
  BL: 0.02, // 2.0% - Saint-Barthélemy
  PM: 0.02, // 2.0% - Saint-Pierre-et-Miquelon
  WF: 0.025, // 2.5% - Wallis-et-Futuna
  PF: 0.03, // 3.0% - Polynésie française
  NC: 0.025, // 2.5% - Nouvelle-Calédonie
  TF: 0.0, // 0.0% - Terres australes (pas d'octroi)
} as const;

/**
 * Frais de manutention en % du prix de base
 */
export const HANDLING_FEE_RATE = 0.05; // 5%

/**
 * Assurance en % de la valeur déclarée
 */
export const INSURANCE_RATE = 0.02; // 2%

/**
 * Supplément urgence par niveau
 */
export const URGENCY_SURCHARGE = {
  standard: 0, // Pas de supplément
  express: 0.3, // +30%
  urgent: 0.5, // +50%
} as const;
