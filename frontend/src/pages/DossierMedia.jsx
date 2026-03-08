/**
 * DossierMedia Page
 */

import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function DossierMediaPage() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.dossierMedia}
          alt="Dossier Médias"
          gradient="from-slate-950 to-amber-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>📰 Dossier Médias</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Ressources presse et médias</p>
        </HeroImage>
        <p className="text-gray-600">Module en développement</p>
      </div>
    </div>
  );
}
