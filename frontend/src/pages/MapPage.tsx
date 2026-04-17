/**
 * MapPage - Interactive Store Map Page
 * Route: /carte-interactive
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { StoreMap } from '../components/map';

/**
 * MapPage Component
 */
export default function MapPage() {
  const [searchParams] = useSearchParams();
  const territory = searchParams.get('territory') || 'GP';

  // Territory coordinates mapping
  const territoryCoordinates: Record<string, [number, number]> = {
    GP: [16.265, -61.551], // Guadeloupe
    MQ: [14.641, -61.024], // Martinique
    GF: [4.937, -52.326], // Guyane
    RE: [-21.115, 55.536], // La Réunion
    YT: [-12.827, 45.166], // Mayotte
    NC: [-22.276, 166.458], // Nouvelle-Calédonie
    PF: [-17.679, -149.406], // Polynésie française
    WF: [-13.768, -177.156], // Wallis-et-Futuna
    PM: [46.779, -56.198], // Saint-Pierre-et-Miquelon
    SM: [18.067, -63.082], // Saint-Martin
    BL: [17.902, -62.832], // Saint-Barthélemy
  };

  const center = territoryCoordinates[territory] || territoryCoordinates.GP;

  return (
    <>
      <Helmet>
        <title>Carte Interactive des Magasins - A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Carte interactive des magasins DOM-TOM avec comparaison de prix, recherche par proximité et visualisation thermique des prix."
        />
        <meta
          name="keywords"
          content="carte magasins, DOM-TOM, prix, proximité, heatmap, Guadeloupe, Martinique, Guyane, Réunion, Mayotte"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/carte-interactive" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/carte-interactive"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/carte-interactive"
        />
      </Helmet>

      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-blue-600 text-white py-4 px-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">Carte Interactive des Magasins</h1>
            <p className="text-blue-100 text-sm mt-1">
              Trouvez les meilleurs prix près de chez vous
            </p>
          </div>
        </header>

        {/* Map */}
        <div className="flex-1">
          <StoreMap
            initialTerritory={territory}
            initialCenter={center}
            initialZoom={11}
            enableClustering={true}
            enableHeatmap={true}
            showFilters={true}
            showNearbyList={true}
          />
        </div>
      </div>
    </>
  );
}
