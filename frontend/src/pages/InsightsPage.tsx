import { SmartSignal } from '../components/insights/SmartSignal';
import { PriceHistory } from '../components/insights/PriceHistory';
import { useHistory } from '../hooks/useHistory';

const DEFAULT_PRODUCT = 'water-6x15';
const DEFAULT_TERRITORY = 'GP';

export default function InsightsPage() {
  const { data: history } = useHistory(DEFAULT_PRODUCT, DEFAULT_TERRITORY, '7d');

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-white">Insights prix</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SmartSignal history={history} />
          <PriceHistory productId={DEFAULT_PRODUCT} territory={DEFAULT_TERRITORY} />
        </div>
      </div>
    </div>
  );
}
