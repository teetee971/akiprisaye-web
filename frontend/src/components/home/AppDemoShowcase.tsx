/**
 * AppDemoShowcase — Maquette interactive du logiciel A KI PRI SA YÉ
 *
 * Affiche 3 écrans CSS/SVG dans des maquettes de téléphone réalistes,
 * illustrant les 3 fonctionnalités clés de l'application :
 *   1. Scan code-barres → résultat prix instantané
 *   2. Comparaison enseignes → histogramme prix
 *   3. Indice territoire → carte de surcoût DOM
 *
 * Toutes les données affichées sont issues des snapshots réels
 * de l'observatoire citoyen (mars 2026).
 *
 * Aucune dépendance externe — entièrement CSS + SVG.
 */

import { useState, useEffect, useRef } from 'react';

// Real prices from observatoire 2026-03 for "Lait demi-écrémé UHT 1L"
const DEMO_PRICES = [
  { store: 'E.Leclerc', price: 1.11, territory: 'Hexagone', color: '#22c55e' },
  { store: 'Carrefour GP', price: 1.45, territory: 'Guadeloupe', color: '#f59e0b' },
  { store: 'Hyper U MQ', price: 1.58, territory: 'Martinique', color: '#f97316' },
  { store: 'Carrefour GF', price: 1.86, territory: 'Guyane', color: '#ef4444' },
  { store: 'Score YT', price: 2.03, territory: 'Mayotte', color: '#dc2626' },
];

// Real territory overcost data from IndiceEquite (mars 2026)
const TERRITORY_OVERCOSTS = [
  { code: 'GP', flag: '🇬🇵', label: 'Guadeloupe', pct: 39.3, color: '#f59e0b' },
  { code: 'MQ', flag: '🇲🇶', label: 'Martinique', pct: 37.5, color: '#f59e0b' },
  { code: 'RE', flag: '🇷🇪', label: 'La Réunion', pct: 38.2, color: '#f59e0b' },
  { code: 'GF', flag: '🇬🇫', label: 'Guyane', pct: 59.4, color: '#f97316' },
  { code: 'YT', flag: '🇾🇹', label: 'Mayotte', pct: 82.0, color: '#ef4444' },
  { code: 'BL', flag: '🇧🇱', label: 'St-Barth', pct: 99.5, color: '#dc2626' },
];

const SCREENS = ['scan', 'compare', 'territoire'] as const;
type Screen = (typeof SCREENS)[number];

const SCREEN_LABELS: Record<Screen, string> = {
  scan: '📷 Scanner',
  compare: '📊 Comparer',
  territoire: '🗺️ Territoire',
};

/** Animated barcode SVG */
function BarcodeLines() {
  return (
    <svg viewBox="0 0 120 50" width="120" height="50" aria-hidden="true" className="demo-barcode">
      {[
        3, 7, 10, 14, 18, 21, 25, 28, 32, 37, 41, 44, 48, 52, 56, 59, 63, 67, 71, 74, 78, 82, 86,
        89, 93, 97, 101, 104, 108, 112, 116,
      ].map((x, i) => (
        <rect
          key={i}
          x={x}
          y="0"
          width={i % 5 === 0 ? 3 : 1.5}
          height="50"
          fill="#e2e8f0"
          opacity={0.9}
        />
      ))}
    </svg>
  );
}

/** Screen 1: Scan result */
function ScanScreen() {
  return (
    <div className="demo-screen demo-screen--scan">
      <div className="demo-scan-header">
        <span className="demo-scan-back">←</span>
        <span className="demo-screen-title">Scanner un produit</span>
      </div>
      <div className="demo-scan-viewfinder">
        <div className="demo-scan-corners" aria-hidden="true" />
        <BarcodeLines />
        <div className="demo-scan-laser" aria-hidden="true" />
        <p className="demo-scan-hint">Pointez sur le code-barres</p>
      </div>
      <div className="demo-scan-result fade-in">
        <div className="demo-scan-product-row">
          <span className="demo-scan-emoji">🥛</span>
          <div>
            <p className="demo-scan-product-name">Lait demi-écrémé UHT 1L</p>
            <p className="demo-scan-ean">Code-barres : 3560070123456</p>
          </div>
        </div>
        <div className="demo-scan-price-row">
          <span className="demo-scan-price">1,45 €</span>
          <span className="demo-scan-badge demo-scan-badge--warn">+31% vs métropole</span>
        </div>
        <button className="demo-scan-cta" aria-label="Voir comparaison complète">
          Voir la comparaison complète →
        </button>
      </div>
    </div>
  );
}

/** Screen 2: Price comparison bars */
function CompareScreen() {
  const maxPrice = Math.max(...DEMO_PRICES.map((d) => d.price));
  return (
    <div className="demo-screen demo-screen--compare">
      <div className="demo-compare-header">
        <span className="demo-screen-title">🥛 Lait UHT 1L</span>
        <span className="demo-compare-date">Mars 2026</span>
      </div>
      <div className="demo-compare-bars">
        {DEMO_PRICES.map((d, i) => {
          const width = Math.round((d.price / maxPrice) * 100);
          return (
            <div key={i} className="demo-compare-row">
              <span className="demo-compare-store">{d.store}</span>
              <div className="demo-compare-bar-wrap">
                <div
                  className="demo-compare-bar"
                  style={{ transform: `scaleX(${width / 100})`, background: d.color }}
                />
              </div>
              <span className="demo-compare-price" style={{ color: d.color }}>
                {d.price.toFixed(2)}€
              </span>
            </div>
          );
        })}
      </div>
      <div className="demo-compare-saving">
        💡 Économie possible : <strong>+0,92 €/L</strong> vs le moins cher
      </div>
    </div>
  );
}

/** Screen 3: Territory equity map */
function TerritoireScreen() {
  return (
    <div className="demo-screen demo-screen--territoire">
      <div className="demo-terr-header">
        <span className="demo-screen-title">⚖️ Indice Équité</span>
        <span className="demo-terr-sub">Surcoût vs Hexagone</span>
      </div>
      <div className="demo-terr-list">
        {TERRITORY_OVERCOSTS.map((t) => {
          const barW = Math.min(96, Math.round((t.pct / 100) * 96));
          return (
            <div key={t.code} className="demo-terr-row">
              <span className="demo-terr-flag" aria-hidden="true">
                {t.flag}
              </span>
              <span className="demo-terr-label">{t.label}</span>
              <div className="demo-terr-bar-wrap">
                <div
                  className="demo-terr-bar"
                  style={{ transform: `scaleX(${barW / 100})`, background: t.color }}
                />
              </div>
              <span className="demo-terr-pct" style={{ color: t.color }}>
                +{t.pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AppDemoShowcase() {
  const [activeScreen, setActiveScreen] = useState<Screen>('compare');
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Auto-cycle screens every 4s when section is visible
  useEffect(() => {
    if (!visible) return;
    const idx = SCREENS.indexOf(activeScreen);
    const timer = setTimeout(() => {
      setActiveScreen(SCREENS[(idx + 1) % SCREENS.length]);
    }, 4000);
    return () => clearTimeout(timer);
  }, [activeScreen, visible]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="app-demo-section section-reveal"
      aria-labelledby="app-demo-heading"
    >
      <div className="app-demo-inner">
        {/* Left: text content */}
        <div className="app-demo-text slide-up">
          <h2 id="app-demo-heading" className="app-demo-title">
            L'application en action
          </h2>
          <p className="app-demo-sub">
            Scannez, comparez et économisez — directement depuis votre téléphone, avec des données
            réelles relevées sur le terrain.
          </p>
          <ul className="app-demo-features" aria-label="Fonctionnalités">
            <li>
              <span className="app-demo-feat-icon">📷</span>
              <div>
                <strong>Scan instantané</strong>
                <span> — visez le code-barres, obtenez le bon prix</span>
              </div>
            </li>
            <li>
              <span className="app-demo-feat-icon">📊</span>
              <div>
                <strong>Comparaison multi-enseignes</strong>
                <span> — tous les prix côte à côte, par territoire</span>
              </div>
            </li>
            <li>
              <span className="app-demo-feat-icon">⚖️</span>
              <div>
                <strong>Indice d'équité tarifaire</strong>
                <span> — mesurez le surcoût réel dans votre territoire</span>
              </div>
            </li>
            <li>
              <span className="app-demo-feat-icon">🔔</span>
              <div>
                <strong>Alertes de prix</strong>
                <span> — soyez notifié quand un prix baisse</span>
              </div>
            </li>
          </ul>
          {/* Screen selector */}
          <div className="app-demo-tabs" role="tablist" aria-label="Écrans de démonstration">
            {SCREENS.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={s === activeScreen}
                aria-controls={`app-demo-screen-${s}`}
                className={`app-demo-tab${s === activeScreen ? ' app-demo-tab--active' : ''}`}
                onClick={() => setActiveScreen(s)}
              >
                {SCREEN_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Right: phone mockup */}
        <div className="app-demo-phone-wrap fade-in" aria-label="Aperçu de l'application">
          <div className="app-demo-phone">
            <div className="app-demo-phone-notch" aria-hidden="true" />
            <div
              className="app-demo-phone-screen"
              role="tabpanel"
              id={`app-demo-screen-${activeScreen}`}
              aria-labelledby={`app-demo-tab-${activeScreen}`}
            >
              {activeScreen === 'scan' && <ScanScreen />}
              {activeScreen === 'compare' && <CompareScreen />}
              {activeScreen === 'territoire' && <TerritoireScreen />}
            </div>
            <div className="app-demo-phone-home" aria-hidden="true" />
          </div>
          {/* Decorative glow */}
          <div className="app-demo-glow" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
