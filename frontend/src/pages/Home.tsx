import { Link, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BarChart2, ShoppingCart, Camera, Search, Globe } from 'lucide-react';
import { getComparisonOfDay, type PriceComparison } from '../data/exampleComparisons';
import { useCompare } from '../hooks/useCompare';
import type { PriceObservationRow } from '../types/compare';
import '../styles/home-v5.css';
import '../styles/animations.css';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { SEOHead } from '../components/ui/SEOHead';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
  SkeletonSection,
  SkeletonWidget,
  SkeletonStatGrid,
} from '../components/SkeletonWidgets';

// ── Below-fold observatory — lazy-loaded, skeleton fallbacks prevent CLS ──────
const PriceLiveTicker        = lazy(() => import('../components/home/PriceLiveTicker'));
const FlipStatCard           = lazy(() => import('../components/ui/FlipStatCard'));
const HowItWorksSection      = lazy(() => import('./home-v5/HowItWorksSection'));
const ObservatorySection     = lazy(() => import('./home-v5/ObservatorySection'));
const MiniFaqSection         = lazy(() => import('./home-v5/MiniFaqSection'));
const TerritoryPriceChart    = lazy(() => import('../components/home/TerritoryPriceChart'));
const PriceEvolutionChart    = lazy(() => import('../components/home/PriceEvolutionChart'));
const LiveNewsFeed           = lazy(() => import('../components/home/LiveNewsFeed'));
const PanierVitalWidget      = lazy(() => import('../components/home/PanierVitalWidget'));
const CategoryOvercostChart  = lazy(() => import('../components/home/CategoryOvercostChart'));
const StoreRankingWidget     = lazy(() => import('../components/home/StoreRankingWidget'));
const InflationBarometerWidget = lazy(() => import('../components/home/InflationBarometerWidget'));
const ProduitChocWidget      = lazy(() => import('../components/home/ProduitChocWidget'));
const IndiceEquiteWidget     = lazy(() => import('../components/home/IndiceEquiteWidget'));
const AppDemoShowcase        = lazy(() => import('../components/home/AppDemoShowcase'));
const VideoVieChere          = lazy(() => import('../components/home/VideoVieChere'));
const PriceExplainerBanner   = lazy(() => import('../components/home/PriceExplainerBanner'));
const LettreHebdoWidget      = lazy(() => import('../components/home/LettreHebdoWidget'));
const LettreJourWidget       = lazy(() => import('../components/home/LettreJourWidget'));

// ── Static data ───────────────────────────────────────────────────────────────

const RETAILER_LOGOS = ['Carrefour', 'E.Leclerc', 'Super U', 'Leader Price', 'Match', 'Hyper U'];

const POPULAR_PRODUCTS = [
  { name: 'Lait demi-écrémé 1L', price: '1,32 €', delta: '-0,18 €' },
  { name: 'Riz long 1 kg',        price: '2,48 €', delta: '-0,42 €' },
  { name: 'Huile 1L',             price: '3,96 €', delta: '-0,61 €' },
];

const PRICE_ALERTS = [
  { label: 'Yaourt nature x12', change: '-7%',  note: 'Baisse détectée', down: true  },
  { label: 'Poulet entier',     change: '+4%',  note: 'Hausse récente',       down: false },
  { label: 'Pâtes 500g',   change: '-3%',  note: 'Prix stabilisé',       down: true  },
];

const PRIMARY_TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe', flag: '\ud83c\uddec\ud83c\uddf5' },
  { code: 'MQ', name: 'Martinique', flag: '\ud83c\uddf2\ud83c\uddf6' },
  { code: 'GF', name: 'Guyane',     flag: '\ud83c\uddec\ud83c\uddeb' },
  { code: 'RE', name: 'La Réunion', flag: '\ud83c\uddf7\ud83c\uddea' },
  { code: 'YT', name: 'Mayotte',    flag: '\ud83c\uddfe\ud83c\uddf9' },
];

const ALL_TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe',           flag: '\ud83c\uddec\ud83c\uddf5' },
  { code: 'MQ', name: 'Martinique',            flag: '\ud83c\uddf2\ud83c\uddf6' },
  { code: 'GF', name: 'Guyane',                flag: '\ud83c\uddec\ud83c\uddeb' },
  { code: 'RE', name: 'La Réunion',       flag: '\ud83c\uddf7\ud83c\uddea' },
  { code: 'YT', name: 'Mayotte',               flag: '\ud83c\uddfe\ud83c\uddf9' },
  { code: 'NC', name: 'Nouvelle-Calédonie', flag: '\ud83c\uddf3\ud83c\udde8' },
];

const TESTIMONIALS = [
  {
    name: 'Marie-Christine F.', territory: 'Guadeloupe', flag: '\ud83c\uddec\ud83c\uddf5',
    savings: '47 €', savingsLabel: 'économisés / mois', initials: 'MC',
    quote: "J'ai comparé 3 enseignes pour mon panier habituel. La différence est réelle.",
    product: 'Courses hebdomadaires',
  },
  {
    name: 'Jean-Louis B.', territory: 'Martinique', flag: '\ud83c\uddf2\ud83c\uddf6',
    savings: '31 %', savingsLabel: 'de moins sur le riz', initials: 'JL',
    quote: "Le même riz était affiché 2,20 € dans l'enseigne à deux rues. En un clic j'ai su.",
    product: 'Riz long grain 1 kg',
  },
  {
    name: 'Sophie D.', territory: 'La Réunion', flag: '\ud83c\uddf7\ud83c\uddea',
    savings: '89 €', savingsLabel: 'économisés en 1 mois', initials: 'SD',
    quote: "L'alerte m'a prévenue quand le lait a baissé. J'ai acheté au bon moment.",
    product: 'Produits laitiers & conserves',
  },
];

// ── Ambient glow blobs — fixed, behind all content ───────────────────────────
function BgFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-32 -top-16 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute right-0 top-32 h-[32rem] w-[32rem] rounded-full bg-white/[0.04] blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-300/[0.06] blur-3xl" />
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

interface BentoCardProps { children: React.ReactNode; className?: string; }
function BentoCard({ children, className = '' }: BentoCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_16px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps { eyebrow: string; title: string; description: string; }
function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{eyebrow}</div>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

interface MetricBlockProps { label: string; value: string; helper: string; accent?: boolean; }
function MetricBlock({ label, value, helper, accent = false }: MetricBlockProps) {
  return (
    <div className={`rounded-[24px] border px-4 py-4 ${accent ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</div>
      <div className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${accent ? 'text-emerald-300' : 'text-white'}`}>{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{helper}</div>
    </div>
  );
}

interface StatCardProps { label: string; value: string; helper: string; }
function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{helper}</div>
    </div>
  );
}

interface KPICardProps { title: string; value: string; }
function KPICard({ title, value }: KPICardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.07]">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

interface FeatureChipProps { title: string; subtitle: string; }
function FeatureChip({ title, subtitle }: FeatureChipProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="mt-1 text-xs text-zinc-400">{subtitle}</div>
    </div>
  );
}

// ── Animated savings counter (WOW effect) ─────────────────────────────────────
interface LiveResultProps { comparison: PriceComparison; }
function LiveResult({ comparison }: LiveResultProps) {
  const target = Math.max(0, parseFloat((comparison.territoryPrice - comparison.metropolePrice).toFixed(2)));
  const [displayed, setDisplayed] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let value = 0;
    const step = target / 40;
    const id = setInterval(() => {
      value = Math.min(value + step, target);
      setDisplayed(parseFloat(value.toFixed(2)));
      if (value >= target) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[200px_1fr_240px] lg:items-center">
        <div className="relative h-36 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.18),transparent_55%)]" />
          <div className="relative flex h-full flex-col justify-end p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Exemple du jour</div>
            <div className="mt-1 text-lg font-semibold leading-tight text-white">{comparison.product}</div>
            <div className="mt-1 text-xs text-zinc-400">{comparison.territoryFlag} {comparison.territory}</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricBlock label="Prix local"     value={`${comparison.territoryPrice.toFixed(2)} €`} helper={comparison.territory} />
          <MetricBlock label="Prix métropole" value={`${comparison.metropolePrice.toFixed(2)} €`} helper="Référence \ud83c\uddeb\ud83c\uddf7" />
          <MetricBlock label="Surcot" value={`+${displayed.toFixed(2)} €`} helper={`+${comparison.deltaPercent}%`} accent />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Enseignes comparées</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['E.Leclerc', 'Carrefour', 'Hyper U'].map((name) => (
              <span key={name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200">{name}</span>
            ))}
          </div>
          <Link to="/comparateur" className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline">
            Voir plus de comparaisons →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── InlineComparisonPanel — powered by useCompare ────────────────────────────

interface InlineComparisonPanelProps {
  loading: boolean;
  product?: { name: string; barcode?: string; image?: string };
  prices: PriceObservationRow[];
  summary?: { min: number | null; max: number | null; average: number | null; savings: number | null; count: number };
  query: string;
}

function InlineComparisonPanel({ loading, product, prices, summary, query }: InlineComparisonPanelProps) {
  const cheapest  = prices[0];
  const expensive = prices[prices.length - 1];

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-6">
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />
          <div className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />
          <div className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.03]" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr_220px] lg:items-center">
          {/* Product identity */}
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
            {product?.image ? (
              <img
                src={product.image}
                alt={product.name}
                width={240} height={160}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-40 items-center justify-center text-4xl">🛒</div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">Résultat</div>
              <div className="mt-1 text-sm font-semibold text-white">{product?.name ?? query}</div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Prix minimum</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                {cheapest ? `${cheapest.price.toFixed(2)} €` : '—'}
              </div>
              <div className="mt-2 text-sm text-zinc-400">{cheapest?.retailer ?? 'Aucun résultat'}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Prix maximum</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                {expensive ? `${expensive.price.toFixed(2)} €` : '—'}
              </div>
              <div className="mt-2 text-sm text-zinc-400">{expensive?.retailer ?? '—'}</div>
            </div>
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Économie possible</div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-emerald-300">
                {summary?.savings != null ? `${summary.savings.toFixed(2)} €` : '—'}
              </div>
              <div className="mt-2 text-sm text-zinc-400">écart observé</div>
            </div>
          </div>

          {/* Retailer badges */}
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Enseignes</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {prices.map((r) => (
                <span
                  key={`${r.retailer}-${r.price}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
                >
                  {r.retailer}
                </span>
              ))}
              {prices.length === 0 && (
                <span className="text-sm text-zinc-500">Aucune donnée pour ce filtre</span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function HomeV5() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ scans: 1200, products: 5000, territories: 12 });
  const [displayStats, setDisplayStats] = useState({ scans: 0, products: 0, territories: 0 });
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerritory, setSelectedTerritory] = useState('GP');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [comparison] = useState<PriceComparison>(getComparisonOfDay());
  const statsRef = useRef<HTMLElement | null>(null);

  useScrollReveal();

  // ── Real comparison data ───────────────────────────────────────────────────
  const compareQuery = searchQuery.trim() || 'Pack eau 6x1.5L';
  const { data: compareData, loading: compareLoading } =
    useCompare(compareQuery, selectedTerritory || 'GP', selectedRetailer);

  useEffect(() => {
    if (statsAnimated) return;
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      setStatsAnimated(true);
      observer.disconnect();
      const duration = 1400;
      const start = performance.now();
      const targets = { scans: stats.scans, products: stats.products, territories: stats.territories };
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setDisplayStats({
          scans: Math.round(targets.scans * ease),
          products: Math.round(targets.products * ease),
          territories: Math.round(targets.territories * ease),
        });
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stats, statsAnimated]);

  useEffect(() => {
    const loaded = safeLocalStorage.getJSON('platform_stats', { scans: 1200, products: 5000, territories: 12 });
    setStats(loaded);
    let w = window.innerWidth;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        if (w <= 768) setShowMobileCTA(window.scrollY > window.innerHeight * 0.6);
        ticking = false;
      });
      ticking = true;
    };
    const onResize = () => { w = window.innerWidth; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = searchQuery.trim()
      ? `/recherche-produits?q=${encodeURIComponent(searchQuery)}`
      : `/comparateur${selectedTerritory ? `?territoire=${selectedTerritory}` : ''}`;
    navigate(dest);
  };

  return (
    <>
      <SEOHead
        title="A KI PRI SA YÉ – Transparence des prix Outre-mer"
        description="Comparez les prix en Guadeloupe, Martinique, Guyane, La Réunion et dans tous les territoires ultramarins. Données citoyennes réelles, scanneur de produits, observatoire des prix."
        canonical="https://teetee971.github.io/akiprisaye-web/"
      />

      <BgFX />

      <div className="min-h-screen bg-[#05070a] text-white -mx-4 -mt-2 px-4 pb-8 pt-4 sm:px-6">
        <div className="mx-auto max-w-7xl">

          {/* Hero 2-column */}
          <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]" id="main-content">

            {/* Hero panel */}
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8 lg:min-h-[420px] lg:p-10">
              <img
                src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fm=webp&fit=crop&w=1200&q=80"
                srcSet="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fm=webp&fit=crop&w=800&q=80 800w, https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fm=webp&fit=crop&w=1200&q=80 1200w"
                sizes="(max-width:1024px) 100vw, 58vw"
                alt=""
                aria-hidden="true"
                width={1200}
                height={800}
                fetchPriority="high"
                decoding="async"
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.18] saturate-50"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_30%)]" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]" aria-hidden="true" />
                    Données en direct
                  </div>
                  <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl xl:text-6xl">
                    Comparez les prix.<br className="hidden sm:block" />
                    <span className="text-emerald-400">Économisez</span> instantanément.
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                    Données locales pour les DOM-COM. Guadeloupe, Martinique, Guyane, La Réunion et plus.
                    Accès libre, aucun compte requis.
                  </p>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <FeatureChip title="Temps réel"    subtitle="données fraîches" />
                  <FeatureChip title="DROM-COM"      subtitle="12 territoires" />
                  <FeatureChip title="Stable layout" subtitle="CLS ≈ 0" />
                </div>
              </div>
            </section>

            {/* Search panel — fixed min-height prevents CLS on hydration */}
            <form
              onSubmit={handleSearch}
              className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6"
              aria-label="Rechercher un produit"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.14),transparent_26%),radial-gradient(circle_at_20%_100%,rgba(255,255,255,0.08),transparent_30%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Recherche rapide</div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                    Lancez une comparaison
                  </h2>
                  <div className="mt-6 space-y-4">
                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-zinc-200">Produit ou code-barres</div>
                      <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-black/20 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus-within:border-white/25">
                        <Search size={16} className="mr-3 shrink-0 text-zinc-500" aria-hidden="true" />
                        <input
                          id="home-search-query"
                          name="q"
                          type="text"
                          placeholder="Ex. lait, pâtes, 3270190204877"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
                          aria-label="Rechercher un produit"
                        />
                      </div>
                    </label>
                    <div>
                      <div className="mb-2 text-sm font-medium text-zinc-200">Territoire</div>
                      <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}
                        role="radiogroup"
                        aria-label="Sélectionner un territoire"
                      >
                        {PRIMARY_TERRITORIES.map((t) => (
                          <button
                            key={t.code}
                            type="button"
                            role="radio"
                            aria-checked={selectedTerritory === t.code}
                            onClick={() => setSelectedTerritory(selectedTerritory === t.code ? 'GP' : t.code)}
                            className={`flex flex-col items-center gap-1 rounded-2xl border py-2 text-center text-xs transition hover:-translate-y-0.5 ${selectedTerritory === t.code ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white'}`}
                            title={t.name}
                          >
                            <span className="text-lg leading-none">{t.flag}</span>
                            <span className="hidden sm:block text-[0.65rem]">{t.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  <button
                    type="submit"
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-100"
                  >
                    <Search size={16} aria-hidden="true" /> Comparer maintenant
                  </button>
                  <Link
                    to="/scan"
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    \ud83d\udcf7 Scanner un code-barres
                  </Link>
                </div>
              </div>
            </form>
          </main>

          {/* Live result with animated counter */}
          <section className="mt-6">
            <LiveResult comparison={comparison} />
          </section>

          {/* Real-time comparison — powered by useCompare + compare.service */}
          <section className="mt-6">
            <InlineComparisonPanel
              loading={compareLoading}
              product={compareData?.product}
              prices={compareData?.observations ?? []}
              summary={compareData?.summary}
              query={compareQuery}
            />
          </section>

          {/* KPI strip */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Indicateurs clés">
            <KPICard title="Économie moyenne"  value="-18%" />
            <KPICard title="Temps de réponse"  value="&lt; 3 s" />
            <KPICard title="Couverture"        value="DROM-COM" />
            <KPICard title="CLS maîtrisé" value="≈ 0" />
          </section>

          {/* Bento grid — 5 cards */}
          <section
            className="mt-6 grid gap-4 lg:grid-cols-12 lg:grid-rows-[repeat(2,minmax(220px,1fr))] lg:gap-6"
            aria-label="Tableau de bord"
          >
            {/* Enseignes */}
            <BentoCard className="lg:col-span-4 lg:row-span-1">
              <SectionHeader
                eyebrow="ENSEIGNES"
                title="Couverture du réseau"
                description="Enseignes suivies dans votre territoire."
              />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {RETAILER_LOGOS.map((logo) => (
                  <div
                    key={logo}
                    className="flex h-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-xs font-medium text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    {logo}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-4 py-3">
                <span className="text-sm text-emerald-200">Enseignes surveillées</span>
                <span className="text-lg font-semibold text-white">24</span>
              </div>
            </BentoCard>

            {/* Produits populaires */}
            <BentoCard className="lg:col-span-4 lg:row-span-1">
              <SectionHeader
                eyebrow="PRODUITS"
                title="Les plus consultés"
                description="Références qui génèrent le plus de comparaisons."
              />
              <div className="mt-5 space-y-3">
                {POPULAR_PRODUCTS.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="mt-1 text-xs text-zinc-400">Meilleur prix observé</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-white">{item.price}</div>
                      <div className="mt-1 text-xs text-emerald-300">{item.delta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Territoires — tall card (row-span-2) */}
            <BentoCard className="lg:col-span-4 lg:row-span-2">
              <SectionHeader
                eyebrow="TERRITOIRES"
                title="Comparaison multi-territoires"
                description="Passez d'un territoire à l'autre sans perdre le contexte."
              />
              <div className="mt-5 rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                <div className="rounded-[20px] border border-white/8 bg-[#0d1117]/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Couverture</div>
                      <div className="mt-2 text-2xl font-semibold text-white">DROM-COM</div>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                      {12} zones
                    </div>
                  </div>
                  <nav className="mt-6 space-y-3" aria-label="Accès par territoire">
                    {ALL_TERRITORIES.map((t, i) => (
                      <Link
                        key={t.code}
                        to={`/comparateur?territoire=${t.code}`}
                        className="flex items-center gap-3 transition hover:opacity-80"
                        aria-label={`Prix en ${t.name}`}
                      >
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)]" aria-hidden="true" />
                        <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-zinc-200">
                          {t.flag} {t.name}
                        </div>
                        <div className="text-xs text-zinc-500">0{i + 1}</div>
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </BentoCard>

            {/* Alertes prix */}
            <BentoCard className="lg:col-span-4 lg:row-span-1">
              <SectionHeader
                eyebrow="ALERTES"
                title="Mouvements récents"
                description="Baisses et hausses à surveiller."
              />
              <div className="mt-5 space-y-3">
                {PRICE_ALERTS.map((alert) => (
                  <div key={alert.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{alert.label}</div>
                        <div className="mt-1 text-xs text-zinc-400">{alert.note}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${alert.down ? 'bg-emerald-400/12 text-emerald-300' : 'bg-amber-400/12 text-amber-300'}`}>
                        {alert.change}
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/mon-compte" className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline">
                  Configurer mes alertes →
                </Link>
              </div>
            </BentoCard>

            {/* Fiabilité */}
            <BentoCard className="lg:col-span-4 lg:row-span-1">
              <SectionHeader
                eyebrow="FIABILITÉ"
                title="Données fraîches, lecture claire"
                description="Architecture compacte, scroll réduit, informations clés immédiatement visibles."
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatCard label="Mise à jour"   value="Aujourd'hui"   helper="Flux synchronisés" />
                <StatCard label="Comparaisons"  value="12 480"        helper="sur 30 jours" />
                <StatCard label="Temps moyen"   value="&lt; 3 s"         helper="recherche → résultat" />
                <StatCard label="UX cible"      value="CLS ≈ 0"       helper="zones réservées" />
              </div>
            </BentoCard>
          </section>

          {/* Trust / proof strip */}
          <section
            ref={statsRef}
            className="mt-6 rounded-[32px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-6"
            aria-label="Preuve de couverture"
          >
            <div className="grid gap-5 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Confiance</div>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                  Lisibilité, fiabilité, densité maîtrisée
                </h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300 sm:text-base">
                  Hiérarchie courte, cartes stables, zones réservées. Lecture immédiate pour réduire le scroll sans sacrifier la clarté.
                  {' '}Le plus utile, sans surcharge.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <BarChart2 className="mb-2 h-5 w-5 text-blue-400" aria-hidden="true" />
                  <div className="text-lg font-bold text-white">{displayStats.territories || 12}</div>
                  <div className="text-xs text-zinc-400">territoires</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <ShoppingCart className="mb-2 h-5 w-5 text-emerald-400" aria-hidden="true" />
                  <div className="text-lg font-bold text-white">{(displayStats.products || stats.products).toLocaleString()}+</div>
                  <div className="text-xs text-zinc-400">produits</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <Camera className="mb-2 h-5 w-5 text-violet-400" aria-hidden="true" />
                  <div className="text-lg font-bold text-white">{(displayStats.scans || stats.scans).toLocaleString()}+</div>
                  <div className="text-xs text-zinc-400">scans</div>
                </div>
              </div>
            </div>
          </section>

          {/* Observatory toggle */}
          <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">Observatoire complet</div>
                <p className="mt-1 text-sm font-medium text-white">Graphiques, analyses, lettres hebdomadaires, FAQ</p>
              </div>
              <button
                type="button"
                onClick={() => setShowExtended((c) => !c)}
                aria-expanded={showExtended}
                aria-controls="home-extended-content"
                className="rounded-full border border-white/12 bg-white/5 px-5 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                {showExtended ? 'Masquer la vue complète' : "Voir toute la page d’accueil"}
              </button>
            </div>
          </section>

          {/* Extended observatory (lazy + CLS-safe skeletons) */}
          {showExtended && (
            <div id="home-extended-content" className="mt-4">
              <Suspense fallback={<SkeletonSection minHeight="60px" className="my-2" />}>
                <PriceLiveTicker />
              </Suspense>

              <section className="reveal py-4 max-w-5xl mx-auto w-full" aria-label="Statistiques clés">
                <Suspense fallback={<SkeletonStatGrid count={4} />}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FlipStatCard value="12"    label="Territoires"       icon={<Globe className="w-5 h-5 text-blue-400" />}         backContent="Guadeloupe, Martinique, Guyane, La Réunion, Mayotte et plus." />
                    <FlipStatCard value={`${stats.products.toLocaleString()}+`} label="Produits comparés" icon={<ShoppingCart className="w-5 h-5 text-emerald-400" />} backContent="Alimentaire, hygiène, entretien — relevés citoyens vérifiés." />
                    <FlipStatCard value={`${stats.scans.toLocaleString()}+`} label="Scans effectués" icon={<Camera className="w-5 h-5 text-violet-400" />} backContent="Codes-barres et tickets OCR analysés par la communauté." />
                    <FlipStatCard value="~35%"  label="Surcot moyen DOM"  icon={<BarChart2 className="w-5 h-5 text-orange-400" />}   backContent="Par rapport à l'Hexagone — observatoire citoyen mars 2026." />
                  </div>
                </Suspense>
              </section>

              <section className="testimonials-v5 section-reveal">
                <h2 className="section-title slide-up">Ce que disent nos utilisateurs</h2>
                <div className="testimonials-grid">
                  {TESTIMONIALS.map((t) => (
                    <div key={t.name} className="testimonial-card slide-up">
                      <div className="testimonial-header">
                        <div className="testimonial-initials">{t.initials}</div>
                        <div className="testimonial-meta">
                          <p className="testimonial-name">{t.name}</p>
                          <p className="testimonial-location"><span>{t.flag}</span><span>{t.territory}</span></p>
                        </div>
                        <div className="testimonial-savings-badge">
                          <span className="testimonial-savings">{t.savings}</span>
                          <span className="testimonial-savings-label">{t.savingsLabel}</span>
                        </div>
                      </div>
                      <p className="testimonial-quote">{t.quote}</p>
                      <span className="testimonial-product-tag">\ud83d\uded2 {t.product}</span>
                    </div>
                  ))}
                </div>
              </section>

              <Suspense fallback={<SkeletonSection minHeight="320px" />}><HowItWorksSection /></Suspense>
              <Suspense fallback={<SkeletonSection minHeight="400px" />}><AppDemoShowcase /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="280px" />}><TerritoryPriceChart /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="280px" />}><PriceEvolutionChart /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="240px" />}><PanierVitalWidget /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="240px" />}><StoreRankingWidget /></Suspense>
              <Suspense fallback={<SkeletonSection minHeight="180px" />}><PriceExplainerBanner /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="220px" />}><LettreJourWidget /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="220px" />}><LettreHebdoWidget /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="240px" />}><InflationBarometerWidget /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="240px" />}><ProduitChocWidget /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="240px" />}><IndiceEquiteWidget /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="280px" />}><CategoryOvercostChart /></Suspense>
              <Suspense fallback={<SkeletonSection minHeight="360px" />}><VideoVieChere /></Suspense>
              <Suspense fallback={<SkeletonWidget minHeight="240px" />}><LiveNewsFeed /></Suspense>
              <Suspense fallback={<SkeletonSection minHeight="320px" />}><ObservatorySection /></Suspense>
              <Suspense fallback={<SkeletonSection minHeight="280px" />}>
                <MiniFaqSection expandedFaq={expandedFaq} onToggleFaq={setExpandedFaq} />
              </Suspense>
            </div>
          )}

          {/* In-page footer */}
          <footer className="mt-8 rounded-[28px] border border-white/8 bg-black/20 px-5 py-6 backdrop-blur-xl sm:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-sm font-semibold tracking-[0.18em] text-white">A KI PRI SA YÉ</div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Comparateur de prix pensé pour les territoires ultramarins. Lecture rapide, crédibilité forte.
                </p>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Produit</div>
                <div className="mt-3 space-y-2">
                  {[['Comparer', '/comparateur'], ['Scanner', '/scan'], ['Alertes', '/mon-compte'], ['Territoires', '/comparateur']].map(([label, to]) => (
                    <div key={label}><Link to={to} className="text-sm text-zinc-400 transition hover:text-zinc-200">{label}</Link></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Ressources</div>
                <div className="mt-3 space-y-2">
                  {[['Méthodologie', '/methodologie'], ['FAQ', '/faq'], ['Confidentialité', '/transparence'], ['Contact', '/contact']].map(([label, to]) => (
                    <div key={label}><Link to={to} className="text-sm text-zinc-400 transition hover:text-zinc-200">{label}</Link></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Légal</div>
                <div className="mt-3 space-y-2">
                  {[['Mentions légales', '/mentions-legales'], ['CGU', '/mentions-legales'], ['Accessibilité', '/mentions-legales']].map(([label, to]) => (
                    <div key={label}><Link to={to} className="text-sm text-zinc-400 transition hover:text-zinc-200">{label}</Link></div>
                  ))}
                </div>
              </div>
            </div>
          </footer>

        </div>
      </div>

      {showMobileCTA && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
          <Link
            to="/comparateur"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-black shadow-[0_8px_32px_rgba(34,197,94,0.3)] transition hover:bg-emerald-400"
          >
            <Search className="h-4 w-4" aria-hidden="true" /> Rechercher un produit
          </Link>
        </div>
      )}
    </>
  );
}
