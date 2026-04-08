/**
 * PremiumReports — Page des rapports analytiques premium
 * Route : /rapports-premium
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, TrendingUp, MapPin, Receipt, CheckCircle, Euro, ChevronRight } from 'lucide-react';

const PREMIUM_REPORTS = [
  {
    id: 'budget',
    icon: Euro,
    emoji: '💰',
    title: 'Mon Budget Courses',
    description: 'Analyse de vos dépenses par catégorie, comparaison avec la moyenne française, conseils d\'optimisation.',
    price: 2,
    popular: false,
    features: [
      'Répartition par catégorie',
      'Vs moyenne France',
      'Conseils d\'économies personnalisés',
      'Format PDF téléchargeable',
    ],
  },
  {
    id: 'prediction',
    icon: TrendingUp,
    emoji: '🔮',
    title: 'Prédiction des Prix',
    description: 'Modèle ML : évolution des prix sur 30 jours, meilleurs jours pour faire ses courses, économies estimées.',
    price: 5,
    popular: true,
    features: [
      'Prédiction 30 jours (ML)',
      'Meilleurs jours d\'achat',
      'Économies estimées',
      'Par produit et territoire',
    ],
  },
  {
    id: 'territory',
    icon: MapPin,
    emoji: '🗺️',
    title: 'Comparaison Territoriale',
    description: 'Même produit, différents magasins : distances, temps et meilleur itinéraire optimisé.',
    price: 1,
    popular: false,
    features: [
      'Comparaison multi-magasins',
      'Analyse distance & temps',
      'Itinéraire optimal',
      'Économies par déplacement',
    ],
  },
  {
    id: 'tax',
    icon: Receipt,
    emoji: '📋',
    title: 'Rapport Fiscal Annuel',
    description: 'Pour les utilisateurs professionnels : export catégorisé TVA, XML/PDF conformes, déductibilité.',
    price: 3,
    popular: false,
    features: [
      'Catégorisation TVA',
      'Export XML/PDF',
      'Conformité fiscale',
      'Pour auto-entrepreneurs',
    ],
  },
];

export default function PremiumReports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [ordered, setOrdered] = useState(false);

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrdered(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>Rapports Premium — A KI PRI SA YÉ</title>
        <meta name="description" content="Rapports analytiques personnalisés : budget courses, prédiction de prix, comparaison territoriale, rapport fiscal." />
      </Helmet>

      {/* Hero */}
      <div className="max-w-5xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm">Rapports Premium</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Analyses personnalisées<br />
          <span className="text-amber-400">à partir de 1€</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Des rapports générés en temps réel à partir de vos données de courses.
          Payez uniquement ce dont vous avez besoin.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {PREMIUM_REPORTS.map((report) => {
          const ReportIcon = report.icon;
          return (
            <div
              key={report.id}
              role="button"
              tabIndex={0}
              className={`border rounded-xl p-5 cursor-pointer transition-all ${
                selectedReport === report.id
                  ? 'bg-amber-900/20 border-amber-500/40 ring-2 ring-amber-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
              onClick={() => setSelectedReport(report.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedReport(report.id);
                }
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{report.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white">{report.title}</h3>
                    {report.popular && (
                      <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5">
                        ⭐ Populaire
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xl font-bold text-amber-400">{report.price}€</div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{report.description}</p>
              <ul className="space-y-1">
                {report.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle className="w-3 h-3 text-amber-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Order Form */}
      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-amber-400" />
          Commander un Rapport
        </h2>
        {!ordered ? (
          <form onSubmit={handleOrder} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rapport</label>
              <select
                value={selectedReport ?? ''}
                onChange={(e) => setSelectedReport(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="" disabled>Choisir un rapport...</option>
                {PREMIUM_REPORTS.map((r) => (
                  <option key={r.id} value={r.id}>{r.title} — {r.price}€</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email de livraison</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Euro className="w-4 h-4" />
              Commander
              {selectedReport && (
                <span>({PREMIUM_REPORTS.find((r) => r.id === selectedReport)?.price}€)</span>
              )}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <div className="text-white font-bold">Rapport commandé !</div>
            <div className="text-sm text-gray-400">
              Votre rapport sera envoyé à <strong className="text-white">{email}</strong> dans quelques minutes.
            </div>
            <button
              onClick={() => { setOrdered(false); setSelectedReport(null); setEmail(''); }}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              ← Nouveau rapport
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
