/**
 * UpgradePage — Page d'incitation à l'upgrade
 *
 * Affiche :
 * - Le plan actuel de l'utilisateur avec ses limites
 * - Le plan suivant recommandé avec les bénéfices concrets
 * - Une comparaison rapide avec tous les plans supérieurs
 * - Des CTA vers /subscribe?plan=...
 */

import { Link } from 'react-router-dom';
import { Check, ArrowRight, Sparkles, TrendingUp, Bell, Download, Globe, BarChart2, Lock } from 'lucide-react';
import { useEntitlements } from '../billing/useEntitlements';
import type { PlanId } from '../billing/plans';
import { PLAN_DEFINITIONS } from '../billing/plans';
import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/* ------------------------------------------------------------------ */
/* Métadonnées des plans pour l'UI                                     */
/* ------------------------------------------------------------------ */

interface PlanMeta {
  label: string;
  tagline: string;
  price: string;
  color: string;
  features: string[];
}

const PLAN_META: Record<PlanId, PlanMeta> = {
  FREE: {
    label: 'Gratuit',
    tagline: 'Accès basique',
    price: '0 €',
    color: 'slate',
    features: ['30 articles', '10 actualisations/jour', 'Historique basique', 'Export CSV basique'],
  },
  FREEMIUM: {
    label: 'Freemium',
    tagline: 'Accès étendu gratuit',
    price: '0 €',
    color: 'slate',
    features: ['50 articles', '20 actualisations/jour', 'Historique basique', '3 territoires'],
  },
  CITIZEN_PREMIUM: {
    label: 'Citoyen Premium',
    tagline: 'Outil citoyen complet',
    price: '3,99 €/mois',
    color: 'blue',
    features: [
      '100 articles',
      '50 actualisations/jour',
      'Historique avancé 12 mois ✨',
      'Alertes prix ✨',
      'Export CSV',
      '2 territoires',
    ],
  },
  PRO: {
    label: 'Pro',
    tagline: 'Pour pros & analystes',
    price: '19 €/mois',
    color: 'violet',
    features: [
      '300 articles',
      '500 actualisations/jour',
      'Historique avancé',
      'Alertes prix',
      'Export CSV + JSON ✨',
      '5 territoires ✨',
    ],
  },
  BUSINESS: {
    label: 'Business',
    tagline: 'Pour équipes',
    price: '99 €/mois',
    color: 'emerald',
    features: [
      '2 000 articles',
      '5 000 actualisations/jour',
      'Listes partagées ✨',
      'Tableau de bord budget ✨',
      'Export avancé',
      '10 territoires',
    ],
  },
  INSTITUTION: {
    label: 'Institution',
    tagline: 'Licence sur devis',
    price: 'Sur devis',
    color: 'amber',
    features: [
      '20 000 articles',
      'Actualisations illimitées',
      'Rapports automatiques ✨',
      'Accès API ✨',
      '20 territoires',
    ],
  },
};

const NEXT_PLAN: Partial<Record<PlanId, PlanId>> = {
  FREE: 'CITIZEN_PREMIUM',
  FREEMIUM: 'CITIZEN_PREMIUM',
  CITIZEN_PREMIUM: 'PRO',
  PRO: 'BUSINESS',
  BUSINESS: 'INSTITUTION',
};

const UPGRADE_BENEFITS: Partial<Record<PlanId, { icon: React.ReactNode; title: string; description: string }[]>> = {
  CITIZEN_PREMIUM: [
    {
      icon: <Bell className="w-5 h-5 text-blue-500" />,
      title: 'Alertes prix automatiques',
      description: 'Recevez une notification dès qu\'un produit passe sous votre seuil cible.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      title: 'Historique 12 mois',
      description: 'Analysez l\'évolution réelle des prix et anticipez les meilleures périodes d\'achat.',
    },
  ],
  PRO: [
    {
      icon: <Globe className="w-5 h-5 text-violet-500" />,
      title: 'Multi-territoires',
      description: 'Comparez les prix entre Guadeloupe, Martinique, Guyane et Réunion en un coup d\'œil.',
    },
    {
      icon: <Download className="w-5 h-5 text-violet-500" />,
      title: 'Export CSV & JSON',
      description: 'Téléchargez vos données pour vos analyses, rapports ou comptabilité.',
    },
  ],
  BUSINESS: [
    {
      icon: <BarChart2 className="w-5 h-5 text-emerald-500" />,
      title: 'Tableau de bord budget',
      description: 'Pilotez les dépenses de votre organisation avec des analyses détaillées.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: 'Listes partagées',
      description: 'Collaborez en temps réel sur les achats de votre équipe ou association.',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

export default function UpgradePage() {
  const { plan, quota } = useEntitlements();
  const currentMeta = PLAN_META[plan];
  const nextPlanId = NEXT_PLAN[plan];
  const nextMeta = nextPlanId ? PLAN_META[nextPlanId] : null;
  const nextBenefits = nextPlanId ? (UPGRADE_BENEFITS[nextPlanId] ?? []) : [];

  const isTopPlan = !nextPlanId;

  // Plans supérieurs au plan actuel
  const planOrder: PlanId[] = ['FREE', 'FREEMIUM', 'CITIZEN_PREMIUM', 'PRO', 'BUSINESS', 'INSTITUTION'];
  const currentIndex = planOrder.indexOf(plan);
  const higherPlans = planOrder.slice(currentIndex + 1);

  return (
    <>
      <Helmet>
        <title>Passer à un plan supérieur — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Débloquez l'historique avancé, les alertes prix, le multi-territoires et plus encore."
        />
      </Helmet>

      <HeroImage
        src={PAGE_HERO_IMAGES.upgradePage}
        alt="Passer à Premium"
        gradient="from-slate-950 to-amber-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>⭐ Passer à Premium</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Débloquez toutes les fonctionnalités avancées</p>
      </HeroImage>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-10">

          {/* ---- Plan actuel ---- */}
          <section>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Votre plan actuel
              </p>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {currentMeta.label}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentMeta.tagline}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                    {currentMeta.price}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {quota('maxItems')} articles · {quota('refreshPerDay')} actualisations/jour
                  </p>
                </div>
              </div>
            </div>
          </section>

          {isTopPlan ? (
            /* Plan Institution : pas d'upsell mais invitation au contact */
            <section className="text-center space-y-4">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Vous êtes sur le plan le plus complet !
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Besoin d'une extension ou d'options sur mesure ? Contactez-nous.
              </p>
              <Link
                to="/contact?subject=extension-institution"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
              >
                Nous contacter
              </Link>
            </section>
          ) : (
            <>
              {/* ---- Plan recommandé ---- */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Recommandé pour vous
                </p>
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-full px-3 py-1 mb-2">
                        <Sparkles className="w-3 h-3" />
                        Étape suivante
                      </span>
                      <h2 className="text-2xl font-extrabold">{nextMeta!.label}</h2>
                      <p className="text-blue-100 text-sm mt-0.5">{nextMeta!.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold">{nextMeta!.price}</p>
                      {nextPlanId !== 'INSTITUTION' && (
                        <p className="text-blue-200 text-xs mt-0.5">ou annuel (−17 %)</p>
                      )}
                    </div>
                  </div>

                  {/* Bénéfices concrets */}
                  {nextBenefits.length > 0 && (
                    <ul className="space-y-3 mb-6">
                      {nextBenefits.map((b) => (
                        <li key={b.title} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                            {b.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{b.title}</p>
                            <p className="text-blue-100 text-xs">{b.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Features incluses */}
                  <ul className="grid grid-cols-2 gap-1.5 mb-6">
                    {nextMeta!.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-blue-50">
                        <Check className="w-3.5 h-3.5 text-green-300 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA principal */}
                  {nextPlanId === 'INSTITUTION' ? (
                    <Link
                      to="/contact?subject=licence-institutionnelle"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors text-sm"
                    >
                      Demander un devis
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex gap-3 flex-wrap">
                      <Link
                        to={`/subscribe?plan=${nextPlanId}&cycle=monthly`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors text-sm"
                      >
                        Passer à {nextMeta!.label}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/subscribe?plan=${nextPlanId}&cycle=yearly`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-400 transition-colors text-sm border border-white/30"
                      >
                        Annuel (−17 %)
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              {/* ---- Autres plans disponibles ---- */}
              {higherPlans.length > 1 && (
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Autres options disponibles
                  </p>
                  <div className="space-y-3">
                    {higherPlans.slice(1).map((planId) => {
                      const meta = PLAN_META[planId];
                      const def = PLAN_DEFINITIONS[planId];
                      return (
                        <div
                          key={planId}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                                {meta.label}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {def.quotas.maxItems} articles · {def.quotas.maxTerritories} territoires
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {meta.price}
                            </span>
                            {planId === 'INSTITUTION' ? (
                              <Link
                                to="/contact?subject=licence-institutionnelle"
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                Devis
                              </Link>
                            ) : (
                              <Link
                                to={`/subscribe?plan=${planId}`}
                                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                Choisir
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          {/* ---- Lien retour ---- */}
          <div className="text-center">
            <Link to="/pricing" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Voir la comparaison complète des plans →
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
