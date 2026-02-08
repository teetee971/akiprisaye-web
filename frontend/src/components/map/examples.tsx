/**
 * Example usage of StoreMap components
 * 
 * This file demonstrates how to integrate the map components
 * into your application.
 */

import { StoreMap } from '@/components/map';
import { StoreMarker } from '@/types/map';

// Example 1: Basic map with territory
export function BasicMapExample() {
  return (
    <div className="h-screen">
      <StoreMap
        territory="GP"
        showUserLocation={true}
      />
    </div>
  );
}

// Example 2: Map with specific chains filter
export function FilteredMapExample() {
  return (
    <div className="h-screen">
      <StoreMap
        territory="MQ"
        chains={['Carrefour', 'Hyper U']}
        radius={5}
      />
    </div>
  );
}

// Example 3: Map centered on specific coordinates
export function CustomCenterExample() {
  return (
    <div className="h-screen">
      <StoreMap
        center={[16.25, -61.55]} // Guadeloupe
        zoom={12}
        showUserLocation={true}
      />
    </div>
  );
}

// Example 4: Full-featured map with callbacks
export function FullFeaturedMapExample() {
  const handleStoreSelect = (store: StoreMarker) => {
    console.log('Store selected:', store);
  };

  const handleGetDirections = (store: StoreMarker) => {
    // Open directions in Google Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lon}`;
    window.open(url, '_blank');
  };

  const handleViewDetails = (store: StoreMarker) => {
    // Navigate to store details page
    window.location.href = `/store/${store.id}`;
  };

  return (
    <div className="h-screen">
      <StoreMap
        territory="RE"
        showUserLocation={true}
        radius={10}
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
        <StoreMap
          showUserLocation={true}
          radius={15}
        />
      </div>
    </div>
  );
}

// Example 6: Map in a modal/dialog
export function MapModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
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
              <StoreMap
                showUserLocation={true}
                radius={20}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Example 7: Map with mock data (for testing)
export function MockDataMapExample() {
  // Note: In production, stores would be fetched from API
  // The StoreMap component will need to be updated to accept stores prop
  // or integrate with a store service/API
  
  return (
    <div className="h-screen">
      <StoreMap
        territory="GP"
        center={[16.25, -61.55]}
        zoom={11}
        showUserLocation={false}
      />
    </div>
  );
}

import { useState } from 'react';
