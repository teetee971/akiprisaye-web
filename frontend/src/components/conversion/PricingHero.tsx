/**
 * PricingHero — Hero section with FOMO, urgency countdown, and trust badges
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, FileText, RefreshCw, Zap } from 'lucide-react';

const FOMO_SUBSCRIBER_COUNT = 2847;
const COUNTDOWN_HOURS = 24;

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getInitialExpiry(): Date {
  const stored = sessionStorage.getItem('pricingHeroExpiry');
  if (stored) {
    const parsed = new Date(stored);
    if (parsed > new Date()) return parsed;
  }
  const expiry = new Date(Date.now() + COUNTDOWN_HOURS * 60 * 60 * 1000);
  sessionStorage.setItem('pricingHeroExpiry', expiry.toISOString());
  return expiry;
}

function useCountdown(expiry: Date): TimeLeft {
  const calc = (): TimeLeft => {
    const diff = Math.max(0, expiry.getTime() - Date.now());
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calc);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(timer);
  });

  return timeLeft;
}

interface PricingHeroProps {
  defaultPlan?: string;
}

export default function PricingHero({ defaultPlan = 'CITIZEN_PREMIUM' }: PricingHeroProps) {
  const navigate = useNavigate();
  const expiry = getInitialExpiry();
  const { hours, minutes, seconds } = useCountdown(expiry);
  const isUrgent = hours === 0;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="text-center py-12 px-4 max-w-3xl mx-auto">
      {/* FOMO Badge */}
      <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-500/40 text-green-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        🔥 {FOMO_SUBSCRIBER_COUNT.toLocaleString('fr-FR')} abonnés cette semaine
      </div>

      {/* Headline */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
        Débloquez l'accès premium
        <br />
        <span className="text-blue-400">en moins d'une minute</span>
      </h1>

      <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
        Alertes prix en temps réel, comparateurs avancés, API&nbsp;— tout ce dont vous avez besoin
        pour maîtriser le coût de la vie dans les territoires ultramarins.
      </p>

      {/* Countdown Timer */}
      <div
        className={`inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-xl border ${
          isUrgent
            ? 'bg-red-900/40 border-red-500/60 text-red-300 animate-pulse'
            : 'bg-slate-800/60 border-white/10 text-white'
        }`}
      >
        <span className="text-lg">⏰</span>
        <span className="font-semibold">
          Offre valide encore&nbsp;:&nbsp;
          <span className="font-mono text-blue-300 text-xl">
            {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
          </span>
        </span>
      </div>

      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
        <button
          onClick={() => navigate(`/subscribe?plan=${defaultPlan}`)}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          🚀 Débuter mon abonnement
        </button>
        <button
          onClick={() => navigate('/pricing')}
          className="px-8 py-4 bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 text-white font-semibold text-lg rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Comparer les plans
        </button>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
        <span className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-green-400" />
          Paiement 100&nbsp;% sécurisé
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-blue-400" />
          Données chiffrées · RGPD
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-purple-400" />
          Factures automatiques
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-yellow-400" />
          Annulation facile
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-orange-400" />
          Accès immédiat
        </span>
      </div>
    </div>
  );
}
