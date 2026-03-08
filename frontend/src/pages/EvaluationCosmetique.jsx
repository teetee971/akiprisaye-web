/**
 * Page d'évaluation cosmétique
 * Module basé sur les données officielles uniquement
 */

import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function EvaluationCosmetiquePage() {
  return (
    <div>
      <HeroImage
        src={PAGE_HERO_IMAGES.evaluationCosmetique}
        alt="Évaluation cosmétique"
        gradient="from-slate-950 to-pink-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>💄 Évaluation cosmétique</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Analysez les produits cosmétiques vendus dans les DOM</p>
      </HeroImage>
      <div className="text-center">
        <p className="text-white text-lg">Module d'évaluation cosmétique en développement</p>
      </div>
    </div>
  );
}
