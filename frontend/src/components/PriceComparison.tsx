 
import { useState, type FormEvent } from 'react';
import type {
  NormalizedPriceObservation,
  PriceInterval,
  PriceSearchStatus,
  TerritoryCode,
} from '../services/priceSearch/price.types';
import { comparePrices } from '../services/priceComparator';
import { computePriceReliability } from '../services/priceSearch/priceReliability';
import { PriceInsightsPanel } from './price/PriceInsightsPanel';

const TERRITORY_OPTIONS: Array<{ code: TerritoryCode; label: string }> = [
  { code: 'fr', label: 'France métropolitaine' },
  { code: 'gp', label: 'Guadeloupe' },
  { code: 'mq', label: 'Martinique' },
  { code: 'gf', label: 'Guyane' },
  { code: 're', label: 'La Réunion' },
  { code: 'yt', label: 'Mayotte' },
];

type ComparisonResult = {
  status: PriceSearchStatus | null;
  interval: PriceInterval | null;
  items: NormalizedPriceObservation[];
};

const initialResult: ComparisonResult = {
  status: null,
  interval: null,
  items: [],
};

export function PriceComparison() {
  const [product, setProduct] = useState('');
  const [territory, setTerritory] = useState<TerritoryCode>('fr');
  const [result, setResult] = useState<ComparisonResult>(initialResult);
  const [isLoading, setIsLoading] = useState(false);
  const reliability = computePriceReliability(result.items, result.interval);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = product.trim();
    if (!trimmed) {
      setResult(initialResult);
      return;
    }

    setIsLoading(true);
    try {
      const response = await comparePrices({
        query: trimmed,
        territory,
      });
      setResult({
        status: response.status,
        interval: response.interval,
        items: response.items,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section aria-labelledby="price-comparison-title">
      <h2 id="price-comparison-title">Comparateur de prix</h2>
      <form onSubmit={handleSubmit} aria-describedby="price-comparison-helper">
        <p id="price-comparison-helper">
          Comparez un produit sur un territoire pour visualiser la fourchette de prix.
        </p>
        <div>
          <label htmlFor="price-product">Produit</label>
          <input
            id="price-product"
            name="product"
            type="text"
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            placeholder="Ex : Riz long grain"
            required
          />
        </div>
        <div>
          <label htmlFor="price-territory">Territoire</label>
          <select
            id="price-territory"
            name="territory"
            value={territory}
            onChange={(event) => setTerritory(event.target.value as TerritoryCode)}
          >
            {TERRITORY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Comparaison en cours…' : 'Comparer'}
        </button>
      </form>

      {result.status === 'NO_DATA' && (
        <p role="status">Aucune donnée disponible pour ce produit et ce territoire.</p>
      )}

      {result.status === 'OK' && result.interval && (
        <div>
          <p>
            Fourchette observée : {result.interval.min?.toFixed(2)}€ —
            {result.interval.max?.toFixed(2)}€ (médiane{' '}
            {result.interval.median?.toFixed(2)}€)
          </p>

          <PriceInsightsPanel reliability={reliability} />

          <table>
            <caption>Observations disponibles</caption>
            <thead>
              <tr>
                <th scope="col">Produit</th>
                <th scope="col">Territoire</th>
                <th scope="col">Prix</th>
                <th scope="col">Prix normalisé</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item, index) => (
                <tr key={`${item.barcode ?? item.productName}-${index}`}>
                  <td>{item.productName ?? 'Produit'}</td>
                  <td>{item.territory ?? '—'}</td>
                  <td>{item.price.toFixed(2)}€</td>
                  <td>{item.normalizedLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
