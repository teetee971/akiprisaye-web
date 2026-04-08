/**
 * CorporateSales — Page de vente Corporate B2B
 * Route : /corporate
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Building2, School, Globe, Heart, CheckCircle, ChevronRight, Euro, Phone } from 'lucide-react';

const PACKAGES = [
  {
    type: 'social_center',
    icon: Heart,
    emoji: '❤️',
    label: 'Centres Sociaux',
    subtitle: 'Programme "Aide course économe"',
    monthlyFee: 1000,
    annualFee: 10000,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
    target: 'CCAS, centres sociaux, associations',
    potentialMRR: '10k€/mois (10 centres)',
    features: [
      'Accès illimité pour les bénéficiaires',
      'Tableau de bord gestionnaire',
      'Ateliers numériques inclus',
      'Rapports d\'impact mensuels',
      'Support prioritaire',
    ],
    examples: ['Centre Social Pointe-à-Pitre', 'CCAS Basse-Terre'],
  },
  {
    type: 'school',
    icon: School,
    emoji: '🎓',
    label: 'Écoles & Universités',
    subtitle: 'Module "Éducation financière"',
    monthlyFee: 200,
    annualFee: 2000,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    target: 'Lycées, universités, IUT',
    potentialMRR: '10k€/mois (50 établissements)',
    features: [
      'Module pédagogique clé en main',
      'Comptes élèves illimités',
      'Exercices pratiques',
      'Données anonymisées pour cours',
      'Certificat de formation',
    ],
    examples: ['Lycée Baimbridge', 'Université des Antilles'],
  },
  {
    type: 'collectivity',
    icon: Globe,
    emoji: '🏛️',
    label: 'Collectivités',
    subtitle: 'Observatoire local des prix',
    monthlyFee: 2000,
    annualFee: 20000,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    target: 'Régions, départements, communes',
    potentialMRR: '10k€/mois (5 régions)',
    features: [
      'Tableau de bord exécutif',
      'Rapports territoriaux personnalisés',
      'API d\'accès aux données',
      'Veille concurrentielle',
      'Intégration portail citoyen',
      'SLA 99,9% garanti',
    ],
    examples: ['Région Guadeloupe', 'Collectivité de Martinique'],
  },
  {
    type: 'ngo',
    icon: Building2,
    emoji: '🤝',
    label: 'ONG & Associations',
    subtitle: 'Programme anti-pauvreté solidaire',
    monthlyFee: 42,
    annualFee: 500,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    target: 'ONG, associations caritatives',
    potentialMRR: '10k€/an (20 ONG)',
    features: [
      'Accès complet à tarif solidaire',
      'Badge "Partenaire Solidaire"',
      'Communication commune',
      'Données d\'impact partagées',
    ],
    examples: ['Secours Catholique Antilles', 'Restos du Cœur Réunion'],
  },
];

export default function CorporateSales() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ org: '', name: '', email: '', phone: '' });
  const [sent, setSent] = useState(false);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>Offres Corporate B2B — A KI PRI SA YÉ</title>
        <meta name="description" content="Packages corporate pour centres sociaux, écoles, collectivités et ONG. Tarification adaptée à chaque type d'organisation." />
      </Helmet>

      {/* Hero */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-4">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm">Corporate B2B</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Solutions pour<br />
          <span className="text-emerald-400">Organisations & Institutions</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Des packages dédiés pour centres sociaux, établissements scolaires,
          collectivités territoriales et ONG. Potentiel 30k€/mois.
        </p>
        <div className="mt-4 text-2xl font-bold text-white">
          Potentiel Total : <span className="text-emerald-400">30k€/mois</span>
        </div>
      </div>

      {/* Packages */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {PACKAGES.map((pkg) => {
          const PkgIcon = pkg.icon;
          return (
            <div
              key={pkg.type}
              role="button"
              tabIndex={0}
              aria-pressed={selectedType === pkg.type}
              className={`border rounded-xl p-6 cursor-pointer transition-all ${
                selectedType === pkg.type
                  ? `${pkg.bgColor} ring-2 ring-current`
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
              onClick={() => setSelectedType(pkg.type === selectedType ? null : pkg.type)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedType(pkg.type === selectedType ? null : pkg.type);
                }
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{pkg.emoji}</span>
                  <div>
                    <h3 className={`text-lg font-bold text-white`}>{pkg.label}</h3>
                    <p className="text-sm text-gray-400">{pkg.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${pkg.color}`}>{pkg.monthlyFee}€/mois</div>
                  <div className="text-xs text-gray-500">ou {pkg.annualFee}€/an</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                🎯 {pkg.target}
              </div>
              <ul className="space-y-1.5 mb-4">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className={`w-3.5 h-3.5 ${pkg.color} shrink-0`} />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500">
                💡 Potentiel : {pkg.potentialMRR}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Ex : {pkg.examples.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-400" />
          Demander un Devis
        </h2>
        {!sent ? (
          <form onSubmit={handleContact} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Organisation</label>
                <input
                  type="text"
                  required
                  value={contactForm.org}
                  onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })}
                  placeholder="Nom de l'organisation"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom du contact</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Prénom Nom"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email institutionnel</label>
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="contact@collectivite.fr"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type d'organisation</label>
              <select
                value={selectedType ?? ''}
                onChange={(e) => setSelectedType(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="" disabled>Sélectionner...</option>
                {PACKAGES.map((p) => (
                  <option key={p.type} value={p.type}>{p.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Euro className="w-4 h-4" />
              Demander un devis gratuit
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <div className="text-white font-bold">Demande envoyée !</div>
            <div className="text-sm text-gray-400">
              Notre équipe vous contactera sous 24h pour établir un devis personnalisé.
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              ← Nouvelle demande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
