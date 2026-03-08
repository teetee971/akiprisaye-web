import { Link, useParams } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const territoryLabels: Record<string, string> = {
  guadeloupe: 'Guadeloupe',
  martinique: 'Martinique',
  guyane: 'Guyane',
  reunion: 'La Réunion',
  mayotte: 'Mayotte',
};

export default function TerritoryHub() {
  const { territory } = useParams<{ territory: string }>();
  const territoryLabel = territory ? territoryLabels[territory] || territory : 'Territoire';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <HeroImage
          src={PAGE_HERO_IMAGES.territoryHub}
          alt="Hub territoires"
          gradient="from-slate-950 to-teal-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>🗺️ Hub territoires</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Explorez les données par territoire d'outre-mer</p>
        </HeroImage>
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/${territory}/scanner`}
            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Scanner
          </Link>
          <Link
            to={`/${territory}/comparateurs`}
            className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            Comparateurs
          </Link>
          <Link
            to="/carte-itineraires"
            className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Carte
          </Link>
        </div>
      </div>
    </div>
  );
}
