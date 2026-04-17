// src/pages/SubscribeSuccess.tsx
/**
 * Subscription Success Page
 * Shown after a successful SumUp payment
 */
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';

export default function SubscribeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const planName = searchParams.get('plan') || 'Votre abonnement';
  const billingCycle = searchParams.get('cycle') === 'yearly' ? 'Annuel' : 'Mensuel';
  const email = searchParams.get('email') || '';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <GlassContainer className="max-w-lg w-full p-8 text-center">
        {/* Success icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Abonnement activé !</h1>
        <p className="text-gray-300 mb-6">
          Bienvenue dans <strong className="text-white">A KI PRI SA YÉ</strong> – votre accès
          premium est maintenant actif.
        </p>

        <GlassCard className="mb-6 text-left">
          <h2 className="text-lg font-semibold text-white mb-3">Récapitulatif</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Plan :</span>
              <span className="text-white font-medium">{planName}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Périodicité :</span>
              <span className="text-white font-medium">{billingCycle}</span>
            </div>
            {email && (
              <div className="flex justify-between text-gray-300">
                <span>Confirmation envoyée à :</span>
                <span className="text-white font-medium">{email}</span>
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-3">
          <CivicButton variant="primary" className="w-full" onClick={() => navigate('/')}>
            Accéder à la plateforme
          </CivicButton>

          <Link to="/account" className="block text-blue-400 hover:underline text-sm">
            Gérer mon abonnement
          </Link>
        </div>

        <p className="text-gray-500 text-xs mt-6">
          Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}…
        </p>

        <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-xs">
            🔒 Paiement traité par <strong>SumUp Pro</strong> · Données sécurisées · PCI-DSS
          </p>
        </div>
      </GlassContainer>
    </div>
  );
}
