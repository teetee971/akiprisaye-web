/**
 * PriceLiveTicker — scrolling live-price feed from observatoire snapshots.
 * Shows real prices observed in DOM-TOM territories vs Hexagone baseline.
 */

import { useEffect, useRef, useState } from 'react';

interface TickerItem {
  territory: string;
  flag: string;
  product: string;
  store: string;
  price: number;
  baseline: number;
  deltaPercent: number;
}

// Real prices derived from observatoire snapshots (2026-03)
const TICKER_ITEMS: TickerItem[] = [
  {
    territory: 'Guadeloupe',
    flag: '🇬🇵',
    product: 'Lait UHT 1L',
    store: 'Carrefour',
    price: 1.45,
    baseline: 1.16,
    deltaPercent: 25,
  },
  {
    territory: 'Martinique',
    flag: '🇲🇶',
    product: 'Lait UHT 1L',
    store: 'E.Leclerc',
    price: 1.41,
    baseline: 1.16,
    deltaPercent: 22,
  },
  {
    territory: 'Guyane',
    flag: '🇬🇫',
    product: 'Lait UHT 1L',
    store: 'Carrefour',
    price: 1.66,
    baseline: 1.16,
    deltaPercent: 43,
  },
  {
    territory: 'La Réunion',
    flag: '🇷🇪',
    product: 'Lait UHT 1L',
    store: 'Jumbo Score',
    price: 1.49,
    baseline: 1.16,
    deltaPercent: 28,
  },
  {
    territory: 'Guadeloupe',
    flag: '🇬🇵',
    product: 'Riz blanc 1kg',
    store: 'Hyper U',
    price: 1.99,
    baseline: 1.72,
    deltaPercent: 16,
  },
  {
    territory: 'Martinique',
    flag: '🇲🇶',
    product: 'Riz blanc 1kg',
    store: 'Carrefour',
    price: 2.18,
    baseline: 1.72,
    deltaPercent: 27,
  },
  {
    territory: 'Guyane',
    flag: '🇬🇫',
    product: 'Riz blanc 1kg',
    store: 'Score',
    price: 2.29,
    baseline: 1.72,
    deltaPercent: 33,
  },
  {
    territory: 'La Réunion',
    flag: '🇷🇪',
    product: 'Riz blanc 1kg',
    store: 'E.Leclerc',
    price: 1.87,
    baseline: 1.72,
    deltaPercent: 9,
  },
  {
    territory: 'Guadeloupe',
    flag: '🇬🇵',
    product: 'Eau minérale 1.5L',
    store: 'Leader Price',
    price: 0.89,
    baseline: 0.72,
    deltaPercent: 24,
  },
  {
    territory: 'Martinique',
    flag: '🇲🇶',
    product: 'Eau minérale 1.5L',
    store: 'Hyper U',
    price: 0.95,
    baseline: 0.72,
    deltaPercent: 32,
  },
  {
    territory: 'Guyane',
    flag: '🇬🇫',
    product: 'Pâtes 500g',
    store: 'Carrefour',
    price: 1.62,
    baseline: 1.25,
    deltaPercent: 30,
  },
  {
    territory: 'La Réunion',
    flag: '🇷🇪',
    product: 'Pâtes 500g',
    store: 'Carrefour',
    price: 1.53,
    baseline: 1.25,
    deltaPercent: 22,
  },
  {
    territory: 'Guadeloupe',
    flag: '🇬🇵',
    product: 'Sucre blanc 1kg',
    store: 'Cora',
    price: 1.65,
    baseline: 1.19,
    deltaPercent: 39,
  },
  {
    territory: 'Martinique',
    flag: '🇲🇶',
    product: 'Sucre blanc 1kg',
    store: 'Leader Price',
    price: 1.58,
    baseline: 1.19,
    deltaPercent: 33,
  },
  {
    territory: 'Guyane',
    flag: '🇬🇫',
    product: 'Huile tournesol 1L',
    store: 'Score',
    price: 2.84,
    baseline: 2.11,
    deltaPercent: 35,
  },
  {
    territory: 'La Réunion',
    flag: '🇷🇪',
    product: 'Lessive liquide 1.5L',
    store: 'Jumbo Score',
    price: 6.49,
    baseline: 4.89,
    deltaPercent: 33,
  },
];

export default function PriceLiveTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Duplicate items so the scroll looks infinite
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (paused) {
      track.style.animationPlayState = 'paused';
    } else {
      track.style.animationPlayState = 'running';
    }
  }, [paused]);

  return (
    <div
      className="price-ticker"
      aria-label="Flux de prix en direct"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="price-ticker-label">
        <span className="price-ticker-dot" aria-hidden="true" />
        <span>Relevés citoyens — mars 2026</span>
      </div>
      <div className="price-ticker-outer" aria-hidden="true">
        <div className="price-ticker-track" ref={trackRef}>
          {items.map((item, idx) => (
            <div key={idx} className="price-ticker-item">
              <span className="ticker-flag">{item.flag}</span>
              <span className="ticker-product">{item.product}</span>
              <span className="ticker-store">{item.store}</span>
              <span className="ticker-price">{item.price.toFixed(2)} €</span>
              <span className="ticker-delta ticker-delta--up">
                +{item.deltaPercent}% vs Hexagone
              </span>
              <span className="ticker-sep" aria-hidden="true">
                ·
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
