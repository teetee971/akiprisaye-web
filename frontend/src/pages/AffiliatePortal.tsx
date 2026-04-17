/**
 * AffiliatePortal — Portail du programme d'affiliation
 * Route : /portail-affilies
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Link,
  TrendingUp,
  Euro,
  Users,
  Copy,
  CheckCircle,
  Download,
  Medal,
  ChevronRight,
  Gift,
} from 'lucide-react';
const COMMISSION_PLANS = [
  {
    plan: 'CITIZEN_PREMIUM',
    price: '4,99€/mois',
    commission: '10%',
    earn: '0,50€',
    perClick: '0,10€',
  },
  { plan: 'SME', price: '29,99€/mois', commission: '10%', earn: '3,00€', perClick: '0,90€' },
  {
    plan: 'BUSINESS_PRO',
    price: '79,99€/mois',
    commission: '10%',
    earn: '8,00€',
    perClick: '4,00€',
  },
  {
    plan: 'INSTITUTIONAL',
    price: '299€/mois',
    commission: '5%',
    earn: '14,95€',
    perClick: '5,98€',
  },
];
const MARKETING_ASSETS = [
  { icon: '🖼️', type: 'Landing pages', desc: 'Templates HTML prêts à déployer', format: '.zip' },
  { icon: '✉️', type: 'Templates email', desc: 'Emails HTML prêts à envoyer', format: '.zip' },
  { icon: '📱', type: 'Visuels réseaux', desc: 'Instagram, Facebook, TikTok', format: '.zip' },
  { icon: '💬', type: 'Snippets SMS', desc: 'Messages SMS pré-rédigés', format: '.txt' },
];
const LEADERBOARD = [
  { rank: 1, name: 'Marie K.', conversions: 47, commission: '186€', badge: '🥇' },
  { rank: 2, name: 'Jean-Louis P.', conversions: 32, commission: '128€', badge: '🥈' },
  { rank: 3, name: 'Sandrine M.', conversions: 28, commission: '112€', badge: '🥉' },
  { rank: 4, name: 'Thomas R.', conversions: 21, commission: '84€', badge: '' },
  { rank: 5, name: 'Claire D.', conversions: 17, commission: '68€', badge: '' },
];
export default function AffiliatePortal() {
  const [email, setEmail] = useState('');
  const [registered, setRegistered] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [trackedUrl, setTrackedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const affiliateId = email
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 8)
      .toUpperCase();
    const code = `AKI-${affiliateId}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const url = `https://akiprisaye.re/tarifs?ref=${code}&utm_source=affiliate&utm_medium=referral`;
    setReferralCode(code);
    setTrackedUrl(url);
    setRegistered(true);
  };
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(trackedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopied(false);
      console.error('Failed to copy tracked URL to clipboard:', error);
    }
  };
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>Programme Affilié — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Rejoignez le programme d'affiliation Akiprisaye. 10% de commission sur chaque abonnement."
        />
      </Helmet>
      {/* Hero */}
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-4">
          <Link className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 text-sm">Programme Affilié</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Gagnez jusqu'à <span className="text-purple-400">14,95€</span> par abonnement
        </h1>
        <p className="text-gray-400 text-lg">
          Partagez Akiprisaye et recevez une commission sur chaque abonnement converti. Paiement
          mensuel via Stripe dès 50€ accumulés.
        </p>
      </div>
      {/* Stats */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Commission', value: '10%', icon: Euro, color: 'text-purple-400' },
          { label: 'Cookie', value: '30 jours', icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Paiement min.', value: '50€', icon: Gift, color: 'text-amber-400' },
          { label: 'Affiliés actifs', value: '127', icon: Users, color: 'text-blue-400' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
          >
            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Registration */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-purple-400" />
            S'inscrire en 1 clic
          </h2>
          {!registered ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="ap-email" className="block text-sm text-gray-400 mb-1">
                  Votre email
                </label>
                <input
                  id="ap-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Rejoindre le programme
              </button>
              <p className="text-xs text-gray-500 text-center">
                Gratuit · Pas d'engagement · Paiement mensuel automatique
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-sm text-purple-400 mb-1">✅ Compte affilié créé !</div>
                <div className="text-xs text-gray-400 mb-2">Votre code de parrainage :</div>
                <code className="text-white font-mono text-sm">{referralCode}</code>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Lien tracké (30 jours de cookie) :</div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-300 flex-1 truncate">{trackedUrl}</span>
                  <button onClick={copyUrl} className="shrink-0 text-gray-400 hover:text-white">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copied && <div className="text-xs text-emerald-400 mt-1">Lien copié !</div>}
              </div>
            </div>
          )}
        </div>
        {/* Commission Grid */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Commissions par Plan
          </h2>
          <div className="space-y-3">
            {COMMISSION_PLANS.map((p) => (
              <div
                key={p.plan}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-white">{p.plan}</div>
                  <div className="text-xs text-gray-400">{p.price}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-emerald-400 font-medium">{p.earn}/abonnement</div>
                  <div className="text-xs text-gray-500">{p.perClick}/clic</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Marketing Assets */}
      <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-400" />
          Assets Marketing
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MARKETING_ASSETS.map((a) => (
            <div
              key={a.type}
              className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:border-amber-400/30 transition-colors cursor-pointer"
            >
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-sm font-medium text-white mb-1">{a.type}</div>
              <div className="text-xs text-gray-400">{a.desc}</div>
              <div className="mt-2 text-xs text-amber-400">{a.format}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Leaderboard */}
      <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Medal className="w-5 h-5 text-amber-400" />
          Top Affiliés du Mois
          <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">
            Bonus 100€ pour le #1
          </span>
        </h2>
        <div className="space-y-2">
          {LEADERBOARD.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
            >
              <div className="w-8 text-center text-sm font-bold text-gray-400">
                {entry.badge || `#${entry.rank}`}
              </div>
              <div className="flex-1 text-sm text-white">{entry.name}</div>
              <div className="text-xs text-gray-400">{entry.conversions} conv.</div>
              <div className="text-sm font-medium text-emerald-400">{entry.commission}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
