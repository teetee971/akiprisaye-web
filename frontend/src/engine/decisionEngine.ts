/**
 * decisionEngine.ts — Executive decision backlog generator (V8)
 *
 * Generates a prioritised list of decisions from platform signals and risks.
 *
 * Each decision has:
 *   - id, priority, category, title, rationale, actions[]
 *
 * Decisions are deterministic: same inputs → same list in same order.
 */

import type { PlatformSignals } from './executiveOS';
import type { PlatformRisk } from './riskEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DecisionPriority = 'critical' | 'high' | 'medium' | 'low';
export type DecisionCategory =
  | 'content'
  | 'data'
  | 'tracking'
  | 'revenue'
  | 'distribution'
  | 'b2b'
  | 'seo'
  | 'retention';

export interface Decision {
  id: string;
  priority: DecisionPriority;
  category: DecisionCategory;
  title: string;
  rationale: string;
  actions: string[];
}

// ── Decision generator ────────────────────────────────────────────────────────

/**
 * Generate a prioritised decision backlog.
 *
 * @param signals  Raw platform signals
 * @param risks    Active risks (from riskEngine.detectRisks)
 */
export function generateDecisions(signals: PlatformSignals, risks: PlatformRisk[]): Decision[] {
  const seen = new Set<string>();
  const decisions: Decision[] = [];

  function add(d: Decision): void {
    if (seen.has(d.id)) return;
    seen.add(d.id);
    decisions.push(d);
  }

  // Critical: fix scraping first
  if (!signals.lastScrapeOk) {
    add({
      id: 'd-fix-scraping',
      priority: 'critical',
      category: 'data',
      title: 'Réparer le pipeline de scraping',
      rationale: "Aucune donnée fraîche = aucune valeur ajoutée pour l'utilisateur.",
      actions: [
        'Vérifier le workflow fetch-price-data',
        'Tester manuellement normalize-price-data',
        'Corriger les sélecteurs si la structure des pages a changé',
      ],
    });
  }

  // Critical: no cash-max products
  if (signals.cashMaxProducts === 0) {
    add({
      id: 'd-boost-cash-max',
      priority: 'critical',
      category: 'content',
      title: 'Créer du contenu sur les produits les plus rentables',
      rationale: 'Sans produits cash-max, les revenus affiliés restent proches de zéro.',
      actions: [
        'Relancer compute-product-scores',
        'Créer pages /comparateur pour top 10 produits',
        'Activer les alertes pour ces produits',
      ],
    });
  }

  // High: low product coverage
  if (signals.totalProducts < 50) {
    add({
      id: 'd-expand-data',
      priority: 'high',
      category: 'data',
      title: 'Élargir la couverture produits',
      rationale: `${signals.totalProducts} produits suivis. Cible minimum : 100+.`,
      actions: [
        'Ajouter 2 sources de prix supplémentaires',
        'Cibler catégories hygiène + boissons + conserves',
      ],
    });
  }

  // High: low SEO coverage
  if (signals.indexedPages < 100) {
    add({
      id: 'd-seo-pages',
      priority: 'high',
      category: 'seo',
      title: 'Générer des pages SEO /comparateur/:slug',
      rationale: 'Le trafic organique est le principal levier de croissance gratuite.',
      actions: [
        'Activer la route /comparateur/:slug',
        'Lancer build-domination-pages.mjs',
        'Soumettre sitemap.xml à Google Search Console',
      ],
    });
  }

  // High: low tracking
  if (signals.affiliateClicks30d < 10) {
    add({
      id: 'd-tracking',
      priority: 'high',
      category: 'tracking',
      title: 'Activer le tracking des clics affiliés',
      rationale: 'Sans données de clic, Revenue OS ne peut pas scorer les produits correctement.',
      actions: [
        "Vérifier l'intégration eventTracker.ts",
        'Tester le tracking sur une fiche produit',
        'Exporter les events vers click-export.json',
      ],
    });
  }

  // Medium: B2B outreach
  if (risks.filter((r) => r.severity !== 'critical').length > 0 && signals.totalProducts >= 20) {
    add({
      id: 'd-b2b',
      priority: 'medium',
      category: 'b2b',
      title: 'Initier la démarche partenaire B2B',
      rationale: 'Le système est suffisamment mature pour proposer une valeur aux enseignes.',
      actions: [
        'Contacter 3 enseignes avec le deck B2B',
        'Proposer le pack Starter à 99€/mois',
        'Préparer les données territoire dans un rapport PDF',
      ],
    });
  }

  // Medium: distribution
  add({
    id: 'd-social',
    priority: 'medium',
    category: 'distribution',
    title: 'Activer la distribution sociale automatique',
    rationale: 'Le contenu est généré mais non distribué. Sans trafic, pas de clics.',
    actions: [
      'Planifier 10 posts/semaine avec generate-social-posts.mjs',
      'Programmer le workflow social-blast',
      'Cibler les groupes Facebook locaux',
    ],
  });

  // Retention
  if (signals.repeatUsers < 50) {
    add({
      id: 'd-retention',
      priority: 'medium',
      category: 'retention',
      title: 'Activer les mécaniques de rétention',
      rationale: `Seulement ${signals.repeatUsers} utilisateurs récurrents.`,
      actions: [
        'Activer les favoris produits (favoritesEngine)',
        'Paramétrer les push notifications personnalisées',
        'Ajouter un bloc "Vos produits suivis" sur la homepage',
      ],
    });
  }

  return decisions.sort((a, b) => {
    const order: Record<DecisionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });
}
