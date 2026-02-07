// src/pages/Subscribe.tsx
/**
 * Ethical Subscription Tunnel - 3 Steps Max
 * NO dark patterns, NO hidden fields, NO pre-checked options
 * WCAG AA compliant
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';
import { LimitNote } from '@/components/ui/LimitNote';
import TerritorySelector from '@/components/TerritorySelector';

type Step = 1 | 2 | 3;

const plans = {
  CITIZEN_PREMIUM: { name: 'Citoyen Premium', monthly: 3.99, yearly: 39 },
  PRO: { name: 'Professionnel', monthly: 19, yearly: 190 },
  BUSINESS: { name: 'Business', monthly: 99, yearly: 990 },
  ENTERPRISE: { name: 'Enterprise', yearlyRange: '2 500 € - 25 000 €' },
  INSTITUTION: { name: 'Institution', yearlyRange: '500 € - 50 000 €' },
};

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>(1);
  const [planId, setPlanId] = useState(searchParams.get('plan') || 'CITIZEN_PREMIUM');
  const [cycle, setCycle] = useState(searchParams.get('cycle') || 'yearly');
  const [isDOMTerritory] = useState(searchParams.get('dom') === 'true');
  
  // Step 2 - User info
  const [email, setEmail] = useState('');
  const [territory, setTerritory] = useState('GP');
  const [usageType, setUsageType] = useState('citoyen');
  
  // Validation
  const [emailError, setEmailError] = useState('');
  
  const currentPlan = plans[planId as keyof typeof plans];
  
  // For Enterprise and Institution, use yearly range instead of monthly/yearly calculation
  const isCustomPricing = planId === 'ENTERPRISE' || planId === 'INSTITUTION';
  const price = isCustomPricing 
    ? null 
    : (cycle === 'yearly' ? currentPlan?.yearly : currentPlan?.monthly);
  const domPrice = isCustomPricing
    ? null
    : (isDOMTerritory && (planId === 'PRO' || planId === 'BUSINESS') 
      ? price * 0.7 
      : price);

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
    // In production, this would integrate with a payment processor (Stripe, etc.)
    alert(`Paiement simulé pour ${email}\nPlan: ${currentPlan.name}\nMontant: ${domPrice.toFixed(2)} €`);
    // Redirect to success page
    navigate('/subscribe/success');
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
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Récapitulatif du plan
            </h1>

            <GlassCard className="mb-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentPlan.name}
                </h2>
                {isCustomPricing ? (
                  <p className="text-4xl font-bold text-blue-400">
                    {(currentPlan as any).yearlyRange}
                    <span className="text-base text-gray-400 ml-2">/ an</span>
                  </p>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-blue-400">
                      {domPrice.toFixed(2)} €
                      <span className="text-base text-gray-400 ml-2">
                        / {cycle === 'yearly' ? 'an' : 'mois'}
                      </span>
                    </p>
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
            </GlassCard>

            <div className="mb-6 text-center">
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Vous pouvez annuler à tout moment.</strong>
              </p>
              <a href="/pricing" className="text-blue-400 hover:underline text-sm">
                Comparer les plans
              </a>
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
                  <label className="block text-white font-medium mb-2">
                    Type d'usage <span className="text-red-400">*</span>
                  </label>
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
                        ? (currentPlan as any).yearlyRange 
                        : `${domPrice.toFixed(2)} € / ${cycle === 'yearly' ? 'an' : 'mois'}`
                      }
                    </span>
                  </div>
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
