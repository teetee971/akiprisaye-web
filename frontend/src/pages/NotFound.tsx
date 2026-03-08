import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { SEOHead } from '../components/ui/SEOHead';
import { Home, Search, ArrowLeft } from 'lucide-react';

const SUGGESTIONS = [
  { label: 'Accueil', href: '/', icon: Home },
  { label: 'Rechercher un prix', href: '/recherche', icon: Search },
  { label: 'Observatoire', href: '/observatoire', icon: Search },
  { label: 'Comparateur', href: '/comparateur', icon: Search },
];

export default function NotFound() {
  return (
    <div className="space-y-6 pb-24 px-4 pt-4 max-w-2xl mx-auto">
      <SEOHead title="Page introuvable" description="La page que vous cherchez n'existe pas." />
      <HeroImage
        src={PAGE_HERO_IMAGES.search}
        alt="Page introuvable"
        gradient="from-slate-950 to-slate-800"
        height="h-40 sm:h-52"
      >
        <div style={{ fontSize: '3rem', lineHeight: 1 }}>404</div>
        <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
          Page introuvable
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
      </HeroImage>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <p className="text-slate-300 mb-5 text-sm">Essayez l'une de ces pages :</p>
        <div className="grid grid-cols-2 gap-3">
          {SUGGESTIONS.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors"
            >
              <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Revenir en arrière
          </button>
        </div>
      </div>
    </div>
  );
}
