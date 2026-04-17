/**
 * UpgradeGate — Verrou de fonctionnalité avec upsell contextuel
 *
 * Utilisation :
 *   <UpgradeGate feature="PRICE_ALERTS">
 *     <AlertsForm />
 *   </UpgradeGate>
 *
 * - Si le plan courant a accès : affiche les enfants
 * - Sinon : affiche une carte verrouillée avec le plan requis et un CTA
 */

import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Sparkles,
  TrendingUp,
  Bell,
  Download,
  Globe,
  Users,
  BarChart2,
  FileText,
  Code2,
} from 'lucide-react';
import { useEntitlements } from '../../billing/useEntitlements';
import type { FeatureId, PlanId } from '../../billing/plans';

/* ------------------------------------------------------------------ */
/* Config des features visibles par l'utilisateur                     */
/* ------------------------------------------------------------------ */

interface FeatureMeta {
  label: string;
  description: string;
  icon: ReactNode;
  requiredPlan: PlanId;
  benefit: string; // bénéfice concret affiché dans la carte
}

const FEATURE_META: Partial<Record<FeatureId, FeatureMeta>> = {
  PRICE_HISTORY_ADVANCED: {
    label: 'Historique avancé',
    description: 'Évolution des prix sur 12 mois avec courbes multi-enseignes.',
    icon: <TrendingUp className="w-5 h-5" />,
    requiredPlan: 'CITIZEN_PREMIUM',
    benefit: "Suivez les tendances de prix sur 12 mois pour mieux choisir votre moment d'achat.",
  },
  PRICE_ALERTS: {
    label: 'Alertes prix',
    description: 'Notifiez-vous quand un produit passe sous votre seuil.',
    icon: <Bell className="w-5 h-5" />,
    requiredPlan: 'CITIZEN_PREMIUM',
    benefit:
      'Soyez le premier informé des baisses de prix. Ne ratez plus jamais une bonne affaire.',
  },
  EXPORT_ADVANCED: {
    label: 'Export avancé',
    description: 'Export CSV, JSON et PDF de vos données de prix.',
    icon: <Download className="w-5 h-5" />,
    requiredPlan: 'PRO',
    benefit: 'Exportez vos données pour vos analyses, rapports ou comptabilité.',
  },
  MULTI_TERRITORY: {
    label: 'Multi-territoires',
    description: 'Comparez les prix entre Guadeloupe, Martinique, Guyane et Réunion.',
    icon: <Globe className="w-5 h-5" />,
    requiredPlan: 'PRO',
    benefit: 'Comparez les prix entre territoires et identifiez les meilleures opportunités.',
  },
  SHARED_LISTS: {
    label: 'Listes partagées',
    description: 'Partagez vos listes de courses avec votre équipe.',
    icon: <Users className="w-5 h-5" />,
    requiredPlan: 'BUSINESS',
    benefit: 'Collaborez en temps réel sur les achats de votre organisation.',
  },
  DASHBOARD_BUDGET: {
    label: 'Tableau de bord budget',
    description: 'Suivez vos dépenses et économies par catégorie.',
    icon: <BarChart2 className="w-5 h-5" />,
    requiredPlan: 'BUSINESS',
    benefit: 'Pilotez votre budget avec des analyses claires et des rapports automatiques.',
  },
  REPORTS_AUTO: {
    label: 'Rapports automatiques',
    description: 'Rapports périodiques envoyés par email.',
    icon: <FileText className="w-5 h-5" />,
    requiredPlan: 'INSTITUTION',
    benefit: 'Recevez automatiquement vos rapports institutionnels chaque semaine.',
  },
  API_ACCESS: {
    label: 'Accès API',
    description: 'Intégrez les données de prix dans vos propres outils.',
    icon: <Code2 className="w-5 h-5" />,
    requiredPlan: 'INSTITUTION',
    benefit: "Intégrez les données dans vos systèmes d'information ou tableaux de bord.",
  },
};

const PLAN_LABEL: Record<PlanId, string> = {
  FREE: 'Gratuit',
  FREEMIUM: 'Freemium',
  CITIZEN_PREMIUM: 'Citoyen Premium',
  PRO: 'Pro',
  BUSINESS: 'Business',
  INSTITUTION: 'Institution',
  CREATOR: 'Créateur',
};

const PLAN_PRICE: Partial<Record<PlanId, string>> = {
  CITIZEN_PREMIUM: '3,99 €/mois',
  PRO: '19 €/mois',
  BUSINESS: '99 €/mois',
};

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

interface UpgradeGateProps {
  feature: FeatureId;
  children: ReactNode;
  /** Rendu alternatif compact (inline, sans carte complète) */
  compact?: boolean;
}

export function UpgradeGate({ feature, children, compact = false }: UpgradeGateProps) {
  const { can, explain } = useEntitlements();

  if (can(feature)) return <>{children}</>;

  const meta = FEATURE_META[feature];
  const requiredPlan = meta?.requiredPlan ?? 'PRO';
  const planLabel = PLAN_LABEL[requiredPlan];
  const price = PLAN_PRICE[requiredPlan];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm">
        <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
        <span className="text-slate-500 dark:text-slate-400">{explain(feature)}</span>
        <Link
          to={`/subscribe?plan=${requiredPlan}`}
          className="ml-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
        >
          Passer {planLabel} →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 text-center"
      role="region"
      aria-label={`Fonctionnalité verrouillée : ${meta?.label ?? feature}`}
    >
      {/* Icône + verrou */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500">
            {meta?.icon ?? <Sparkles className="w-6 h-6" />}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <Lock className="w-3 h-3 text-slate-500" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Titre */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
        {meta?.label ?? 'Fonctionnalité avancée'}
      </h3>

      {/* Description bénéfice */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-xs mx-auto">
        {meta?.benefit ?? explain(feature)}
      </p>

      {/* Badge plan requis */}
      <div className="inline-flex items-center gap-1.5 mb-5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
          Disponible avec {planLabel}
          {price ? ` — ${price}` : ''}
        </span>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link
          to={`/subscribe?plan=${requiredPlan}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Passer à {planLabel}
        </Link>
        <Link
          to="/pricing"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Voir tous les plans
        </Link>
      </div>
    </div>
  );
}
