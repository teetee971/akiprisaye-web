/**
 * Example usage of StoreMap components
 *
 * This file demonstrates how to integrate the map components
 * into your application.
 */

import { useState } from 'react';
import { StoreMap } from '@/components/map';

// Example 1: Basic map with territory
export function BasicMapExample() {
  return (
    <div className="h-screen">
      <StoreMap initialTerritory="GP" showFilters={false} />
    </div>
  );
}

// Example 2: Map with specific territory filter
export function FilteredMapExample() {
  return (
    <div className="h-screen">
      <StoreMap initialTerritory="MQ" enableClustering={true} />
    </div>
  );
}

// Example 3: Map centered on specific coordinates
export function CustomCenterExample() {
  return (
    <div className="h-screen">
      <StoreMap
        initialCenter={[16.25, -61.55]} // Guadeloupe
        initialZoom={12}
      />
    </div>
  );
}

// Example 4: Full-featured map with heatmap and nearby list
export function FullFeaturedMapExample() {
  return (
    <div className="h-screen">
      <StoreMap
        initialTerritory="RE"
        enableHeatmap={true}
        showFilters={true}
        showNearbyList={true}
      />
    </div>
  );
}

// Example 5: Responsive map in a container
export function ResponsiveMapExample() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Magasins près de chez vous</h1>
      <div className="rounded-lg overflow-hidden shadow-lg" style={{ height: '600px' }}>
        <StoreMap showFilters={true} />
      </div>
    </div>
  );
}

// Example 6: Map in a modal/dialog
export function MapModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
        Voir la carte
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Carte des magasins</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <StoreMap showFilters={false} showNearbyList={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Example 7: Map with clustering disabled (for sparse data)
export function MockDataMapExample() {
  return (
    <div className="h-screen">
      <StoreMap
        initialTerritory="GP"
        initialCenter={[16.25, -61.55]}
        initialZoom={11}
        enableClustering={false}
        showNearbyList={false}
      />
    </div>
  );
}
