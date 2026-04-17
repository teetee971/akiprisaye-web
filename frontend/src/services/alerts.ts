/**
 * Citizen Alerts Service
 * "A KI PRI SA YÉ" - User-controlled alerts based ONLY on real observed data
 *
 * NO PURCHASE INCENTIVES, NO MARKETING PUSH, NO OPAQUE NOTIFICATIONS
 * Explicit opt-in, total user control, factual and neutral alerts
 */

import type { Observation } from '../schemas/observation';
import type { PriceAnomaly } from './anomaly-detection';

/**
 * Alert types
 */
export type AlertType =
  | 'hausse_anormale' // Abnormal price increase
  | 'variation_rapide' // Rapid variation
  | 'nouvelle_donnee'; // New data available

/**
 * Alert rule status
 */
export type AlertRuleStatus = 'active' | 'inactive';

/**
 * User-defined alert rule
 */
export interface AlertRule {
  /** Unique rule ID */
  id: string;
  /** Rule name (user-defined) */
  nom: string;
  /** Alert type */
  type: AlertType;
  /** Territories to monitor */
  territoires: string[];
  /** Products to monitor (exact names or patterns) */
  produits?: string[];
  /** Categories to monitor */
  categories?: string[];
  /** Threshold percentage for variations */
  seuil_pourcent: number;
  /** Analysis period in days */
  periode_jours: number;
  /** Maximum alert frequency (hours) */
  frequence_max_heures: number;
  /** Rule status */
  statut: AlertRuleStatus;
  /** Creation date */
  date_creation: string;
  /** Last modification date */
  date_modification: string;
  /** Last alert sent date (null if never) */
  derniere_alerte?: string;
}

/**
 * Generated alert
 */
export interface Alert {
  /** Alert ID */
  id: string;
  /** Rule that triggered this alert */
  regle_id: string;
  /** Rule name */
  regle_nom: string;
  /** Alert type */
  type: AlertType;
  /** Product name */
  produit: string;
  /** Territory */
  territoire: string;
  /** Commune */
  commune?: string;
  /** Store brand (optional) */
  enseigne?: string;
  /** Observed price */
  prix_observe: number;
  /** Reference price */
  prix_reference: number;
  /** Deviation percentage */
  ecart_pourcent: number;
  /** Observation date */
  date_observation: string;
  /** Alert generation date */
  date_alerte: string;
  /** Alert message (factual, neutral) */
  message: string;
  /** Explanation of why alert was triggered */
  explication: string;
  /** Source observation ID */
  observation_id: string;
  /** Alert status */
  statut: 'non_lu' | 'lu' | 'archive';
}

/**
 * Alert statistics
 */
export interface AlertStats {
  total: number;
  non_lus: number;
  par_type: Record<AlertType, number>;
  par_territoire: Record<string, number>;
}

/**
 * Default rule configuration
 */
export const DEFAULT_RULE_CONFIG: Partial<AlertRule> = {
  seuil_pourcent: 20,
  periode_jours: 30,
  frequence_max_heures: 24,
  statut: 'active',
};

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format price
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * Check if enough time has passed since last alert
 */
function canSendAlert(rule: AlertRule): boolean {
  if (!rule.derniere_alerte) return true;

  const lastAlert = new Date(rule.derniere_alerte);
  const now = new Date();
  const hoursPassed = (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60);

  return hoursPassed >= rule.frequence_max_heures;
}

/**
 * Check if product matches rule
 */
function productMatchesRule(
  productName: string,
  productCategory: string | undefined,
  rule: AlertRule
): boolean {
  // Check products
  if (rule.produits && rule.produits.length > 0) {
    const matches = rule.produits.some((p) => productName.toLowerCase().includes(p.toLowerCase()));
    if (matches) return true;
  }

  // Check categories
  if (rule.categories && rule.categories.length > 0 && productCategory) {
    const matches = rule.categories.some((c) => productCategory.toLowerCase() === c.toLowerCase());
    if (matches) return true;
  }

  return false;
}

/**
 * Evaluate alert rule for abnormal price increase
 */
function evaluateHausseAnormale(
  rule: AlertRule,
  observations: Observation[],
  anomalies: PriceAnomaly[]
): Alert[] {
  const alerts: Alert[] = [];

  if (!canSendAlert(rule)) return alerts;

  for (const anomaly of anomalies) {
    // Check territory
    if (!rule.territoires.includes(anomaly.territoire)) continue;

    // Check product/category
    const matchesProduct = rule.produits?.some((p) =>
      anomaly.produit.toLowerCase().includes(p.toLowerCase())
    );

    if (!matchesProduct && rule.produits && rule.produits.length > 0) continue;

    // Check threshold
    if (Math.abs(anomaly.ecart_pourcent) < rule.seuil_pourcent) continue;

    // Generate alert
    const message =
      `${anomaly.territoire} — ${anomaly.produit} :\n` +
      `Prix observé : ${formatPrice(anomaly.prix_observe)}\n` +
      `Variation : ${anomaly.ecart_pourcent > 0 ? '+' : ''}${anomaly.ecart_pourcent.toFixed(1)}%\n` +
      `Source : observatoire citoyen`;

    const explication =
      `Hausse anormale détectée. Écart de ${anomaly.ecart_pourcent.toFixed(1)}% ` +
      `par rapport à la référence (${formatPrice(anomaly.prix_reference)}). ` +
      `Seuil configuré : ${rule.seuil_pourcent}%.`;

    alerts.push({
      id: generateId(),
      regle_id: rule.id,
      regle_nom: rule.nom,
      type: 'hausse_anormale',
      produit: anomaly.produit,
      territoire: anomaly.territoire,
      commune: anomaly.commune,
      enseigne: anomaly.enseigne,
      prix_observe: anomaly.prix_observe,
      prix_reference: anomaly.prix_reference,
      ecart_pourcent: anomaly.ecart_pourcent,
      date_observation: anomaly.date,
      date_alerte: new Date().toISOString(),
      message,
      explication,
      observation_id: anomaly.observation_id,
      statut: 'non_lu',
    });
  }

  return alerts;
}

/**
 * Evaluate alert rule for rapid variation
 */
function evaluateVariationRapide(rule: AlertRule, observations: Observation[]): Alert[] {
  const alerts: Alert[] = [];

  if (!canSendAlert(rule)) return alerts;

  // Group observations by product and territory
  const groups: Record<string, Observation[]> = {};

  for (const obs of observations) {
    if (!rule.territoires.includes(obs.territoire)) continue;

    for (const product of obs.produits) {
      if (!productMatchesRule(product.nom, product.categorie, rule)) continue;

      const key = `${obs.territoire}:${product.nom}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(obs);
    }
  }

  // Calculate variations
  const now = new Date();
  const cutoff = new Date(now.getTime() - rule.periode_jours * 24 * 60 * 60 * 1000);

  for (const [key, groupObs] of Object.entries(groups)) {
    const recentObs = groupObs.filter((obs) => new Date(obs.date) >= cutoff);
    if (recentObs.length < 2) continue;

    const [territoire, produit] = key.split(':');

    // Get prices
    const prices: number[] = [];
    for (const obs of recentObs) {
      for (const product of obs.produits) {
        if (product.nom === produit) {
          prices.push(product.prix_total);
        }
      }
    }

    if (prices.length < 2) continue;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const variation = ((maxPrice - minPrice) / minPrice) * 100;

    if (variation >= rule.seuil_pourcent) {
      const latestObs = recentObs.sort((a, b) => b.date.localeCompare(a.date))[0];
      let latestPrice = 0;
      for (const product of latestObs.produits) {
        if (product.nom === produit) {
          latestPrice = product.prix_total;
          break;
        }
      }

      const message =
        `${territoire} — ${produit} :\n` +
        `Variation détectée : ${variation.toFixed(1)}% sur ${rule.periode_jours} jours\n` +
        `Prix actuel : ${formatPrice(latestPrice)}\n` +
        `Source : observatoire citoyen`;

      const explication =
        `Variation rapide détectée. Écart de ${variation.toFixed(1)}% ` +
        `entre le prix minimum (${formatPrice(minPrice)}) et maximum (${formatPrice(maxPrice)}) ` +
        `sur ${rule.periode_jours} jours. Seuil configuré : ${rule.seuil_pourcent}%.`;

      alerts.push({
        id: generateId(),
        regle_id: rule.id,
        regle_nom: rule.nom,
        type: 'variation_rapide',
        produit,
        territoire,
        prix_observe: latestPrice,
        prix_reference: minPrice,
        ecart_pourcent: variation,
        date_observation: latestObs.date,
        date_alerte: new Date().toISOString(),
        message,
        explication,
        observation_id: latestObs.id,
        statut: 'non_lu',
      });
    }
  }

  return alerts;
}

/**
 * Evaluate alert rule for new data
 */
function evaluateNouvelleDonnee(rule: AlertRule, observations: Observation[]): Alert[] {
  const alerts: Alert[] = [];

  if (!canSendAlert(rule)) return alerts;

  // Get last alert date or 24h ago
  const lastCheck = rule.derniere_alerte
    ? new Date(rule.derniere_alerte)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find new observations
  for (const obs of observations) {
    if (new Date(obs.created_at) <= lastCheck) continue;
    if (!rule.territoires.includes(obs.territoire)) continue;

    for (const product of obs.produits) {
      if (!productMatchesRule(product.nom, product.categorie, rule)) continue;

      const message =
        `${obs.territoire} — Nouvelle donnée disponible :\n` +
        `${product.nom} : ${formatPrice(product.prix_total)}\n` +
        `Commune : ${obs.commune}\n` +
        `Source : observatoire citoyen`;

      const explication = `Nouvelle observation disponible pour ${product.nom} dans ${obs.territoire}.`;

      alerts.push({
        id: generateId(),
        regle_id: rule.id,
        regle_nom: rule.nom,
        type: 'nouvelle_donnee',
        produit: product.nom,
        territoire: obs.territoire,
        commune: obs.commune,
        enseigne: obs.enseigne,
        prix_observe: product.prix_total,
        prix_reference: product.prix_total,
        ecart_pourcent: 0,
        date_observation: obs.date,
        date_alerte: new Date().toISOString(),
        message,
        explication,
        observation_id: obs.id,
        statut: 'non_lu',
      });

      break; // One alert per observation
    }
  }

  return alerts;
}

/**
 * Evaluate all active alert rules
 */
export function evaluateAlertRules(
  rules: AlertRule[],
  observations: Observation[],
  anomalies: PriceAnomaly[]
): Alert[] {
  const allAlerts: Alert[] = [];

  for (const rule of rules) {
    if (rule.statut !== 'active') continue;

    let ruleAlerts: Alert[] = [];

    switch (rule.type) {
      case 'hausse_anormale':
        ruleAlerts = evaluateHausseAnormale(rule, observations, anomalies);
        break;
      case 'variation_rapide':
        ruleAlerts = evaluateVariationRapide(rule, observations);
        break;
      case 'nouvelle_donnee':
        ruleAlerts = evaluateNouvelleDonnee(rule, observations);
        break;
    }

    allAlerts.push(...ruleAlerts);
  }

  return allAlerts;
}

/**
 * Get alert statistics
 */
export function getAlertStats(alerts: Alert[]): AlertStats {
  const stats: AlertStats = {
    total: alerts.length,
    non_lus: alerts.filter((a) => a.statut === 'non_lu').length,
    par_type: {
      hausse_anormale: 0,
      variation_rapide: 0,
      nouvelle_donnee: 0,
    },
    par_territoire: {},
  };

  for (const alert of alerts) {
    stats.par_type[alert.type]++;

    if (!stats.par_territoire[alert.territoire]) {
      stats.par_territoire[alert.territoire] = 0;
    }
    stats.par_territoire[alert.territoire]++;
  }

  return stats;
}

/**
 * Create a new alert rule
 */
export function createAlertRule(params: Partial<AlertRule>): AlertRule {
  return {
    id: generateId(),
    nom: params.nom || 'Nouvelle règle',
    type: params.type || 'hausse_anormale',
    territoires: params.territoires || [],
    produits: params.produits,
    categories: params.categories,
    seuil_pourcent: params.seuil_pourcent || DEFAULT_RULE_CONFIG.seuil_pourcent!,
    periode_jours: params.periode_jours || DEFAULT_RULE_CONFIG.periode_jours!,
    frequence_max_heures: params.frequence_max_heures || DEFAULT_RULE_CONFIG.frequence_max_heures!,
    statut: params.statut || DEFAULT_RULE_CONFIG.statut!,
    date_creation: new Date().toISOString(),
    date_modification: new Date().toISOString(),
  };
}

/**
 * Update alert rule
 */
export function updateAlertRule(rule: AlertRule, updates: Partial<AlertRule>): AlertRule {
  return {
    ...rule,
    ...updates,
    id: rule.id, // Preserve ID
    date_creation: rule.date_creation, // Preserve creation date
    date_modification: new Date().toISOString(),
  };
}
