import React from 'react';
import './ScanProductPWA.css';

interface ProductInfo {
  image: string;
  name: string;
  brand: string;
  category: string;
  nutriScore: string;
  ecoScore: string;
  barcode: string;
}

interface StorePrice {
  rank: number;
  label: string;
  logo: string;
  brand: string;
  price: number;
  store: string;
  distance: string;
  territory: string;
}

interface FranceReference {
  price: number;
  avg: number;
}

interface ProductFeature {
  icon: string;
  label: string;
}

interface ScanProductPWAProps {
  product: ProductInfo;
  stores: StorePrice[];
  france: FranceReference;
  history: number[];
  insights: string[];
  features: ProductFeature[];
  territories: string[];
  pwaInstallPrompt?: (() => void) | null;
}

export default function ScanProductPWA({ product, stores, france, history, insights, features, territories }: ScanProductPWAProps) {
  const diffEuro = (stores[0].price - france.price).toFixed(2);
  const diffPct = ((stores[0].price - france.price) / france.price * 100).toFixed(2);

  return (
    <div className="scan-pwa-card">
      <header className="pwa-header">
        <button className="pwa-back" aria-label="Retour"><span aria-hidden="true">←</span></button>
        <span className="pwa-title">Produit scanné</span>
        <button className="pwa-share" aria-label="Partager"><span aria-hidden="true">🔗</span></button>
      </header>
      <section className="pwa-info">
        <img src={product.image} alt={product.name} width={96} height={96} loading="lazy" className="pwa-img"/>
        <div>
          <h2>{product.name}</h2>
          <div className="pwa-brand-cat">{product.brand} | <span>{product.category}</span></div>
          <div className="pwa-tags">{product.nutriScore} | {product.ecoScore}</div>
          <div className="pwa-barcode">Code-barres : {product.barcode}</div>
        </div>
      </section>
      <div className="pwa-cards">
        {stores.map((store) => (
          <div key={`${store.brand}-${store.store}-${store.territory}`} className="pwa-card" title={`Top ${store.rank} territoire`}>
            <div className="pwa-card-label">{store.label}</div>
            <img src={store.logo} alt={store.brand} width={40} height={40} loading="lazy" className="pwa-card-logo"/>
            <div>{store.brand}</div>
            <div className="pwa-card-price">{store.price.toFixed(2)} €</div>
            <div className="pwa-card-detail">{store.store} • {store.distance}</div>
            <span className="pwa-chip-ter">{store.territory}</span>
          </div>
        ))}
      </div>
      <div className="pwa-diff">
        🇫🇷 {france.price.toFixed(2)} € | +{diffEuro} € | +{diffPct}%
        <span className="pwa-diff-avg">[Moyenne cat. : {france.avg} €]</span>
      </div>
      <section className="pwa-graph">
        <svg width="130" height="38">
          {history.map((v, i) =>
            i > 0 ? (
              <line key={`line-${i}`}
                x1={(i - 1) * 18} y1={38 - history[i - 1] * 8}
                x2={i * 18} y2={38 - v * 8}
                stroke="#12b8ff" strokeWidth="2"/>
            ) : null)}
          {history.map((_v, i) => (
            <circle key={`dot-${i}`} cx={i * 18} cy={38 - history[i] * 8} r="3" fill="#fa6c2a"/>
          ))}
        </svg>
        <span>Tendance prix / 6 mois</span>
      </section>
      <section className="pwa-insights">
        {insights.map((ins) => <span key={ins} className="pwa-insight">{ins}</span>)}
      </section>
      <section className="pwa-actions">
        {features.map((f) => (
          <button key={f.label} className="pwa-feature">{f.icon} {f.label}</button>
        ))}
      </section>
      <section className="pwa-ter-row">
        <span>Compare aussi :</span>
        {territories.map((t) => <span key={t} className="pwa-ter">{t}</span>)}
      </section>
    </div>
  );
}
