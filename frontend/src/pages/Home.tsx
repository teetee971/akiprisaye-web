import { Link, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BarChart2, ShoppingCart, Receipt, Landmark, Search } from 'lucide-react';
import { getComparisonOfDay, type PriceComparison } from '../data/exampleComparisons';
import '../styles/home-v5.css';
import '../styles/animations.css';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { getTerritoryAsset, getProductImage } from '../config/imageAssets';
import PriceLiveTicker from '../components/home/PriceLiveTicker';
import { SEOHead } from '../components/ui/SEOHead';
import { useScrollReveal } from '../hooks/useScrollReveal';
import FlipStatCard from '../components/ui/FlipStatCard';

const HowItWorksSection = lazy(() => import('./home-v5/HowItWorksSection'));
const ObservatorySection = lazy(() => import('./home-v5/ObservatorySection'));
const MiniFaqSection = lazy(() => import('./home-v5/MiniFaqSection'));
const TerritoryPriceChart = lazy(() => import('../components/home/TerritoryPriceChart'));
const PriceEvolutionChart = lazy(() => import('../components/home/PriceEvolutionChart'));
const LiveNewsFeed = lazy(() => import('../components/home/LiveNewsFeed'));
const PanierVitalWidget = lazy(() => import('../components/home/PanierVitalWidget'));
const CategoryOvercostChart = lazy(() => import('../components/home/CategoryOvercostChart'));
const StoreRankingWidget = lazy(() => import('../components/home/StoreRankingWidget'));
const InflationBarometerWidget = lazy(() => import('../components/home/InflationBarometerWidget'));
const ProduitChocWidget = lazy(() => import('../components/home/ProduitChocWidget'));
const IndiceEquiteWidget = lazy(() => import('../components/home/IndiceEquiteWidget'));
const AppDemoShowcase = lazy(() => import('../components/home/AppDemoShowcase'));
const VideoVieChere = lazy(() => import('../components/home/VideoVieChere'));
const PriceExplainerBanner = lazy(() => import('../components/home/PriceExplainerBanner'));
const LettreHebdoWidget = lazy(() => import('../components/home/LettreHebdoWidget'));
const LettreJourWidget = lazy(() => import('../components/home/LettreJourWidget'));

const TESTIMONIALS = [
  {
    name: 'Marie-Christine F.',
    territory: 'Guadeloupe',
    flag: '🇬🇵',
    savings: '47 €',
    savingsLabel: 'économisés / mois',
    quote: "J'ai comparé 3 enseignes pour mon panier habituel. La différence est réelle et constante depuis que j'utilise l'application.",
    product: 'Courses hebdomadaires',
    initials: 'MC',
  },
  {
    name: 'Jean-Louis B.',
    territory: 'Martinique',
    flag: '🇲🇶',
    savings: '31 %',
    savingsLabel: 'de moins sur le riz',
    quote: 'Le même riz que j\'achetais 3,20 € était affiché 2,20 € dans l\'enseigne à deux rues. En un clic, j\'ai su où aller.',
    product: 'Riz long grain 1 kg',
    initials: 'JL',
  },
  {
    name: 'Sophie D.',
    territory: 'La Réunion',
    flag: '🇷🇪',
    savings: '89 €',
    savingsLabel: 'économisés en 1 mois',
    quote: "L'alerte de prix m'a prévenue quand le lait et les conserves ont baissé. J'ai acheté au bon moment, sans attendre.",
    product: 'Produits laitiers & conserves',
    initials: 'SD',
  },
];

/** Static phone mockup for the hero — shows a price comparison screen */
const HERO_PRICES = [
  { store: 'E.Leclerc',    price: 1.11, color: '#22c55e' },
  { store: 'Carrefour GP', price: 1.45, color: '#f59e0b' },
  { store: 'Hyper U MQ',   price: 1.58, color: '#f97316' },
  { store: 'Score YT',     price: 2.03, color: '#ef4444' },
];

const PRIORITY_ACTIONS = [
  {
    title: 'Comparer un produit',
    description: 'Tapez un EAN, un nom ou utilisez le scan pour aller droit au comparateur.',
    to: '/comparateur',
  },
  {
    title: 'Choisir mon territoire',
    description: 'Accédez directement aux prix et magasins de votre zone.',
    to: '/comparateur?territoire=GP',
  },
  {
    title: 'Comprendre les écarts',
    description: 'Consultez ensuite l’observatoire complet seulement si vous en avez besoin.',
    to: '/comprendre-prix',
  },
];

const PRIMARY_TERRITORIES = [
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'GF', name: 'Guyane',     flag: '🇬🇫' },
  { code: 'RE', name: 'La Réunion', flag: '🇷🇪' },
  { code: 'YT', name: 'Mayotte',    flag: '🇾🇹' },
];

function HeroPhoneMockup() {
  const maxPrice = Math.max(...HERO_PRICES.map((d) => d.price));
  return (
    <div className="hero-phone-wrap">
      <div className="app-demo-phone">
        <div className="app-demo-phone-notch" />
        <div className="app-demo-phone-screen">
          <div className="demo-screen demo-screen--compare">
            <div className="demo-compare-header">
              <span className="demo-screen-title">🥛 Lait UHT 1L</span>
              <span className="demo-compare-date">Mars 2026</span>
            </div>
            <div className="demo-compare-bars">
              {HERO_PRICES.map((d, i) => (
                <div key={i} className="demo-compare-row">
                  <span className="demo-compare-store">{d.store}</span>
                  <div className="demo-compare-bar-wrap">
                    <div
                      className="demo-compare-bar"
                      style={{ width: `${Math.round((d.price / maxPrice) * 100)}%`, background: d.color }}
                    />
                  </div>
                  <span className="demo-compare-price" style={{ color: d.color }}>{d.price.toFixed(2)}€</span>
                </div>
              ))}
            </div>
            <div className="demo-compare-saving">
              💡 Économie : <strong>+0,92 €/L</strong> vs le moins cher
            </div>
          </div>
        </div>
        <div className="app-demo-phone-home" />
      </div>
      <div className="app-demo-glow" />
    </div>
  );
}

export default function HomeV5() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ scans: 1200, products: 5000, territories: 12 });
  const [displayStats, setDisplayStats] = useState({ scans: 0, products: 0, territories: 0 });
  const [statsAnimated, setStatsAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [showExtendedContent, setShowExtendedContent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [exampleComparison] = useState<PriceComparison>(getComparisonOfDay());
  const statsRef = useRef<HTMLElement | null>(null);

  // Scroll reveal — triggers `.revealed` on `.reveal` elements as they enter viewport
  useScrollReveal();

  // Animated counter: count up to target when section comes into view
  useEffect(() => {
    if (statsAnimated) return;
    const el = statsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsAnimated(true);
          observer.disconnect();

          const duration = 1400;
          const startTime = performance.now();

          const targets = { scans: stats.scans, products: stats.products, territories: stats.territories };

          const step = (now: number) => {
            const elapsed = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - elapsed, 3);
            setDisplayStats({
              scans: Math.round(targets.scans * ease),
              products: Math.round(targets.products * ease),
              territories: Math.round(targets.territories * ease),
            });
            if (elapsed < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stats, statsAnimated]);

  useEffect(() => {
    const loadedStats = safeLocalStorage.getJSON('platform_stats', {
      scans: 1200,
      products: 5000,
      territories: 12
    });
    setStats(loadedStats);

    let windowHeight = window.innerHeight;
    let windowWidth = window.innerWidth;
    let ticking = false;

    setShowScrollIndicator(windowWidth > 768);

    const handleResize = () => {
      windowHeight = window.innerHeight;
      windowWidth = window.innerWidth;
      setShowScrollIndicator(windowWidth > 768 && window.scrollY <= 100);
    };

    const handleScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        if (window.scrollY > 100) {
          setShowScrollIndicator(false);
        }

        if (windowWidth <= 768) {
          setShowMobileCTA(window.scrollY > windowHeight * 0.6);
        }

        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recherche-produits?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getTerritoryTitle = () => 'Comparez les prix réels près de chez vous';

  return (
    <>
      <SEOHead
        title="A KI PRI SA YÉ – Transparence des prix Outre-mer"
        description="Comparez les prix en Guadeloupe, Martinique, Guyane, La Réunion et dans tous les territoires ultramarins. Données citoyennes réelles, scanneur de produits, observatoire des prix."
        canonical="https://teetee971.github.io/akiprisaye-web/"
      />
    <div className="home-v5">
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <section className="hero-v5">
        {/* ── Hero background image — explicit <img> for LCP optimisation ── */}
        <img
          src="https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fm=webp&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden="true"
          width={1600}
          height={900}
          fetchpriority="high"
          decoding="async"
          crossOrigin="anonymous"
          className="hero-bg-img"
        />
        {/* ── Aurora gradient orbs ── */}
        <div className="aurora-bg" aria-hidden="true">
          <div className="aurora-orb aurora-orb--1" />
          <div className="aurora-orb aurora-orb--2" />
          <div className="aurora-orb aurora-orb--3" />
          <div className="aurora-orb aurora-orb--4" />
        </div>

        {/* ── Floating particles ── */}
        <div className="particles-container" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={`particle particle--${i + 1}`} />
          ))}
        </div>

        {/* ── Morphing blob ── */}
        <div className="blob-decoration blob-decoration--hero" aria-hidden="true" />

        <div className="hero-inner">
          {/* Left column: headline + search */}
          <div className="hero-content fade-in">
            <h1 className="hero-title slide-up">{getTerritoryTitle()}.</h1>

            <p className="hero-subtitle slide-up delay-100">
              Comparez vite, sans surcharge, avec des données locales pensées pour les DOM-TOM.
            </p>
            <p className="hero-reassurance fade-in delay-150">
              Sans compte. Données locales. Vos recherches restent sur votre appareil.
            </p>

            <form onSubmit={handleSearch} className="hero-search-xxl fade-in delay-200 border-scan">
              <input
                type="text"
                placeholder="Ex : riz 5kg, lait, eau…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hero-search-input-xxl"
                aria-label="Rechercher un produit"
              />
              <button type="submit" className="hero-search-btn-xxl btn-neon" aria-label="Rechercher un produit">
                Rechercher un produit
              </button>
            </form>
            <p className="hero-explain fade-in delay-300">EAN, nom de produit ou scan → comparaison instantanée.</p>
            <p className="hero-trust fade-in delay-300">
              <span className="badge-live">
                <span className="badge-live-dot" aria-hidden="true" />
                <span>Données en direct</span>
              </span>
              {' · '}Comparateur prioritaire, observatoire complet à la demande.
            </p>
          </div>

          {/* Right column: phone mockup illustration */}
          <div className="hero-phone-side fade-in delay-200" aria-hidden="true">
            <HeroPhoneMockup />
          </div>
        </div>

        {showScrollIndicator && (
          <div
            className="scroll-indicator fade-in delay-300"
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
          >
            <div className="scroll-arrow float-y">↓</div>
            <span className="scroll-text">Découvrir</span>
          </div>
        )}
      </section>

      <main id="main-content">
        <section className="hero-why section-reveal">
          <div className="hero-why-inner">
            <h2 className="hero-why-title">Pourquoi A KI PRI SA YÉ ?</h2>
            <div className="hero-why-grid">
              <div className="hero-why-card">
                <p className="hero-why-heading">Pourquoi ce service existe</p>
                <p className="hero-why-text">
                  Parce que les comparateurs classiques ne montrent pas les vrais prix des DOM-TOM.
                </p>
              </div>
              <div className="hero-why-card">
                <p className="hero-why-heading">Ce que vous voyez ici</p>
                <ul className="hero-why-list">
                  <li>Prix observés localement</li>
                  <li>Comparaison entre enseignes</li>
                  <li>Historique automatique</li>
                  <li>Favoris pour décider plus tard</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="home-priority section-reveal">
          <div className="home-priority-header">
            <h2 className="section-title">Le plus utile, sans surcharge</h2>
            <p className="home-priority-text">
              Nous avons réduit la page d’accueil à l’essentiel : chercher, choisir son territoire et comparer rapidement.
            </p>
          </div>
          <div className="home-priority-grid">
            {PRIORITY_ACTIONS.map((action) => (
              <Link key={action.title} to={action.to} className="home-priority-card">
                <span className="home-priority-card-title">{action.title}</span>
                <span className="home-priority-card-text">{action.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="territories-section section-reveal">
          <div className="territories-header">
            <h2>Mon territoire</h2>
            <p>Comparez les prix directement dans votre zone.</p>
          </div>
          <div className="territories-photo-grid">
            {PRIMARY_TERRITORIES.map((territory) => {
              const asset = getTerritoryAsset(territory.code);
              return (
                <Link
                  key={territory.code}
                  className="territory-photo-card"
                  to={`/comparateur?territoire=${territory.code}`}
                  aria-label={`Comparer les prix en ${territory.name}`}
                >
                  <img
                    src={asset.url}
                    alt={asset.alt}
                    className="territory-photo-img"
                    loading="lazy"
                    width="200"
                    height="120"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="territory-photo-overlay">
                    <span className="territory-photo-flag">{territory.flag}</span>
                    <span className="territory-photo-name">{territory.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section ref={statsRef} className="proof-bar fade-in section-reveal">
          <div className="proof-content">
            <div className="proof-item">
              <span className="proof-icon"><BarChart2 className="w-5 h-5 text-blue-400" aria-hidden="true" /></span>
              <span className="proof-text"><strong>{displayStats.territories || stats.territories}</strong> territoires</span>
            </div>
            <div className="proof-divider">|</div>
            <div className="proof-item">
              <span className="proof-icon"><ShoppingCart className="w-5 h-5 text-blue-400" aria-hidden="true" /></span>
              <span className="proof-text"><strong>{(displayStats.products || stats.products).toLocaleString()}+</strong> produits</span>
            </div>
            <div className="proof-divider">|</div>
            <div className="proof-item">
              <span className="proof-icon"><Receipt className="w-5 h-5 text-blue-400" aria-hidden="true" /></span>
              <span className="proof-text"><strong>{(displayStats.scans || stats.scans).toLocaleString()}+</strong> scans</span>
            </div>
            <div className="proof-divider">|</div>
            <div className="proof-item">
              <span className="proof-icon"><Landmark className="w-5 h-5 text-blue-400" aria-hidden="true" /></span>
              <span className="proof-text">Observatoire indépendant</span>
            </div>
          </div>
        </section>

        <section className="example-comparison section-reveal">
          <h2 className="section-title slide-up">Exemple de comparaison</h2>
          <div className="comparison-card fade-in">
            {/* Product image strip */}
            {(() => {
              const prodImg = getProductImage(exampleComparison.product);
              return (
                <div className="comparison-product-img-wrap">
                  <img
                    src={prodImg.url}
                    alt={prodImg.alt}
                    className="comparison-product-img"
                    loading="lazy"
                    width="300"
                    height="120"
                  />
                  <div className="comparison-product-img-overlay" aria-hidden="true" />
                </div>
              );
            })()}
            <div className="comparison-cols">
              <div className="comparison-col">
                <div className="comparison-header">
                  <span className="comparison-flag">{exampleComparison.territoryFlag}</span>
                  <h3 className="comparison-territory">{exampleComparison.territory}</h3>
                </div>
                <p className="comparison-product">{exampleComparison.product}</p>
                <p className="comparison-price">{exampleComparison.territoryPrice.toFixed(2)} €</p>
                <p className="comparison-delta">+{exampleComparison.deltaPercent}% plus cher</p>
              </div>
              <div className="comparison-divider">
                <span className="comparison-vs">VS</span>
              </div>
              <div className="comparison-col">
                <div className="comparison-header">
                  <span className="comparison-flag">🇫🇷</span>
                  <h3 className="comparison-territory">Métropole</h3>
                </div>
                <p className="comparison-product">{exampleComparison.product}</p>
                <p className="comparison-price">{exampleComparison.metropolePrice.toFixed(2)} €</p>
                <p className="comparison-reference">Prix de référence</p>
              </div>
            </div>
          </div>
          <div className="comparison-cta fade-in">
            <Link to="/comparateur" className="btn-comparison">
              Voir plus de comparaisons
            </Link>
          </div>
        </section>

        <section className="home-extended-toggle section-reveal">
          <div className="home-extended-card">
            <p className="home-extended-eyebrow">Page d’accueil simplifiée</p>
            <h2 className="home-extended-title">Le reste du contenu est disponible uniquement si vous le souhaitez</h2>
            <p className="home-extended-text">
              L’observatoire détaillé, les graphiques, les témoignages et la FAQ restent accessibles sans surcharger l’arrivée sur la page.
            </p>
            <button
              type="button"
              className="home-extended-button"
              onClick={() => setShowExtendedContent((current) => !current)}
              aria-expanded={showExtendedContent}
              aria-controls="home-extended-content"
            >
              {showExtendedContent ? 'Masquer la vue complète' : 'Voir toute la page d’accueil'}
            </button>
          </div>
        </section>

        {showExtendedContent && (
          <div id="home-extended-content">
            <PriceLiveTicker />

            {/* ── 3D Flip Stat Cards ── */}
            <section className="reveal px-4 pb-4 pt-2 max-w-5xl mx-auto w-full" aria-label="Statistiques clés">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FlipStatCard
                  value={`${stats.territories}`}
                  label="Territoires"
                  icon="🗺️"
                  backContent="Guadeloupe, Martinique, Guyane, La Réunion, Mayotte et plus encore."
                />
                <FlipStatCard
                  value={`${stats.products.toLocaleString()}+`}
                  label="Produits comparés"
                  icon="🛒"
                  backContent="Alimentaire, hygiène, entretien — relevés citoyens vérifiés."
                />
                <FlipStatCard
                  value={`${stats.scans.toLocaleString()}+`}
                  label="Scans effectués"
                  icon="📷"
                  backContent="Codes-barres et tickets OCR analysés par la communauté."
                />
                <FlipStatCard
                  value="~35%"
                  label="Surcoût moyen DOM"
                  icon="📊"
                  backContent="Par rapport à l'Hexagone — source observatoire citoyen mars 2026."
                />
              </div>
            </section>

            <section className="benefits section-reveal reveal">
              <h2 className="section-title slide-up">Ce que vous gagnez</h2>
              <div className="benefits-grid reveal-stagger">
                {[
                  "Comparez les prix AVANT d'acheter",
                  "Économisez jusqu'à 30% sur vos courses",
                  'Détectez les hausses anormales de prix',
                  'Exportez les données pour vos analyses'
                ].map((benefit) => (
                  <div key={benefit} className="benefit-item reveal slide-up">
                    <span className="benefit-check">✓</span>
                    <span className="benefit-text">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="territories-v5 section-reveal">
              <h2 className="section-title slide-up">12 territoires couverts</h2>
              <div className="territories-grid-v5">
                {[
                  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
                  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
                  { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
                  { code: 'RE', name: 'Réunion', flag: '🇷🇪' },
                  { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
                  { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
                  { code: 'PF', name: 'Polynésie française', flag: '🇵🇫' },
                  { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
                  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
                  { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱' },
                  { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫' },
                  { code: 'TF', name: 'TAAF', flag: '🇹🇫' }
                ].map((territory) => {
                  const asset = getTerritoryAsset(territory.code);
                  return (
                    <div
                      key={territory.code}
                      className="territory-photo-card fade-in"
                      title={territory.name}
                      aria-label={territory.name}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/comparateur?territoire=${territory.code}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/comparateur?territoire=${territory.code}`); }}
                    >
                      <img
                        src={asset.url}
                        alt={asset.alt}
                        className="territory-photo-img"
                        loading="lazy"
                        width="200"
                        height="150"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="territory-photo-overlay">
                        <span className="territory-photo-flag">{territory.flag}</span>
                        <span className="territory-photo-name">{territory.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                        <p className="testimonial-location">
                          <span>{t.flag}</span>
                          <span>{t.territory}</span>
                        </p>
                      </div>
                      <div className="testimonial-savings-badge">
                        <span className="testimonial-savings">{t.savings}</span>
                        <span className="testimonial-savings-label">{t.savingsLabel}</span>
                      </div>
                    </div>
                    <p className="testimonial-quote">{t.quote}</p>
                    <span className="testimonial-product-tag">🛒 {t.product}</span>
                  </div>
                ))}
              </div>
            </section>

            <Suspense fallback={null}>
              <HowItWorksSection />
            </Suspense>

            {/* App demo showcase — CSS phone mockup with real data screens */}
            <Suspense fallback={null}>
              <AppDemoShowcase />
            </Suspense>

            {/* Real price chart — territory comparison with real observatoire data */}
            <Suspense fallback={null}>
              <TerritoryPriceChart />
            </Suspense>

            {/* Price evolution line chart — 5-month trend from real observatoire snapshots */}
            <Suspense fallback={null}>
              <PriceEvolutionChart />
            </Suspense>

            {/* Panier vital — purchasing power index: minutes of SMIC per basket */}
            <Suspense fallback={null}>
              <PanierVitalWidget />
            </Suspense>
            {/* Store ranking widget — cheapest vs most expensive stores per territory */}
            <Suspense fallback={null}>
              <StoreRankingWidget />
            </Suspense>

            {/* Why such price gaps? Explainer fiche with source links + conference CTA */}
            <Suspense fallback={null}>
              <PriceExplainerBanner />
            </Suspense>

            {/* AI daily briefing — latest editorial about DOM/COM news of the day */}
            <Suspense fallback={null}>
              <LettreJourWidget />
            </Suspense>

            {/* AI weekly letter — latest editorial about DOM/COM news */}
            <Suspense fallback={null}>
              <LettreHebdoWidget />
            </Suspense>

            {/* Inflation barometer — dynamic month-over-month basket trend from real snapshots */}
            <Suspense fallback={null}>
              <InflationBarometerWidget />
            </Suspense>

            {/* Price shock ranking — top 5 products with biggest inter-territory price gap */}
            <Suspense fallback={null}>
              <ProduitChocWidget />
            </Suspense>

            {/* Equity index — composite multi-product price equity score per territory vs hexagone */}
            <Suspense fallback={null}>
              <IndiceEquiteWidget />
            </Suspense>

            {/* Category overcost chart — DOM surcoût vs Hexagone by category */}
            <Suspense fallback={null}>
              <CategoryOvercostChart />
            </Suspense>

            {/* Video section — vie chère outre-mer explained with lazy YouTube embeds */}
            <Suspense fallback={null}>
              <VideoVieChere />
            </Suspense>

            {/* Live news feed from actualites.json — real data only */}
            <Suspense fallback={null}>
              <LiveNewsFeed />
            </Suspense>

            <Suspense fallback={null}>
              <ObservatorySection />
            </Suspense>

            <Suspense fallback={null}>
              <MiniFaqSection expandedFaq={expandedFaq} onToggleFaq={setExpandedFaq} />
            </Suspense>
          </div>
        )}

        <footer className="footer-minimal fade-in section-reveal">
          <Link to="/faq">FAQ</Link>
          <span>•</span>
          <Link to="/methodologie">Méthodologie</Link>
          <span>•</span>
          <Link to="/contact">Contact</Link>
          <span>•</span>
          <Link to="/mentions-legales">Mentions légales</Link>
        </footer>
      </main>

      {showMobileCTA && (
        <div className="mobile-sticky-cta slide-up">
          <Link to="/comparateur" className="mobile-cta-btn">
            <Search className="w-4 h-4 inline-block mr-1 align-text-bottom" aria-hidden="true" /> Rechercher un produit
          </Link>
        </div>
      )}
    </div>
    </>
  );
}
