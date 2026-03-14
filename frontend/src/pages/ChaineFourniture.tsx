/**
 * ChaineFourniture — Transparence de la chaîne d'approvisionnement
 * Route : /chaine-fourniture
 *
 * Représentation visuelle du parcours d'un produit de son origine à la mise en rayon.
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Package, Ship, Warehouse, ShoppingBag, ArrowRight, Info, FileText } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Données exemple ───────────────────────────────────────────────────────────

interface SupplyStep {
  icon: React.ElementType;
  label: string;
  location: string;
  costEstimate: string;
  detail: string;
  color: string;
}

const EXAMPLE_PRODUCT = {
  name: 'Lait UHT 1L (demi-écrémé)',
  origin: 'France métropolitaine',
  destination: 'Guadeloupe',
};

const SUPPLY_CHAIN_STEPS: SupplyStep[] = [
  {
    icon: Package,
    label: 'Production',
    location: 'Normandie, France',
    costEstimate: '~0,45 €',
    detail: 'Collecte du lait, pasteurisation, conditionnement UHT en usine.',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  {
    icon: Warehouse,
    label: 'Entrepôt & Préparation',
    location: 'Port de Le Havre',
    costEstimate: '~0,08 €',
    detail: "Stockage en entrepôt frigorifique, palettisation, dédouanement export.",
    color: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    icon: Ship,
    label: 'Transport maritime',
    location: 'Le Havre → Pointe-à-Pitre',
    costEstimate: '~0,25 €',
    detail: 'Fret maritime (~8 jours de traversée). Coût inclut la réservation du conteneur réfrigéré.',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  },
  {
    icon: Warehouse,
    label: 'Dédouanement & Taxe',
    location: 'Port de Jarry, Guadeloupe',
    costEstimate: '~0,15 € (octroi de mer)',
    detail: "Application de l'octroi de mer (taxe locale ~8,5 % sur les produits laitiers).",
    color: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  {
    icon: Warehouse,
    label: 'Distribution locale',
    location: 'Entrepôt distributeur',
    costEstimate: '~0,10 €',
    detail: "Stockage, découpe des palettes, livraison aux magasins de l'île.",
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  {
    icon: ShoppingBag,
    label: 'Mise en rayon',
    location: 'Grande Surface, Guadeloupe',
    costEstimate: '~0,30 € (marge enseigne)',
    detail: "Mise en rayon, gestion des stocks, promotion éventuelle.",
    color: 'bg-green-50 border-green-200 text-green-800',
  },
];

const COST_BREAKDOWN = [
  { label: 'Coût de production', value: '~0,45 €', pct: 33 },
  { label: 'Logistique & Entrepôt', value: '~0,33 €', pct: 24 },
  { label: 'Octroi de mer', value: '~0,15 €', pct: 11 },
  { label: 'Marge distributeur/enseigne', value: '~0,40 €', pct: 29 },
  { label: 'Prix final rayon', value: '~1,33 €', pct: 100 },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export default function ChaineFourniture() {
  return (
    <>
      <Helmet>
        <title>Transparence de la chaîne d'approvisionnement — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Visualisez le parcours complet d'un produit de son origine à votre rayon — coûts, taxes, intermédiaires transparents — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/chaine-fourniture" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.chaineFourniture}
            alt="Chaîne d'approvisionnement DOM-COM"
            gradient="from-slate-950 to-cyan-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <Ship className="w-5 h-5 text-cyan-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
                Transparence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              🚢 Chaîne d'approvisionnement
            </h1>
            <p className="text-cyan-100 text-sm mt-1 drop-shadow">
              Du producteur à votre rayon : comprendre pourquoi les prix sont plus élevés aux DOM
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          {/* Info banner */}
          <div className="flex gap-3 bg-cyan-50 border border-cyan-200 rounded-xl p-4">
            <Info className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-cyan-800">
              Exemple basé sur un produit alimentaire courant importé de Métropole vers la Guadeloupe.
              Les chiffres sont des estimations issues des données publiques (douanes, observatoires des prix).
            </p>
          </div>

          {/* Produit exemple */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Exemple de produit
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🥛</span>
              <div>
                <p className="font-bold text-gray-900">{EXAMPLE_PRODUCT.name}</p>
                <p className="text-sm text-gray-500">
                  {EXAMPLE_PRODUCT.origin} → {EXAMPLE_PRODUCT.destination}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline de la chaîne */}
          <div className="space-y-3">
            <h2 className="font-bold text-gray-900">📍 Étapes de la chaîne</h2>
            {SUPPLY_CHAIN_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex gap-4">
                  {/* Ligne verticale */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${step.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < SUPPLY_CHAIN_STEPS.length - 1 && (
                      <div className="w-0.5 bg-gray-200 flex-1 mt-1 mb-0" />
                    )}
                  </div>
                  {/* Contenu */}
                  <div className={`flex-1 border rounded-xl p-4 mb-1 ${step.color}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm">{step.label}</p>
                        <p className="text-xs opacity-75">{step.location}</p>
                      </div>
                      <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full border">
                        {step.costEstimate}
                      </span>
                    </div>
                    <p className="text-xs mt-2 opacity-80 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Décomposition des coûts */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-bold text-gray-900 mb-4">💰 Décomposition du prix final</h2>
            <div className="space-y-3">
              {COST_BREAKDOWN.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={row.label === 'Prix final rayon' ? 'font-bold text-gray-900' : 'text-gray-700'}>
                      {row.label}
                    </span>
                    <span className={row.label === 'Prix final rayon' ? 'font-bold text-indigo-700' : 'text-gray-600'}>
                      {row.value}
                    </span>
                  </div>
                  {row.label !== 'Prix final rayon' && (
                    <div
                      role="progressbar"
                      aria-valuenow={row.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.label} : ${row.pct}%`}
                      className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
                    >
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/calculateur-octroi"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              Calculateur octroi de mer
            </Link>
            <Link
              to="/comparateur-territoires"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
            >
              <ArrowRight className="w-4 h-4" />
              Comparer les territoires
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
