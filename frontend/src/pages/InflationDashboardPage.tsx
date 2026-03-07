/**
 * Inflation Dashboard Page
 * Displays territory-level inflation metrics and comparisons
 */

import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { InflationDashboard } from '../components/InflationDashboard';

export default function InflationDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Tableau de Bord Inflation - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Suivi transparent de l'évolution des prix et de l'inflation dans les territoires d'Outre-mer" 
        />
      </Helmet>
      <div className="space-y-4 pb-8 px-4 pt-4">
        <div className="animate-fade-in">
          <HeroImage
            src={PAGE_HERO_IMAGES.inflation}
            alt="Tableau de bord inflation — évolution des prix"
            gradient="from-slate-900 to-red-950"
            height="h-36 sm:h-48"
          >
            <h1 className="text-2xl font-bold text-white drop-shadow">📈 Tableau de Bord Inflation</h1>
            <p className="text-slate-200 text-sm drop-shadow">Évolution transparente des prix — territoires d&apos;Outre-mer</p>
          </HeroImage>
        </div>
        <InflationDashboard />
      </div>
    </>
  );
}
