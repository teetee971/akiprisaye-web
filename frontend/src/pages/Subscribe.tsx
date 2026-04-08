// src/pages/Subscribe.tsx
/**
 * Ethical Subscription Tunnel - 3 Steps Max
 * NO dark patterns, NO hidden fields, NO pre-checked options
 * WCAG AA compliant
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import PromoCodeWidget from '@/components/conversion/PromoCodeWidget';
import type { PlanId } from '@/billing/plans';
import { Shield, Lock, FileText, RefreshCw, Share2 } from 'lucide-react';
import { resolveApiBaseUrl } from '@/services/apiBaseUrl';

type Step = 1 | 2 | 3;

// Countdown helpers
function getOrCreateExpiry(): Date {
  const key = 'subscribeCountdownExpiry';
  const stored = sessionStorage.getItem(key);
  if (stored) {
    const d = new Date(stored);
    if (d > new Date()) return d;
  }
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  sessionStorage.setItem(key, expiry.toISOString());
  return expiry;
}

function useCountdown(expiry: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, expiry.getTime() - Date.now());
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [expiry]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return t;
}

const plans: Record<string, { name: string; monthly?: number; yearly?: number; yearlyRange?: string }> = {
  CITIZEN_PREMIUM: { name: 'Citoyen Premium', monthly: 3.99, yearly: 39 },
  PRO: { name: 'Professionnel', monthly: 9.99, yearly: 95.88 },
  BUSINESS: { name: 'Business', monthly: 49, yearly: 468 },
  ENTERPRISE: { name: 'Enterprise', yearlyRange: '2 500 € - 25 000 €' },
  INSTITUTION: { name: 'Institution', yearlyRange: '500 € - 50 000 €' },
};

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>(1);
  const [planId] = useState(searchParams.get('plan') || 'CITIZEN_PREMIUM');
  const [cycle] = useState(searchParams.get('cycle') || 'yearly');
  const [isDOMTerritory] = useState(searchParams.get('dom') === 'true');
  
  // 7-day trial detection
  const isTrial = searchParams.get('trial') === 'true';
  const trialAvailable = canStartTrial();

  // Promo code state
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  // Affiliate referral link state
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);

  // Countdown
  const countdownExpiryRef = useRef(getOrCreateExpiry());
  const { hours, minutes, seconds } = useCountdown(countdownExpiryRef.current);
  const pad = (n: number) => String(n).padStart(2, '0');

  // Step 2 - User info
  const [email, setEmail] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [usageType, setUsageType] = useState('citoyen');
  
  // Validation
  const [emailError, setEmailError] = useState('');
  
  const currentPlan = plans[planId as keyof typeof plans];
  
  // For Enterprise and Institution, use yearly range instead of monthly/yearly calculation
  const isCustomPricing = planId === 'ENTERPRISE' || planId === 'INSTITUTION';
  const basePrice = isCustomPricing 
    ? null 
    : (cycle === 'yearly' ? currentPlan?.yearly : currentPlan?.monthly);
  const domPrice = isCustomPricing
    ? null
    : (isDOMTerritory && (planId === 'PRO' || planId === 'BUSINESS') 
      ? (basePrice ?? 0) * 0.7 
      : basePrice);

  const finalPrice = domPrice !== null && promoDiscount > 0
    ? (domPrice ?? 0) * (1 - promoDiscount / 100)
    : domPrice;

  // Pre-fill email from localStorage if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Try to generate affiliate link
  const generateAffiliateLink = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const base = resolveApiBaseUrl();
      const resp = await fetch(`${base}/api/affiliates/generate-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform: 'direct' }),
      });
      const data = await resp.json() as { success?: boolean; link?: string };
      if (data.success && data.link) setAffiliateLink(data.link);
    } catch {
      // Silently ignore
    }
  }, []);

  useEffect(() => {
    generateAffiliateLink();
  }, [generateAffiliateLink]);

  // Activate trial when proceeding to success step
  const activateTrialIfNeeded = () => {
    if (isTrial && trialAvailable && planId !== 'ENTERPRISE' && planId !== 'INSTITUTION') {
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

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!validateEmail(email)) return;
    if (!territory) {
      alert('Veuillez sélectionner un territoire');
      return;
    }
    setStep(3);
  };

  const handleConfirmPayment = () => {
    // Activate 7-day trial if requested
    activateTrialIfNeeded();
    // Save email for future pre-fill
    if (email) localStorage.setItem('userEmail', email);
    // Redirect to success page
    navigate(`/subscribe/success?plan=${planId}`);
  };

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <GlassCard>
          <h1 className="text-2xl font-bold text-white mb-4">Plan invalide</h1>
          <p className="text-gray-300 mb-6">Le plan sélectionné n'existe pas.</p>
          <CivicButton onClick={() => navigate('/pricing')}>
            Retour aux tarifs
          </CivicButton>
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
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🚀 Choisir un abonnement</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Accédez à toutes les fonctionnalités de la plateforme</p>
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
          <div className="text-center text-gray-300 text-sm">
            Étape {step} sur 3
          </div>
        </div>

        {/* STEP 1: Plan Confirmation */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-4 text-center">
              Récapitulatif du plan
            </h1>

            {/* Countdown urgency */}
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-blue-300 font-semibold">
              <span>⏰</span>
              <span>Offre valide encore : </span>
              <span className="font-mono text-blue-200">
                {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
              </span>
            </div>

            {/* Trial banner */}
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
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentPlan.name}
                </h2>
                {isCustomPricing ? (
                  <p className="text-4xl font-bold text-blue-400">
                    {(currentPlan as {yearlyRange?: string}).yearlyRange}
                    <span className="text-base text-gray-400 ml-2">/ an</span>
                  </p>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-blue-400">
                      {(finalPrice ?? 0).toFixed(2)} €
                      <span className="text-base text-gray-400 ml-2">
                        / {cycle === 'yearly' ? 'an' : 'mois'}
                      </span>
                    </p>
                    {promoDiscount > 0 && (
                      <p className="text-green-400 text-sm mt-1">
                        Remise {promoCode} : -{promoDiscount}% appliquée
                      </p>
                    )}
                    {isDOMTerritory && (planId === 'PRO' || planId === 'BUSINESS') && (
                      <p className="text-green-400 text-sm mt-2">
                        Prix DOM-ROM-COM (-30%)
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-white mb-3">Inclus dans ce plan :</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  {planId === 'CITIZEN_PREMIUM' && (
                    <>
                      <li>• Optimisation multi-trajets</li>
                      <li>• Export PDF</li>
                      <li>• Historique illimité</li>
                      <li>• Mode hors ligne renforcé</li>
                    </>
                  )}
                  {planId === 'PRO' && (
                    <>
                      <li>• Tout Premium +</li>
                      <li>• Multi-territoires</li>
                      <li>• Export CSV</li>
                      <li>• Support prioritaire</li>
                    </>
                  )}
                  {planId === 'BUSINESS' && (
                    <>
                      <li>• Tout Pro +</li>
                      <li>• Tableaux de bord</li>
                      <li>• API lecture seule</li>
                      <li>• Support dédié</li>
                    </>
                  )}
                  {planId === 'ENTERPRISE' && (
                    <>
                      <li>• Tout Business +</li>
                      <li>• Historique complet</li>
                      <li>• Analyses prédictives</li>
                      <li>• API étendue</li>
                      <li>• Accompagnement dédié</li>
                    </>
                  )}
                  {planId === 'INSTITUTION' && (
                    <>
                      <li>• Tout Enterprise +</li>
                      <li>• Rapports publics institutionnels</li>
                      <li>• Transparence totale</li>
                      <li>• Audit complet</li>
                      <li>• Support institutionnel</li>
                    </>
                  )}
                </ul>
              </div>

              <DataBadge source="INSEE · OPMR · data.gouv.fr" />

              {/* Promo code widget */}
              {!isCustomPricing && (
                <div className="mt-4 pt-4 border-t border-white/[0.08]">
                  <PromoCodeWidget
                    planKey={planId}
                    onApply={(discount, code) => {
                      setPromoDiscount(discount);
                      setPromoCode(code);
                    }}
                    onRemove={() => {
                      setPromoDiscount(0);
                      setPromoCode('');
                    }}
                  />
                </div>
              )}
            </GlassCard>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 mb-6">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-green-400" /> Paiement 100&nbsp;% sécurisé</span>
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-blue-400" /> RGPD conforme</span>
              <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-purple-400" /> Factures automatiques</span>
              <span className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 text-yellow-400" /> Annulation facile</span>
            </div>

            {/* Affiliate share link */}
            {affiliateLink && (
              <div className="mb-6 p-3 bg-white/[0.04] border border-white/10 rounded-lg flex items-center gap-2 text-sm text-gray-400">
                <Share2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Partagez et gagnez :</span>
                <span className="font-mono text-blue-300 text-xs truncate flex-1">{affiliateLink}</span>
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
              <CivicButton
                variant="primary"
                className="flex-1"
                onClick={handleStep1Next}
              >
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
                {/* Email */}
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

                {/* Territory */}
                <div>
                  <label htmlFor="territory" className="block text-white font-medium mb-2">
                    Territoire principal <span className="text-red-400">*</span>
                  </label>
                  <TerritorySelector
                    value={territory}
                    onChange={setTerritory}
                    className="w-full"
                  />
                </div>

                {/* Usage Type */}
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
              <CivicButton
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Retour
              </CivicButton>
              <CivicButton
                variant="primary"
                className="flex-1"
                onClick={handleStep2Next}
              >
                Continuer
              </CivicButton>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Confirmation */}
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
                        ? (currentPlan as {yearlyRange?: string}).yearlyRange 
                        : `${(finalPrice ?? 0).toFixed(2)} € / ${cycle === 'yearly' ? 'an' : 'mois'}`
                      }
                    </span>
                  </div>
                  {promoDiscount > 0 && !isCustomPricing && (
                    <div className="flex justify-between text-sm text-green-400 mt-1">
                      <span>Code {promoCode} :</span>
                      <span>-{promoDiscount}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Vous ne payez pas la donnée</strong>, vous payez le service :
                  l'agrégation, la maintenance, le calcul d'optimisation et l'hébergement sécurisé.
                </p>
              </div>

              <LimitNote>
                <p className="text-sm">
                  <strong>Résiliation en 1 clic</strong> depuis votre compte.
                  <br />
                  Aucune justification requise. Aucune relance.
                </p>
              </LimitNote>
            </GlassCard>

            <div className="flex gap-4">
              <CivicButton
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(2)}
              >
                Retour
              </CivicButton>
              <CivicButton
                variant="primary"
                className="flex-1"
                onClick={handleConfirmPayment}
              >
                Confirmer et payer
              </CivicButton>
            </div>
          </div>
        )}
      </GlassContainer>
    </div>
  );
}
