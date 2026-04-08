/**
 * SubscribeSuccess — Confirmation page after successful subscription
 * Shows animated checkmark, next steps, social share, and referral link
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Copy, Share2, ArrowRight, Gift, Users } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { resolveApiBaseUrl } from '@/services/apiBaseUrl';

const PLAN_LABELS: Record<string, string> = {
  CITIZEN_PREMIUM: 'Citoyen Premium',
  PRO: 'Pro',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
  INSTITUTION: 'Institution',
  RESEARCH: 'Recherche',
};

const SHARE_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: '📱', color: 'bg-green-600 hover:bg-green-500' },
  { id: 'email', label: 'Email', icon: '📧', color: 'bg-blue-600 hover:bg-blue-500' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦', color: 'bg-sky-600 hover:bg-sky-500' },
  { id: 'sms', label: 'SMS', icon: '💬', color: 'bg-purple-600 hover:bg-purple-500' },
] as const;

type SharePlatform = (typeof SHARE_PLATFORMS)[number]['id'];

export default function SubscribeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planId = searchParams.get('plan') || 'CITIZEN_PREMIUM';
  const planLabel = PLAN_LABELS[planId] || planId;

  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Try to generate affiliate link (needs auth token)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const base = resolveApiBaseUrl();
    fetch(`${base}/api/affiliates/generate-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ platform: 'direct' }),
    })
      .then((r) => r.json())
      .then((data: { success?: boolean; link?: string }) => {
        if (data.success && data.link) {
          setReferralLink(data.link);
        }
      })
      .catch(() => {
        // Silently ignore — referral link is optional
      });
  }, []);

  const handleCopy = useCallback(() => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralLink]);

  const handleShare = useCallback(
    (platform: SharePlatform) => {
      const link = referralLink || `${window.location.origin}${import.meta.env.BASE_URL}pricing`;
      const text = encodeURIComponent(
        `Je viens de débloquer le plan ${planLabel} sur Akiprisaye ! Maîtrisez vos prix ultramarins : ${link}`
      );

      let url = '';
      switch (platform) {
        case 'whatsapp':
          url = `https://wa.me/?text=${text}`;
          break;
        case 'twitter':
          url = `https://twitter.com/intent/tweet?text=${text}`;
          break;
        case 'email':
          url = `mailto:?subject=Je%20te%20recommande%20Akiprisaye&body=${text}`;
          break;
        case 'sms':
          url = `sms:?body=${text}`;
          break;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [referralLink, planLabel]
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <GlassContainer className="max-w-lg w-full">
        {/* Animated checkmark */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white text-center mb-2">
          Bienvenue dans le club ! 🎉
        </h1>
        <p className="text-gray-300 text-center mb-8">
          Votre compte <strong className="text-blue-300">{planLabel}</strong> est actif.
          <br />
          Un email de bienvenue vous a été envoyé.
        </p>

        {/* Immediate access card */}
        <GlassCard className="mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-400" />
            Vos prochaines étapes
          </h2>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold flex-shrink-0">1.</span>
              Explorez les comparateurs prix disponibles dans votre espace.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold flex-shrink-0">2.</span>
              Configurez vos premières alertes prix personnalisées.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold flex-shrink-0">3.</span>
              Invitez des amis et gagnez des récompenses.
            </li>
          </ul>
        </GlassCard>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <CivicButton
            variant="primary"
            className="flex-1"
            onClick={() => navigate('/mon-compte')}
          >
            Aller à mon espace
          </CivicButton>
          <CivicButton
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/alertes')}
          >
            Créer une alerte
          </CivicButton>
        </div>

        {/* Referral section */}
        <GlassCard>
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-400" />
            Invitez vos amis, gagnez des récompenses
          </h2>

          {referralLink ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-gray-300 text-sm font-mono truncate focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 rounded-lg text-gray-300 hover:text-white transition-all flex-shrink-0"
                  title="Copier le lien"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm mb-4">
              Connectez-vous pour générer votre lien de parrainage personnalisé.
            </p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
              Partager sur
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SHARE_PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleShare(p.id)}
                className={`${p.color} text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all flex items-center gap-2 justify-center`}
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            <Users className="w-3 h-3 inline mr-1" />
            Chaque ami abonné vous rapporte une récompense !
          </p>
        </GlassCard>

        <div className="text-center mt-6">
          <Link to="/pricing" className="text-blue-400 hover:underline text-sm">
            Découvrir tous les plans
          </Link>
        </div>
      </GlassContainer>
    </div>
  );
}
