// src/pages/Subscribe.tsx
/**
 * Ethical Subscription Tunnel - 3 Steps Max
 * NO dark patterns, NO hidden fields, NO pre-checked options
 * WCAG AA compliant
 *
 * Payment processor: SumUp Pro
 */
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';
import { LimitNote } from '@/components/ui/LimitNote';
import TerritorySelector from '@/components/TerritorySelector';
import { HeroImage } from '@/components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '@/config/imageAssets';
import { canStartTrial, startTrial } from '@/services/trialService';
import SumUpPaymentForm from '@/components/SumUpPaymentForm';
import { resolveApiBaseUrl } from '@/services/apiBaseUrl';
import type { PlanId } from '@/billing/plans';
import {
  validatePromoCode,
  applyPromoDiscount,
  trackConversion,
  type PromoCode,
} from '@/services/subscriptionConversionService';

type Step = 1 | 2 | 3;

/**
 * 6 plan definitions aligned with backend SubscriptionTier enum
 * and updated to reflect actual SumUp pricing from subscriptionPlans.ts
 */
const plans: Record<
  string,
  {
    name: string;
    monthly?: number;
    yearly?: number;
    yearlyRange?: string;
    tagline?: string;
    features?: string[];
  }
> = {
  free: {
    name: 'Gratuit',
    monthly: 0,
    yearly: 0,
    tagline: 'Pour tous les citoyens ultramarins',
    features: ['Accès 29 comparateurs', '3 alertes prix', '5 exports/mois'],
  },
  citizen_premium: {
    name: 'Citoyen Premium ⭐',
    monthly: 4.99,
    yearly: 49.9,
    tagline: 'Alertes SMS, API access',
    features: [
      'Tout Gratuit +',
      '20 alertes + SMS',
      'API 1 000 req/j',
      'Exports illimités (50/mois)',
    ],
  },
  sme_freemium: {
    name: 'PME Locale',
    monthly: 29,
    yearly: 290,
    tagline: 'Profil entreprise, analytics',
    features: [
      'Tout Citoyen +',
      'Profil entreprise',
      'Suivi concurrence',
      'Support prioritaire 4h',
    ],
  },
  business_pro: {
    name: 'Business Pro',
    monthly: 79,
    yearly: 790,
    tagline: 'Webhooks, exports illimités, analytics avancés',
    features: ['Tout PME +', 'Webhooks temps réel', 'Exports illimités', 'Analytics avancés'],
  },
  institutional: {
    name: 'Institutionnel 🏛️',
    yearlyRange: 'Sur devis',
    tagline: 'Support dédié 24/7, data illimitée',
    features: ['Tout Business +', 'Support dédié 1h', 'API illimitée', 'White-label'],
  },
  research: {
    name: 'Recherche 🎓',
    yearlyRange: 'Sur devis',
    tagline: 'Pour académiques, 100k API calls/mois',
    features: ['API 100 000 req/j', 'Exports open data', 'Analytics avancés'],
  },
  // Legacy plan IDs for backward-compatibility
  CITIZEN_PREMIUM: { name: 'Citoyen Premium ⭐', monthly: 4.99, yearly: 49.9 },
  PRO: { name: 'PME Locale', monthly: 29, yearly: 290 },
  BUSINESS: { name: 'Business Pro', monthly: 79, yearly: 790 },
  ENTERPRISE: { name: 'Institutionnel 🏛️', yearlyRange: 'Sur devis' },
  INSTITUTION: { name: 'Institutionnel 🏛️', yearlyRange: 'Sur devis' },
};

/** Retrieve and persist the affiliate key from URL or localStorage */
function getAffiliateSource(searchParams: URLSearchParams): string | null {
  const affiliateFromUrl = searchParams.get('affiliate');
  if (affiliateFromUrl) {
    try {
      sessionStorage.setItem('sumup_affiliate', affiliateFromUrl);
    } catch {
      // ignore storage errors
    }
    return affiliateFromUrl;
  }
  try {
    return sessionStorage.getItem('sumup_affiliate');
  } catch {
    return null;
  }
}

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [planId, setPlanId] = useState(searchParams.get('plan') || 'citizen_premium');
  const [cycle, setCycle] = useState(searchParams.get('cycle') || 'yearly');
  const [isDOMTerritory] = useState(searchParams.get('dom') === 'true');

  // Affiliate tracking
  const affiliateSource = getAffiliateSource(searchParams);

  // 7-day trial detection
  const isTrial = searchParams.get('trial') === 'true';
  const trialAvailable = canStartTrial();

  // Promo code
  const [promoInput, setPromoInput] = useState((searchParams.get('promo') ?? '').toUpperCase());
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(() => {
    const initial = searchParams.get('promo');
    return initial ? validatePromoCode(initial) : null;
  });
  const [promoError, setPromoError] = useState('');

  // Step 2 - User info
  const [email, setEmail] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [usageType, setUsageType] = useState('citoyen');

  // Validation
  const [emailError, setEmailError] = useState('');

  // SumUp checkout state
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const currentPlan = plans[planId as keyof typeof plans];
  const currentPlanPricingMeta = currentPlan as
    | (typeof currentPlan & {
        isQuoteOnly?: boolean;
        yearlyRange?: string | null;
      })
    | undefined;

  const isCustomPricing = Boolean(
    currentPlanPricingMeta?.isQuoteOnly || currentPlanPricingMeta?.yearlyRange
  );
  const price = isCustomPricing
    ? null
    : cycle === 'yearly'
      ? currentPlan?.yearly
      : currentPlan?.monthly;

  const domPrice = isCustomPricing
    ? null
    : isDOMTerritory &&
        (planId === 'sme_freemium' ||
          planId === 'business_pro' ||
          planId === 'PRO' ||
          planId === 'BUSINESS')
      ? (price ?? 0) * 0.7
      : price;
  const finalPrice = isCustomPricing
    ? null
    : applyPromoDiscount(domPrice ?? 0, appliedPromo?.discountPct ?? 0);

  const handleApplyPromo = useCallback(() => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError('Veuillez saisir un code promo.');
      return;
    }
    const validated = validatePromoCode(code);
    if (!validated) {
      setAppliedPromo(null);
      setPromoError('Code promo invalide ou expiré.');
      return;
    }
    setAppliedPromo(validated);
    setPromoInput(validated.code);
    setPromoError('');
  }, [promoInput]);

  const activateTrialIfNeeded = () => {
    if (isTrial && trialAvailable && !isCustomPricing) {
      startTrial(planId as PlanId);
    }
  };

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email requis');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Email invalide');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleStep1Next = () => setStep(2);

  const handleStep2Next = () => {
    if (!validateEmail(email)) return;
    if (!territory) {
      toast.error('Veuillez sélectionner un territoire');
      return;
    }
    setStep(3);
  };

  /** For custom-pricing plans (institutional/research), redirect to contact */
  const handleCustomPricingContact = () => {
    navigate('/contact?subject=subscription&plan=' + encodeURIComponent(planId));
  };

  /** Create a SumUp checkout via our backend and get the checkout_id */
  const initiateSumUpCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const apiBase = resolveApiBaseUrl();
      const interval = cycle === 'yearly' ? 'yearly' : 'monthly';

      const response = await fetch(`${apiBase}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          paymentMethodId: null,
          interval,
          affiliateSource: affiliateSource || undefined,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        checkoutId?: string;
        subscription?: { id: string };
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }

      if (!data.checkoutId) {
        throw new Error('Paiement requis : identifiant de checkout manquant');
      }

      setCheckoutId(data.checkoutId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  }, [planId, cycle, email, affiliateSource, currentPlan, navigate]);

  /** Called when step 3 is reached and plan requires payment */
  useEffect(() => {
    if (step === 3 && !isCustomPricing && (price ?? 0) > 0 && !checkoutId && !checkoutLoading) {
      initiateSumUpCheckout();
    }
  }, [step, isCustomPricing, price, checkoutId, checkoutLoading, initiateSumUpCheckout]);

  const handlePaymentSuccess = () => {
    activateTrialIfNeeded();
    navigate(
      `/subscribe/success?plan=${encodeURIComponent(currentPlan?.name || planId)}&cycle=${cycle}&email=${encodeURIComponent(email)}`
    );
  };

  const handlePaymentError = (errorMsg: string) => {
    navigate(
      `/subscribe/error?reason=${encodeURIComponent(errorMsg)}&plan=${encodeURIComponent(planId)}`
    );
  };

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <GlassCard>
          <h1 className="text-2xl font-bold text-white mb-4">Plan invalide</h1>
          <p className="text-gray-300 mb-6">Le plan sélectionné n'existe pas.</p>
          <CivicButton onClick={() => navigate('/pricing')}>Retour aux tarifs</CivicButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <HeroImage
        src={PAGE_HERO_IMAGES.subscribe}
        alt="Choisir un abonnement"
        gradient="from-slate-950 to-indigo-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          🚀 Choisir un abonnement
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Accédez à toutes les fonctionnalités de la plateforme
        </p>
        {affiliateSource && (
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'rgba(134,239,172,0.85)' }}
          >
            🤝 Offre partenaire active
          </p>
        )}
      </HeroImage>

      <GlassContainer className="max-w-4xl mx-auto p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                      ? 'bg-green-600 text-white'
                      : 'bg-white/[0.08] text-gray-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
            ))}
          </div>
          <div className="text-center text-gray-300 text-sm">Étape {step} sur 3</div>
        </div>

        {/* STEP 1: Plan Confirmation */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-4 text-center">
              Récapitulatif du plan
            </h1>

            {isTrial && trialAvailable && (
              <div className="mb-4 p-4 bg-indigo-900/40 border border-indigo-500/40 rounded-xl flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">✨</span>
                <div>
                  <p className="font-bold text-indigo-200 text-sm">Essai gratuit 7 jours activé</p>
                  <p className="text-indigo-300 text-xs mt-0.5">
                    Aucun prélèvement pendant 7 jours. Annulation en 1 clic, sans engagement.
                  </p>
                </div>
              </div>
            )}
            {isTrial && !trialAvailable && (
              <div className="mb-4 p-4 bg-amber-900/40 border border-amber-500/40 rounded-xl flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-amber-200 text-sm">Essai déjà utilisé</p>
                  <p className="text-amber-300 text-xs mt-0.5">
                    Vous avez déjà bénéficié d'un essai gratuit. Abonnement classique ci-dessous.
                  </p>
                </div>
              </div>
            )}

            <GlassCard className="mb-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-1">{currentPlan.name}</h2>
                {currentPlan.tagline && (
                  <p className="text-gray-400 text-sm mb-3">{currentPlan.tagline}</p>
                )}
                {isCustomPricing ? (
                  <p className="text-4xl font-bold text-blue-400">
                    {(currentPlan as { yearlyRange?: string }).yearlyRange}
                  </p>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-blue-400">
                      {(finalPrice ?? 0).toFixed(2)} €
                      <span className="text-base text-gray-400 ml-2">
                        / {cycle === 'yearly' ? 'an' : 'mois'}
                      </span>
                    </p>
                    {cycle === 'yearly' && (
                      <p className="text-green-400 text-sm mt-1">💰 2 mois offerts vs mensuel</p>
                    )}
                    {isDOMTerritory && (planId === 'sme_freemium' || planId === 'business_pro') && (
                      <p className="text-green-400 text-sm mt-1">Prix DOM-ROM-COM (-30%)</p>
                    )}
                  </>
                )}
              </div>

              {currentPlan.features && (
                <div className="mb-6">
                  <h3 className="font-semibold text-white mb-3">Inclus dans ce plan :</h3>
                  <ul className="space-y-1.5 text-gray-300 text-sm">
                    {currentPlan.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Billing cycle toggle */}
              {!isCustomPricing && (
                <div className="mb-4">
                  <p className="text-white font-medium mb-2 text-sm">Périodicité :</p>
                  <div className="flex gap-2">
                    {(['monthly', 'yearly'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCycle(c)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          cycle === c
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white/[0.06] border-white/20 text-gray-300 hover:border-blue-500/40'
                        }`}
                      >
                        {c === 'monthly' ? 'Mensuel' : 'Annuel'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <DataBadge source="INSEE · OPMR · data.gouv.fr" />
            </GlassCard>

            {/* Promo code input */}
            {!isCustomPricing && (
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    placeholder="Code promo (ex: WELCOME50)"
                    className="flex-1 px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                    aria-label="Code promo"
                  />
                  <CivicButton variant="secondary" onClick={handleApplyPromo} className="shrink-0">
                    Appliquer
                  </CivicButton>
                </div>
                {promoError && <p className="text-red-400 text-sm mt-1">{promoError}</p>}
                {appliedPromo && (
                  <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                    <span>🎉</span>
                    <span>
                      <strong>{appliedPromo.label}</strong> appliqué — {appliedPromo.discountPct}%
                      de réduction
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6 text-center">
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Vous pouvez annuler à tout moment.</strong>
              </p>
              <Link to="/pricing" className="text-blue-400 hover:underline text-sm">
                Comparer les plans
              </Link>
            </div>

            <div className="flex gap-4">
              <CivicButton
                variant="secondary"
                className="flex-1"
                onClick={() => navigate('/pricing')}
              >
                Retour
              </CivicButton>
              <CivicButton variant="primary" className="flex-1" onClick={handleStep1Next}>
                Continuer
              </CivicButton>
            </div>
          </div>
        )}

        {/* STEP 2: User Information */}
        {step === 2 && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Informations minimales
            </h1>

            <GlassCard className="mb-6">
              <p className="text-gray-300 text-sm mb-6">
                Nous collectons uniquement les données strictement nécessaires.
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-white font-medium mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    onBlur={() => validateEmail(email)}
                    className="w-full px-4 py-3 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    placeholder="votre@email.fr"
                    required
                    aria-required="true"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                  {emailError && (
                    <p id="email-error" className="text-red-400 text-sm mt-1">
                      {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="territory" className="block text-white font-medium mb-2">
                    Territoire principal <span className="text-red-400">*</span>
                  </label>
                  <TerritorySelector value={territory} onChange={setTerritory} className="w-full" />
                </div>

                <div>
                  <p className="block text-white font-medium mb-2">
                    Type d'usage <span className="text-red-400">*</span>
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {['citoyen', 'pro', 'organisation'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setUsageType(type)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                          usageType === type
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white/[0.08] border-white/[0.22] text-gray-300 hover:border-blue-500/40'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <LimitNote>
                <p className="text-sm">
                  <strong>Aucune adresse postale</strong> n'est collectée pour les citoyens.
                  <br />
                  Vos données restent sur votre appareil (localStorage).
                </p>
              </LimitNote>
            </GlassCard>

            <div className="flex gap-4">
              <CivicButton variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                Retour
              </CivicButton>
              <CivicButton variant="primary" className="flex-1" onClick={handleStep2Next}>
                Continuer
              </CivicButton>
            </div>
          </div>
        )}

        {/* STEP 3: Payment */}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Confirmation et paiement
            </h1>

            <GlassCard className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Récapitulatif</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>Plan :</span>
                  <span className="text-white font-medium">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Périodicité :</span>
                  <span className="text-white font-medium">
                    {cycle === 'yearly' ? 'Annuel' : 'Mensuel'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Email :</span>
                  <span className="text-white font-medium">{email}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Territoire :</span>
                  <span className="text-white font-medium">{territory}</span>
                </div>

                <div className="border-t border-white/[0.22] pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total :</span>
                    <span className="text-blue-400">
                      {isCustomPricing
                        ? (currentPlan as { yearlyRange?: string }).yearlyRange
                        : `${(finalPrice ?? 0).toFixed(2)} € / ${cycle === 'yearly' ? 'an' : 'mois'}`}
                    </span>
                  </div>
                  {appliedPromo && !isCustomPricing && (
                    <p className="text-green-400 text-xs mt-1 text-right">
                      🎉 Code <strong>{appliedPromo.code}</strong> appliqué —{' '}
                      {appliedPromo.discountPct}% de réduction
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Vous ne payez pas la donnée</strong>, vous payez le service :
                  l'agrégation, la maintenance, le calcul d'optimisation et l'hébergement sécurisé.
                </p>
              </div>

              {/* SumUp Payment form — only shown for paid non-custom plans */}
              {!isCustomPricing && (finalPrice ?? 0) > 0 && (
                <div className="mt-6">
                  {checkoutError && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
                      {checkoutError}
                    </div>
                  )}
                  {checkoutLoading && (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
                      <span className="ml-2 text-gray-300 text-sm">
                        Initialisation du paiement SumUp…
                      </span>
                    </div>
                  )}
                  {checkoutId && (
                    <SumUpPaymentForm
                      checkoutId={checkoutId}
                      amount={finalPrice ?? 0}
                      currency="EUR"
                      planName={currentPlan.name}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  )}
                </div>
              )}

              {/* Free plan confirmation */}
              {!isCustomPricing && (domPrice ?? 0) === 0 && (
                <div className="mt-4">
                  <LimitNote>
                    <p className="text-sm">
                      <strong>Résiliation en 1 clic</strong> depuis votre compte.
                      <br />
                      Aucune justification requise. Aucune relance.
                    </p>
                  </LimitNote>
                </div>
              )}

              {/* Custom pricing — redirect to contact */}
              {isCustomPricing && (
                <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                  <p className="text-indigo-200 text-sm mb-3">
                    Ce plan est sur devis. Notre équipe vous contactera sous 24h.
                  </p>
                  <CivicButton
                    variant="primary"
                    className="w-full"
                    onClick={handleCustomPricingContact}
                  >
                    Demander un devis
                  </CivicButton>
                </div>
              )}
            </GlassCard>

            {/* Back button and free plan confirm */}
            <div className="flex gap-4">
              <CivicButton
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(2)}
                disabled={checkoutLoading}
              >
                Retour
              </CivicButton>
              {!isCustomPricing && (domPrice ?? 0) === 0 && (
                <CivicButton
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    activateTrialIfNeeded();
                    navigate(
                      `/subscribe/success?plan=${encodeURIComponent(currentPlan.name)}&cycle=${cycle}&email=${encodeURIComponent(email)}`
                    );
                  }}
                >
                  Confirmer (gratuit)
                </CivicButton>
              )}
            </div>
          </div>
        )}
      </GlassContainer>
    </div>
  );
}
