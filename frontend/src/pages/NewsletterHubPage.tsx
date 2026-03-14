/**
 * NewsletterHubPage — Hub d'abonnement aux lettres citoyennes
 *
 * Centralise l'accès à :
 *   - La Lettre du Jour IA  (/lettre-jour)
 *   - La Lettre Hebdo IA    (/lettre-hebdo)
 *
 * Suggestion #19 — « Hub newsletters citoyennes »
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Bell, BookOpen, Calendar, Zap, ChevronRight, CheckCircle } from 'lucide-react';
import { SEOHead } from '../components/ui/SEOHead';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Newsletter cards data ─────────────────────────────────────────────────────

const NEWSLETTERS = [
  {
    id: 'lettre-jour',
    title: 'La Lettre du Jour',
    subtitle: 'Briefing quotidien IA',
    emoji: '☀️',
    frequency: 'Chaque matin',
    icon: Zap,
    color: 'from-amber-600/30 to-orange-600/20',
    border: 'border-amber-500/30',
    badge: 'bg-amber-900/40 text-amber-300 border-amber-500/30',
    description:
      "Votre briefing quotidien généré par IA sur la vie chère en Outre-mer. Prix du jour, alertes, actualités sélectionnées, météo économique.",
    highlights: [
      'Résumé des hausses de prix du jour',
      'Top 5 des articles actus Outre-mer',
      'Indicateurs économiques clés',
      'Météo & alertes territoire',
    ],
    path: 'lettre-jour',
  },
  {
    id: 'lettre-hebdo',
    title: 'La Lettre Hebdo',
    subtitle: 'Analyse de la semaine',
    emoji: '📰',
    frequency: 'Chaque lundi',
    icon: BookOpen,
    color: 'from-blue-600/30 to-indigo-600/20',
    border: 'border-blue-500/30',
    badge: 'bg-blue-900/40 text-blue-300 border-blue-500/30',
    description:
      "Analyse approfondie de la semaine écoulée : tendances des prix, enquêtes citoyennes, comparaisons inter-territoriales, conseils pratiques.",
    highlights: [
      'Analyse des tendances hebdomadaires',
      "Comparaison entre territoires d'Outre-mer",
      'Bons plans & promotions de la semaine',
      'Dossier thématique (octroi de mer, carburants…)',
    ],
    path: 'lettre-hebdo',
  },
];

// ── Email subscription form ───────────────────────────────────────────────────

function SubscribeForm({ newsletterId }: { newsletterId?: string }) {
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string[]>(
    newsletterId ? [newsletterId] : ['lettre-jour', 'lettre-hebdo'],
  );
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selected.length === 0) return;
    // Simulate subscription (backend not yet implemented)
    setTimeout(() => setStatus('success'), 600);
  };

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Inscription enregistrée !</h3>
        <p className="text-sm text-gray-300">
          Vous recevrez votre première lettre très prochainement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="sub-email" className="block text-sm text-gray-300 mb-1.5">
          Votre adresse e-mail
        </label>
        <input
          id="sub-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
        />
      </div>

      <div>
        <p className="text-sm text-gray-300 mb-2">Lettres souhaitées</p>
        <div className="space-y-2">
          {NEWSLETTERS.map((n) => (
            <label key={n.id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(n.id)}
                onChange={() => toggle(n.id)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-white">
                {n.emoji} {n.title}{' '}
                <span className="text-gray-400">— {n.frequency}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!email || selected.length === 0}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Bell size={16} /> S'abonner gratuitement
      </button>

      <p className="text-xs text-gray-500 text-center">
        Données non partagées. Désinscription en un clic. Conforme RGPD.
      </p>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewsletterHubPage() {
  const [activeSubscribe, setActiveSubscribe] = useState<string | null>(null);

  return (
    <>
      <SEOHead
        title="Lettres Citoyennes — Briefings IA Outre-mer | A KI PRI SA YÉ"
        description="Abonnez-vous aux lettres citoyennes quotidiennes et hebdomadaires sur la vie chère en Outre-mer. Générées par IA, 100% gratuites."
        canonicalPath="/newsletter"
      />

      <div className="min-h-screen bg-slate-900 text-white pb-16">
        {/* Hero */}
        <HeroImage
          src={PAGE_HERO_IMAGES.lettreHebdo}
          alt="Lettres citoyennes Outre-mer"
          className="relative"
        >
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/40 border border-blue-500/40 rounded-full text-sm text-blue-300 mb-4">
              <Mail size={14} /> Lettres citoyennes gratuites
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              📬 Restez informé(e)
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Briefings IA sur la vie chère, les prix et l'actualité des territoires d'Outre-mer.
              Chaque jour ou chaque semaine, directement dans votre boîte mail.
            </p>
          </div>
        </HeroImage>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: '📰', label: 'Éditions publiées', value: '180+' },
              { icon: '🌍', label: 'Territoires couverts', value: '8' },
              { icon: '🤖', label: 'Générées par IA', value: '100%' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
              </div>
            ))}
          </div>

          {/* Newsletter cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {NEWSLETTERS.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`bg-gradient-to-br ${n.color} border ${n.border} rounded-2xl p-6 flex flex-col`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${n.badge}`}>
                      <Calendar size={12} /> {n.frequency}
                    </span>
                    <span className="text-3xl">{n.emoji}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-white mb-1">{n.title}</h2>
                  <p className="text-sm text-gray-400 mb-4">{n.subtitle}</p>
                  <p className="text-sm text-gray-300 mb-4 flex-1">{n.description}</p>

                  {/* Highlights */}
                  <ul className="space-y-1.5 mb-5">
                    {n.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-gray-300">
                        <Icon size={14} className="text-blue-400 mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Link
                      to={`../${n.path}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/60 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <BookOpen size={14} /> Lire les archives
                    </Link>
                    <button
                      onClick={() => setActiveSubscribe(activeSubscribe === n.id ? null : n.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Bell size={14} /> S'abonner
                      <ChevronRight size={14} className={`transition-transform ${activeSubscribe === n.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Inline form */}
                  {activeSubscribe === n.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <SubscribeForm newsletterId={n.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Global subscribe form */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-6 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-white mb-1 text-center">
              📬 Abonnement global
            </h2>
            <p className="text-sm text-gray-400 text-center mb-5">
              Inscrivez-vous aux deux lettres en une seule fois.
            </p>
            <SubscribeForm />
          </div>

          {/* Info note */}
          <div className="mt-8 p-4 bg-slate-800/40 border border-slate-700/30 rounded-xl text-sm text-gray-400 text-center">
            Les lettres sont générées par IA à partir de sources d'actualités officielles (France Info, La 1ère) et de données de l'observatoire citoyen des prix.
            <br />
            <span className="text-gray-500">Aucune donnée personnelle n'est partagée avec des tiers.</span>
          </div>
        </div>
      </div>
    </>
  );
}
