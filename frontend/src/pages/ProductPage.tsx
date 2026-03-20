import { lazy, Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCompare } from '../hooks/useCompare';
import { ComparisonPanel } from '../components/comparison/ComparisonPanel';
import { Skeleton } from '../components/ui/Skeleton';

const PriceHistory = lazy(() =>
  import('../components/insights/PriceHistory').then((m) => ({ default: m.PriceHistory })),
);
const SmartSignal = lazy(() =>
  import('../components/insights/SmartSignal').then((m) => ({ default: m.SmartSignal })),
);

export default function ProductPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territory') ?? 'GP';
  const { data, loading } = useCompare(id, territory, '');
  const [history, setHistory] = useState<{ date: string; price: number }[]>([]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <ComparisonPanel
          loading={loading}
          product={data?.product}
          prices={data?.observations}
          summary={data?.summary}
        />
        {data?.product && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <PriceHistory
                productId={data.product.id}
                territory={territory}
                onLoaded={setHistory}
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <SmartSignal history={history} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
