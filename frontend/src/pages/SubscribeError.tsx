// src/pages/SubscribeError.tsx
/**
 * Subscription Error Page
 * Shown after a failed SumUp payment
 */
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';

export default function SubscribeError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get('reason') || "Le paiement n'a pas pu être traité.";
  const planId = searchParams.get('plan') || '';

  const retryUrl = planId ? `/subscribe?plan=${encodeURIComponent(planId)}` : '/subscribe';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <GlassContainer className="max-w-lg w-full p-8 text-center">
        {/* Error icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Paiement échoué</h1>
        <p className="text-gray-300 mb-6">
          Une erreur est survenue lors du traitement de votre paiement.
        </p>

        <GlassCard className="mb-6 text-left">
          <h2 className="text-lg font-semibold text-white mb-2">Détail de l'erreur</h2>
          <p className="text-red-300 text-sm">{reason}</p>

          <div className="mt-4 text-gray-400 text-xs space-y-1">
            <p>• Vérifiez les informations de votre carte bancaire</p>
            <p>• Assurez-vous que votre carte autorise les paiements en ligne</p>
            <p>• Contactez votre banque si le problème persiste</p>
          </div>
        </GlassCard>

        <div className="space-y-3">
          <CivicButton variant="primary" className="w-full" onClick={() => navigate(retryUrl)}>
            Réessayer le paiement
          </CivicButton>

          <CivicButton variant="secondary" className="w-full" onClick={() => navigate('/pricing')}>
            Retour aux tarifs
          </CivicButton>
        </div>

        <div className="mt-6 p-3 bg-gray-800/40 border border-white/10 rounded-lg">
          <p className="text-gray-400 text-xs">
            Besoin d'aide ? Contactez-nous à{' '}
            <a href="mailto:contact@akiprisaye.fr" className="text-blue-400 hover:underline">
              contact@akiprisaye.fr
            </a>
          </p>
        </div>
      </GlassContainer>
    </div>
  );
}
