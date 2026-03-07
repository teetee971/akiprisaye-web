// @ts-nocheck -- Legacy presentational component with untyped props; TODO: add proper types
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import './ScanProductPWA.css';

export default function ScanProductPWA({ product, stores, france, history, insights, features, territories, pwaInstallPrompt }) {
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
        <img src={product.image} alt={product.name} className="pwa-img"/>
        <div>
          <h2>{product.name}</h2>
          <div className="pwa-brand-cat">{product.brand} | <span>{product.category}</span></div>
          <div className="pwa-tags">{product.nutriScore} | {product.ecoScore}</div>
          <div className="pwa-barcode">Code-barres : {product.barcode}</div>
        </div>
      </section>
      <div className="pwa-cards">
        {stores.map((store,idx)=>(
          <div key={idx} className="pwa-card" title={`Top ${store.rank} territoire`}>
            <div className="pwa-card-label">{store.label}</div>
            <img src={store.logo} alt={store.brand} className="pwa-card-logo"/>
            <div>{store.brand}</div>
            <div className="pwa-card-price">{store.price.toFixed(2)} €</div>
            <div className="pwa-card-detail">{store.store} • {store.distance}</div>
            <span className="pwa-chip-ter">{store.territory}</span>
          </div>
        ))}
      </div>
      <div className="pwa-diff">
        🇫🇷 {france.price.toFixed(2)} € | +{diffEuro} € | +{diffPct}%
        <span className="pwa-diff-avg">[Moyenne cat. : {france.avg} €]</span>
      </div>
      <section className="pwa-graph">
        <svg width="130" height="38">
          {history.map((v,i) =>
            i>0?
              <line key={i}
                x1={(i-1)*18} y1={38-history[i-1]*8}
                x2={i*18} y2={38-v*8}
                stroke="#12b8ff" strokeWidth="2"/>:null)}
          {history.map((v,i)=>(
            <circle key={i} cx={i*18} cy={38-v*8} r="3" fill="#fa6c2a"/>
          ))}
        </svg>
        <span>Tendance prix / 6 mois</span>
      </section>
      <section className="pwa-insights">
        {insights.map((ins,i)=><span key={i} className="pwa-insight">{ins}</span>)}
      </section>
      <section className="pwa-actions">
        {features.map((f,i) => (
          <button key={i} className="pwa-feature">{f.icon} {f.label}</button>
        ))}
      </section>
      <section className="pwa-ter-row">
        <span>Compare aussi :</span>
        {territories.map((t,i) => <span key={i} className="pwa-ter">{t}</span>)}
      </section>
    </div>
  );
}
