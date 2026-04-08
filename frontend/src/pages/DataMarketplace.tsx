/**
 * DataMarketplace — Marché des licences de données
 * Route : /data-marketplace
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Database, FileText, Globe, GraduationCap, Euro, Download, ChevronRight, CheckCircle } from 'lucide-react';

const REPORTS = [
  {
    id: 'monthly-inflation',
    icon: '📊',
    title: 'Rapport Mensuel Inflation',
    description: 'Prix moyen par région, tendances 6 mois, top produits impactés.',
    price: 50,
    formats: ['PDF', 'Excel'],
    delivery: 'Livré le 1er du mois',
    target: 'Médias, collectivités, économistes',
    includes: [
      'Prix moyen par région DOM-TOM',
      'Tendances sur 6 mois',
      'Top 20 produits impactés',
      'Comparaison avec France hexagonale',
      'Indice d\'inflation calculé',
    ],
    Icon: Database,
  },
  {
    id: 'territory-intelligence',
    icon: '🗺️',
    title: 'Territory Intelligence DOM-TOM',
    description: 'Analyse de marché par territoire, benchmarking concurrentiel, insights locaux.',
    price: 100,
    formats: ['PDF', 'Excel', 'HTML interactif'],
    delivery: 'Livré sous 48h',
    target: 'Distributeurs, importateurs, consultants',
    includes: [
      'Analyse de marché par territoire',
      'Benchmarking concurrentiel (enseignes)',
      'Insights consommateurs locaux',
      'Carte de chaleur des prix',
      'Recommandations stratégiques',
    ],
    Icon: Globe,
  },
  {
    id: 'custom-export',
    icon: '🔧',
    title: 'Export Personnalisé',
    description: 'Période, région, catégories au choix. Généré en <2 min, livraison email.',
    price: 0,
    priceLabel: 'À partir de 15€',
    formats: ['PDF', 'Excel', 'JSON', 'CSV'],
    delivery: 'Généré en <2 minutes',
    target: 'Tous profils',
    includes: [
      'Période personnalisable',
      'Territoire(s) au choix',
      'Catégories sélectionnables',
      'Formats multiples',
      'Dashboard interactif inclus',
    ],
    Icon: FileText,
  },
  {
    id: 'academic-license',
    icon: '🎓',
    title: 'Licence Académique',
    description: 'Datasets anonymisés pour universités et instituts de recherche.',
    price: 0,
    priceLabel: 'Gratuit',
    formats: ['CSV', 'JSON', 'Parquet'],
    delivery: 'Accès immédiat',
    target: 'Universités, chercheurs, étudiants',
    includes: [
      'Données 100% anonymisées (RGPD)',
      'Historique complet disponible',
      'Documentation académique',
      'Citation APA/MLA fournie',
      'Support recherche dédié',
    ],
    Icon: GraduationCap,
  },
];

export default function DataMarketplace() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [ordered, setOrdered] = useState(false);

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedReport) return;
    setOrdered(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>Data Marketplace — A KI PRI SA YÉ</title>
        <meta name="description" content="Licences de données de prix DOM-TOM. Rapports mensuels, analyses territoriales, exports personnalisés." />
      </Helmet>

      {/* Hero */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm">Data Marketplace</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Données de Prix DOM-TOM<br />
          <span className="text-blue-400">sous licence commerciale</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Rapports pré-générés, exports personnalisés et licences académiques.
          Données 100% conformes RGPD, anonymisées par défaut.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {REPORTS.map((report) => (
          <div
            key={report.id}
            role="button"
            tabIndex={0}
            className={`bg-white/5 border rounded-xl p-6 cursor-pointer transition-all ${
              selectedReport === report.id
                ? 'border-blue-500/50 ring-2 ring-blue-500/30'
                : 'border-white/10 hover:border-white/20'
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
              <div>
                <div className="text-2xl mb-1">{report.icon}</div>
                <h3 className="text-lg font-bold text-white">{report.title}</h3>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-400">
                  {report.price > 0 ? `${report.price}€` : report.priceLabel}
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">{report.description}</p>
            <div className="text-xs text-gray-500 mb-3">
              🎯 {report.target} · ⚡ {report.delivery}
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {report.formats.map((f) => (
                <span key={f} className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-gray-400">
                  {f}
                </span>
              ))}
            </div>
            <ul className="space-y-1.5">
              {report.includes.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Order Form */}
      <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-400" />
          Commander un Rapport
        </h2>
        {!ordered ? (
          <form onSubmit={handleOrder} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rapport sélectionné</label>
              <select
                value={selectedReport ?? ''}
                onChange={(e) => setSelectedReport(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="" disabled>Choisir un rapport...</option>
                {REPORTS.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
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
                placeholder="vous@organisation.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
              💡 Le rapport sera envoyé par email dans les délais indiqués.
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Euro className="w-4 h-4" />
              Commander {selectedReport && REPORTS.find((r) => r.id === selectedReport)?.price ? `(${REPORTS.find((r) => r.id === selectedReport)?.price}€)` : ''}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <div className="text-white font-bold">Commande reçue !</div>
            <div className="text-sm text-gray-400">
              Vous recevrez votre rapport à <strong className="text-white">{email}</strong> selon les délais indiqués.
            </div>
            <button
              onClick={() => { setOrdered(false); setSelectedReport(null); setEmail(''); }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              ← Nouvelle commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
