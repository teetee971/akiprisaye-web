/**
 * Smart Shopping List Page
 * Manage shopping lists with budget optimization
 */

import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { ShoppingListManager } from '../components/ShoppingListManager';

export default function SmartShoppingListPage() {
  return (
    <>
      <Helmet>
        <title>Liste de Courses Intelligente - A KI PRI SA YÉ</title>
        <meta 
          name="description" 
          content="Créez et optimisez vos listes de courses pour économiser sur vos achats" 
        />
      </Helmet>
      <div className="space-y-4 pb-24 px-4 pt-4">
        <div className="animate-fade-in">
          <HeroImage
            src={PAGE_HERO_IMAGES.shoppingList}
            alt="Liste de courses — chariot supermarché"
            gradient="from-teal-950 to-slate-900"
            height="h-36 sm:h-48"
          >
            <h1 className="text-2xl font-bold text-white drop-shadow">
              🛒 Ma Liste Intelligente
            </h1>
            <p className="text-slate-200 text-sm drop-shadow">Optimisez vos achats et faites des économies</p>
          </HeroImage>
        </div>
        <ShoppingListManager />
      </div>
    </>
  );
}
