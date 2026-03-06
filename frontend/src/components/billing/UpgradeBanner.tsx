/**
 * UpgradeBanner — Bandeau d'incitation à l'upgrade
 *
 * Affiché quand l'utilisateur approche ou dépasse son quota.
 * S'intègre dans n'importe quelle page via useEntitlements.
 *
 * Logique :
 * - ≥ 80 % du quota → bandeau orange "attention"
 * - 100 % → bandeau rouge "bloqué"
 * - Plan FREE/FREEMIUM → bandeau bleu "découverte" après 1 jour d'utilisation
 */

import { Link } from 'react-router-dom';
import { AlertTriangle, XCircle, Sparkles, X } from 'lucide-react';
import { useEntitlements } from '../../billing/useEntitlements';
import type { PlanId } from '../../billing/plans';
import { useState } from 'react';

/* ------------------------------------------------------------------ */
/* Plan suivant (upsell logique)                                       */
/* ------------------------------------------------------------------ */

const NEXT_PLAN: Partial<Record<PlanId, PlanId>> = {
  FREE: 'FREEMIUM',
  FREEMIUM: 'CITIZEN_PREMIUM',
  CITIZEN_PREMIUM: 'PRO',
  PRO: 'BUSINESS',
  BUSINESS: 'INSTITUTION',
};

const PLAN_LABEL: Record<PlanId, string> = {
  FREE: 'Gratuit',
  FREEMIUM: 'Freemium',
  CITIZEN_PREMIUM: 'Citoyen Premium',
  PRO: 'Pro',
  BUSINESS: 'Business',
  INSTITUTION: 'Institution',
};

const PLAN_PRICE: Partial<Record<PlanId, string>> = {
  FREEMIUM: 'gratuit',
  CITIZEN_PREMIUM: '3,99 €/mois',
  PRO: '19 €/mois',
  BUSINESS: '99 €/mois',
};

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

interface UpgradeBannerProps {
  /** Nombre d'items actuellement utilisés (ex: articles dans la liste) */
  usedItems?: number;
  /** Nombre de refreshs utilisés aujourd'hui */
  usedRefreshes?: number;
  /** Afficher même si le quota n'est pas proche (bandeau "découverte") */
  showDiscovery?: boolean;
  className?: string;
}

export function UpgradeBanner({
  usedItems,
  usedRefreshes,
  showDiscovery = false,
  className = '',
}: UpgradeBannerProps) {
  const { plan, quota } = useEntitlements();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const maxItems = quota('maxItems');
  const maxRefreshes = quota('refreshPerDay');

  // Calcul du ratio d'utilisation le plus critique
  const itemsRatio = usedItems !== undefined ? usedItems / maxItems : 0;
  const refreshRatio = usedRefreshes !== undefined ? usedRefreshes / maxRefreshes : 0;
  const maxRatio = Math.max(itemsRatio, refreshRatio);

  const nextPlan = NEXT_PLAN[plan];
  if (!nextPlan) return null; // INSTITUTION : pas d'upsell

  const nextPlanLabel = PLAN_LABEL[nextPlan];
  const nextPlanPrice = PLAN_PRICE[nextPlan];

  // Détermine le niveau d'alerte
  const isBlocked = maxRatio >= 1;
  const isWarning = maxRatio >= 0.8 && !isBlocked;
  const isDiscovery = showDiscovery && !isWarning && !isBlocked && (plan === 'FREE' || plan === 'FREEMIUM');

  if (!isBlocked && !isWarning && !isDiscovery) return null;

  // Contenu selon le niveau
  const config = isBlocked
    ? {
        bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
        icon: <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" aria-hidden="true" />,
        text: (
          <>
            <strong className="text-red-800 dark:text-red-200">Limite atteinte.</strong>{' '}
            <span className="text-red-700 dark:text-red-300">
              Passez à <strong>{nextPlanLabel}</strong> pour continuer à utiliser l'application.
            </span>
          </>
        ),
        ctaLabel: `Passer ${nextPlanLabel}`,
        ctaClass: 'bg-red-600 hover:bg-red-700 text-white',
      }
    : isWarning
    ? {
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />,
        text: (
          <>
            <strong className="text-amber-800 dark:text-amber-200">
              {Math.round(maxRatio * 100)} % de votre quota utilisé.
            </strong>{' '}
            <span className="text-amber-700 dark:text-amber-300">
              Passez à <strong>{nextPlanLabel}</strong>
              {nextPlanPrice ? ` (${nextPlanPrice})` : ''} pour éviter toute interruption.
            </span>
          </>
        ),
        ctaLabel: `Passer ${nextPlanLabel}`,
        ctaClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      }
    : {
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" aria-hidden="true" />,
        text: (
          <>
            <strong className="text-blue-800 dark:text-blue-200">Débloquez plus de fonctionnalités.</strong>{' '}
            <span className="text-blue-700 dark:text-blue-300">
              Alertes prix, historique avancé, multi-territoires — à partir de{' '}
              <strong>{PLAN_PRICE['CITIZEN_PREMIUM']}</strong>.
            </span>
          </>
        ),
        ctaLabel: 'Voir les offres',
        ctaClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${config.bg} ${className}`}
    >
      {config.icon}
      <p className="flex-1 min-w-0">{config.text}</p>
      <Link
        to={`/subscribe?plan=${nextPlan}`}
        className={`flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${config.ctaClass}`}
      >
        {config.ctaLabel}
      </Link>
      {!isBlocked && (
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fermer"
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
