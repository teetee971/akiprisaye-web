import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { getStoresByTerritory } from '../services/mapService';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 11);
  }, [position, map]);
  return null;
}

export default function Carte() {
  const [territory, setTerritory] = useState('Guadeloupe');
  const [stores, setStores] = useState([]);
  const [userPosition, setUserPosition] = useState(null);

  const territoryPositions = {
    'Guadeloupe': [16.262, -61.583],
    'Martinique': [14.613, -60.996],
    'Guyane': [4.853, -52.328],
  };

  useEffect(() => {
    setStores(getStoresByTerritory(territory));
  }, [territory]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('Géolocalisation refusée', err),
      );
    }
  }, []);

  const territories = ['Guadeloupe', 'Martinique', 'Guyane'];
  const defaultPosition = territoryPositions[territory] || [16.262, -61.583];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold mb-6 text-blue-400">
          🗺️ Carte Interactive des Magasins
        </h1>

        {/* Territory Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-slate-300">
            Sélectionner un territoire
          </label>
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {territories.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Map Container */}
        <div className="rounded-lg overflow-hidden border border-slate-800 h-[600px]">
          <MapContainer
            center={defaultPosition}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <MapUpdater position={territoryPositions[territory]} />
            
            {stores.map((store, index) => (
              <Marker key={index} position={[store.lat, store.lon]}>
                <Popup>
                  <div className="text-slate-900">
                    <h3 className="font-semibold">{store.name}</h3>
                    <p className="text-sm text-slate-600">{store.category}</p>
                    <p className="text-xs text-slate-500">{territory}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {userPosition && (
              <Marker
                position={userPosition}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>
                  <div className="text-slate-900">
                    <h3 className="font-semibold">Votre position</h3>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Store List */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">
            Magasins dans {territory} ({stores.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store, index) => (
              <div
                key={index}
                className="border border-slate-800 rounded-lg p-4 bg-slate-900/50 hover:border-blue-500 transition"
              >
                <h3 className="font-semibold text-slate-100 mb-1">{store.name}</h3>
                <p className="text-slate-400 text-sm mb-2">{store.category}</p>
                <p className="text-slate-500 text-xs">
                  📍 {store.lat.toFixed(4)}°, {store.lon.toFixed(4)}°
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}