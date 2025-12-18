/**
 * Page wrapper for Module 5: Factual Price Trend Analysis
 */
import PriceTrendAnalysis from '../modules/PriceTrendAnalysis';

export default function PriceTrendAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PriceTrendAnalysis />
      </div>
    </div>
  );
}
