/**
 * riskEngine.ts — Platform risk detector (V8)
 *
 * Detects strategic and operational risks from platform signals and the
 * current health score.
 *
 * Risk severity:
 *   critical → act today
 *   high     → act this week
 *   medium   → monitor and plan
 *   low      → informational
 */

import type { PlatformSignals } from './executiveOS';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformRisk {
  id: string;
  type: 'revenue' | 'data' | 'retention' | 'operational' | 'seo' | 'scraping';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

// ── Detection rules ───────────────────────────────────────────────────────────

/**
 * Detect all active platform risks.
 *
 * @param signals       Raw platform signals
 * @param healthScore   Overall health score 0–100
 */
export function detectRisks(signals: PlatformSignals, healthScore: number): PlatformRisk[] {
  const risks: PlatformRisk[] = [];

  // Revenue risks
  if (signals.cashMaxProducts === 0) {
    risks.push({
      id: 'risk-no-cash-max',
      type: 'revenue',
      severity: 'critical',
      title: 'Aucun produit cash-max',
      description:
        'Revenue OS ne trouve aucun produit atteignant le seuil de 80. Les revenus affiliés seront proches de 0.',
      action: 'Vérifier le pipeline de scoring + sources de prix',
    });
  }
  if (signals.estimatedMonthlyRev < 10) {
    risks.push({
      id: 'risk-low-revenue',
      type: 'revenue',
      severity: 'high',
      title: 'Revenu mensuel estimé très faible',
      description: `Estimation : ${signals.estimatedMonthlyRev.toFixed(2)} €/mois. Sous le seuil de viabilité.`,
      action: 'Augmenter le trafic affilié ou améliorer le CTR',
    });
  }

  // Data risks
  if (signals.totalProducts < 20) {
    risks.push({
      id: 'risk-low-products',
      type: 'data',
      severity: 'high',
      title: 'Couverture produits insuffisante',
      description: `Seulement ${signals.totalProducts} produits suivis. Cible : 100+.`,
      action: 'Élargir les sources de scraping',
    });
  }
  if (!signals.lastScrapeOk) {
    risks.push({
      id: 'risk-scrape-fail',
      type: 'scraping',
      severity: 'critical',
      title: 'Dernier scraping en échec',
      description: 'La collecte de prix a échoué. Les données affichées peuvent être périmées.',
      action: 'Vérifier les workflows GitHub Actions fetch-price-data',
    });
  }

  // Retention risks
  if (signals.repeatUsers < 10) {
    risks.push({
      id: 'risk-low-retention',
      type: 'retention',
      severity: 'medium',
      title: 'Rétention utilisateur faible',
      description: `Seulement ${signals.repeatUsers} utilisateurs récurrents. Le site ne fidélise pas.`,
      action: 'Activer les favoris + push notifications personnalisés',
    });
  }

  // SEO risks
  if (signals.indexedPages < 50) {
    risks.push({
      id: 'risk-low-seo',
      type: 'seo',
      severity: 'medium',
      title: 'Couverture SEO insuffisante',
      description: `${signals.indexedPages} pages indexées. Cible : 500+.`,
      action: 'Activer la génération de pages /comparateur/:slug',
    });
  }

  // Platform stability
  if (healthScore < 45) {
    risks.push({
      id: 'risk-low-health',
      type: 'operational',
      severity: 'high',
      title: 'Santé globale de la plateforme faible',
      description: `Score de santé : ${healthScore}/100. Actions immédiates requises.`,
      action: 'Traiter les risques critiques en priorité',
    });
  }

  // No risk → informational entry
  if (risks.length === 0) {
    risks.push({
      id: 'risk-none',
      type: 'operational',
      severity: 'low',
      title: 'Aucun risque critique détecté',
      description: 'Toutes les métriques sont dans les seuils normaux.',
      action: 'Continuer la surveillance et viser la phase de scaling',
    });
  }

  return risks.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });
}
