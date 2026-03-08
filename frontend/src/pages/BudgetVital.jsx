/**
 * BudgetVital Page
 */

import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function BudgetVitalPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.budgetVital}
          alt="Budget vital DOM"
          gradient="from-slate-950 to-blue-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🏠 Budget vital DOM</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Le minimum vital budgétaire dans votre territoire</p>
        </HeroImage>
        <p className="text-gray-600 dark:text-gray-400">Module en développement</p>
      </div>
    </div>
  );
}
