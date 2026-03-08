/**
 * Lutte contre la Vie Chère - Page Wrapper
 * Wraps the LutteVieChere component for routing
 */

import { Helmet } from 'react-helmet-async';
import { LutteVieChere } from './LutteVieChere';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

export default function LutteVieChereIndexPage() {
  return (
    <>
      <Helmet>
        <title>Lutte contre la Vie Chère - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Ensemble, agissons pour des prix justes dans les territoires d'Outre-mer" 
        />
      </Helmet>
      <HeroImage
        src={PAGE_HERO_IMAGES.lutteVieChere}
        alt="Lutte contre la vie chère"
        gradient="from-slate-950 to-orange-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>✊ Lutte contre la vie chère</h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Tous les outils pour comprendre et combattre la cherté des prix</p>
      </HeroImage>
      <LutteVieChere />
    </>
  );
}
