/**
 * Règles de gain de crédits et multiplicateurs
 * A KI PRI SA YÉ - Version 1.0.0
 */

/**
 * Montant de crédits gagnés par type de contribution
 */
export const CREDIT_EARNING_RULES: Record<string, number> = {
  // Signalements eau
  water_status_report: 5,
  water_leak_report: 10,
  water_quality_report: 8,
  
  // Cyclones & catastrophes
  cyclone_shelter_update: 20,
  cyclone_damage_report: 15,
  
  // Prix & comparateurs
  price_contribution: 5,
  price_photo_proof: 10,
  store_hours_update: 3,
  
  // Formations & emploi
  training_feedback: 15,
  job_offer_verification: 10,
  
  // Transports
  transport_delay_report: 5,
  transport_schedule_update: 8,
  
  // Général
  photo_proof: 10,
  verified_contribution: 25, // Bonus si vérifiée par admin
  
  // Engagement
  referral_signup: 100, // Parrainage
  monthly_active: 50, // Bonus activité mensuelle (10+ contributions)
  weekly_streak: 20, // Streak 7 jours consécutifs
  
  // Qualité
  helpful_vote: 2, // Contribution marquée "utile" par autre user
  expert_badge: 500, // Obtention badge expert
  
  // Badges
  badge_unlock: 0, // Variable selon le badge
};

/**
 * Multiplicateurs appliqués selon contexte
 */
export const CREDIT_MULTIPLIERS = {
  first_contribution_day: 1.5, // Première contrib du jour
  verified_by_admin: 2.0, // Admin vérifie
  urgency: 1.5, // Contrib pendant crise (cyclone, etc.)
  quality: 1.3, // Contribution détaillée (desc + photo)
};

/**
 * Conversion crédits → euros
 * 1 crédit = 0.10€ (configurable)
 */
export const CREDIT_TO_EUR = 0.10;

/**
 * Minimum de crédits pour redemption
 * 100 crédits = 10€
 */
export const MIN_REDEMPTION_CREDITS = 100;

/**
 * Pourcentage des revenus B2B redistribués
 */
export const B2B_REDISTRIBUTION_PERCENTAGE = 0.50; // 50%
