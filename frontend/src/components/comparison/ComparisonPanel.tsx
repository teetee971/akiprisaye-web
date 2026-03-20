import { Skeleton } from '../ui/Skeleton';
import { Metric } from '../ui/Metric';
import { ProductHeader } from './ProductHeader';
import { PriceList } from './PriceList';
import { formatEur, formatSavings } from '../../utils/currency';
import type { CompareProduct, PriceObservationRow, CompareSummary } from '../../types/compare';

interface ComparisonPanelProps {
  loading: boolean;
  product?: CompareProduct | null;
  prices?: PriceObservationRow[];
  summary?: CompareSummary | null;
}

export function ComparisonPanel({ loading, product, prices = [], summary }: ComparisonPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="flex flex-col gap-4">
      <ProductHeader name={product.name} barcode={product.barcode} image={product.image} />
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Min" value={formatEur(summary.min)} accent />
          <Metric label="Max" value={formatEur(summary.max)} />
          <Metric label="Économie" value={formatSavings(summary.savings)} accent />
        </div>
      )}
      <PriceList prices={prices} count={prices.length} />
    </div>
  );
}
