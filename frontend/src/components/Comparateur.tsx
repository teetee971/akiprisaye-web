import { useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Price = {
  id: string;
  amount: number;
  store: string;
  source: string;
  date: Timestamp;
};

type Product = {
  id: string;
  name: string;
  ean: string;
};

// Average food price surcharge in DOM vs metropolitan France (source: IEDOM / DGCCRF)
const DOM_TERRITORY_SURCHARGES: Record<string, { label: string; surcharge: number; flag: string }> =
  {
    GP: { label: 'Guadeloupe', surcharge: 13, flag: '🇬🇵' },
    MQ: { label: 'Martinique', surcharge: 11, flag: '🇲🇶' },
    GF: { label: 'Guyane', surcharge: 17, flag: '🇬🇫' },
    RE: { label: 'La Réunion', surcharge: 12, flag: '🇷🇪' },
    YT: { label: 'Mayotte', surcharge: 14, flag: '🇾🇹' },
  };

function DomMetroGapIndicator({ prices }: { prices: Price[] }) {
  if (prices.length < 2) return null;
  const amounts = prices.map((p) => p.amount);
  const minPrice = Math.min(...amounts);
  const maxPrice = Math.max(...amounts);
  const avgPrice = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const gapPct = Math.round(((maxPrice - minPrice) / minPrice) * 100);
  const isSignificant = gapPct >= 10;

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.85rem 1rem',
        borderRadius: 10,
        background: isSignificant ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)',
        border: `1px solid ${isSignificant ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
        {isSignificant ? '⚠️' : '📊'} Écart de prix observé
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem' }}>
        <span>
          Min : <strong>{minPrice.toFixed(2)} €</strong>
        </span>
        <span>
          Max : <strong>{maxPrice.toFixed(2)} €</strong>
        </span>
        <span>
          Moy : <strong>{avgPrice.toFixed(2)} €</strong>
        </span>
        <span style={{ color: isSignificant ? '#ef4444' : '#3b82f6', fontWeight: 700 }}>
          Écart : +{gapPct}%
        </span>
      </div>
      <div
        style={{
          marginTop: '0.6rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '0.5rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>
          📍 Surcoût alimentaire moyen DOM vs métropole (IEDOM 2023)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {Object.values(DOM_TERRITORY_SURCHARGES).map((t) => (
            <span
              key={t.label}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                fontSize: '0.72rem',
                color: '#94a3b8',
              }}
            >
              {t.flag} {t.label} <strong style={{ color: '#f97316' }}>+{t.surcharge}%</strong>
            </span>
          ))}
        </div>
        <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#475569' }}>
          💡 Pour réduire votre coût, comparez les enseignes locales et consultez les produits du
          Bouclier Qualité Prix (BQP).
        </div>
      </div>
    </div>
  );
}

export default function Comparateur() {
  const [ean, setEan] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProduct = async () => {
    if (!ean) return;

    setLoading(true);
    setError(null);
    setProducts([]);
    setPrices([]);

    try {
      if (!db) {
        setError('Service non disponible.');
        setLoading(false);
        return;
      }
      // Recherche du produit
      const productQuery = query(collection(db, 'products'), where('ean', '==', ean));

      const productSnap = await getDocs(productQuery);

      const foundProducts: Product[] = productSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, 'id'>),
      }));

      setProducts(foundProducts);

      // Recherche des prix si produit trouvé
      if (foundProducts.length > 0) {
        const priceQuery = query(collection(db, 'prices'), where('ean', '==', ean));

        const priceSnap = await getDocs(priceQuery);

        const foundPrices: Price[] = priceSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Price, 'id'>),
        }));

        setPrices(foundPrices);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la récupération des données.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
      <h2>Comparer les prix</h2>

      <input
        type="text"
        placeholder="Entrer ou scanner un EAN"
        value={ean}
        onChange={(e) => setEan(e.target.value)}
        style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }}
        aria-label="EAN ou nom du produit"
      />

      <button
        onClick={searchProduct}
        style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
      >
        Rechercher
      </button>

      {loading && <p>Chargement…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {products.map((product) => (
        <div key={product.id} style={{ marginBottom: '1rem' }}>
          <strong>{product.name}</strong>
        </div>
      ))}

      {prices.map((price) => {
        const dateValue = (price as any).date;
        const parsedDate =
          dateValue instanceof Date
            ? dateValue
            : typeof dateValue === 'string'
              ? new Date(dateValue)
              : typeof dateValue?.toDate === 'function'
                ? dateValue.toDate()
                : undefined;
        const dateLabel = parsedDate ? parsedDate.toLocaleDateString() : '—';

        return (
          <div
            key={price.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            <div>💰 {price.amount} €</div>
            <div>🏬 {price.store}</div>
            <div>📅 {dateLabel}</div>
            <div>🔗 {price.source}</div>
          </div>
        );
      })}

      {!loading && prices.length === 0 && products.length > 0 && (
        <p>Aucun prix disponible pour ce produit.</p>
      )}

      {/* DOM/Métropole gap indicator */}
      {prices.length >= 1 && <DomMetroGapIndicator prices={prices} />}
    </div>
  );
}
