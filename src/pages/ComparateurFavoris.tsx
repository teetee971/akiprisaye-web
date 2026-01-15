import { Helmet } from 'react-helmet-async';
import { FavoritesList } from '../features/comparateur/components/FavoritesList';

export default function FavorisPage() {
  return (
    <>
      <Helmet>
        <title>Mes Favoris - A KI PRI SA YÉ</title>
        <meta name="description" content="Retrouvez tous vos produits favoris" />
      </Helmet>
      
      <div className="min-h-screen bg-slate-950 p-4 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              ⭐ Mes Produits Favoris
            </h1>
            <p className="text-gray-400 text-lg">
              Retrouvez et gérez vos produits préférés
            </p>
          </div>
          
          <FavoritesList />
        </div>
      </div>
    </>
  );
}
