/**
 * BudgetReelMensuel Page
 */

import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function BudgetReelMensuelPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.budgetReel}
          alt="Budget réel mensuel"
          gradient="from-slate-950 to-emerald-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>💰 Budget réel mensuel</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Suivez vos dépenses alimentaires réelles mois par mois</p>
        </HeroImage>
        <p className="text-gray-600 dark:text-gray-400">Module en développement</p>
      </div>
    </div>
  );
}
