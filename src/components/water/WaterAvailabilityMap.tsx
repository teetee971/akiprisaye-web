/**
 * Water Availability Map Component
 * Carte interactive de disponibilité de l'eau en temps réel
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import type { WaterAvailability, WaterStatus } from '../../types/waterComparison';
import { getAllWaterStatus } from '../../services/waterAvailabilityService';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface WaterAvailabilityMapProps {
  territory?: string;
  onMarkerClick?: (availability: WaterAvailability) => void;
}

/**
 * Get marker color based on water status
 */
function getStatusColor(status: WaterStatus): string {
  const colors: Record<WaterStatus, string> = {
    available: '#22c55e', // Green
    low_pressure: '#eab308', // Yellow
    scheduled_cut: '#f97316', // Orange
    cut: '#ef4444', // Red
  };
  return colors[status] || '#gray-400';
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: WaterStatus): string {
  const emojis: Record<WaterStatus, string> = {
    available: '🟢',
    low_pressure: '🟡',
    scheduled_cut: '🟠',
    cut: '🔴',
  };
  return emojis[status] || '⚪';
}

/**
 * Get status label
 */
function getStatusLabel(status: WaterStatus): string {
  const labels: Record<WaterStatus, string> = {
    available: 'Eau disponible',
    low_pressure: 'Faible pression',
    scheduled_cut: 'Coupure programmée',
    cut: 'Coupure en cours',
  };
  return labels[status] || 'Statut inconnu';
}

export default function WaterAvailabilityMap({
  territory,
  onMarkerClick,
}: WaterAvailabilityMapProps) {
  const [waterStatus, setWaterStatus] = useState<WaterAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default center (Mayotte)
  const defaultCenter: [number, number] = [-12.8275, 45.1662];
  const defaultZoom = 10;

  useEffect(() => {
    loadWaterStatus();
  }, [territory]);

  async function loadWaterStatus() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllWaterStatus();
      setWaterStatus(data);
    } catch (err) {
      console.error('Error loading water status:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900 rounded-lg">
        <div className="text-center text-red-400">
          <p className="text-xl mb-2">❌ {error}</p>
          <button
            onClick={loadWaterStatus}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <h3 className="font-bold text-sm mb-2 text-slate-900">Légende</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-slate-700">Eau disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-slate-700">Faible pression</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-slate-700">Coupure programmée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-slate-700">Coupure en cours</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-96 md:h-[600px] rounded-lg overflow-hidden shadow-xl">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {waterStatus.map((status) => (
            <React.Fragment key={status.id}>
              {/* Circle overlay */}
              <Circle
                center={[status.location.coordinates[1], status.location.coordinates[0]]}
                radius={500}
                pathOptions={{
                  color: getStatusColor(status.status),
                  fillColor: getStatusColor(status.status),
                  fillOpacity: 0.2,
                }}
              />

              {/* Marker */}
              <Marker
                position={[status.location.coordinates[1], status.location.coordinates[0]]}
                eventHandlers={{
                  click: () => onMarkerClick?.(status),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-bold text-base mb-2">
                      {getStatusEmoji(status.status)} {status.location.commune}
                    </h3>
                    {status.location.quartier && (
                      <p className="text-slate-600 mb-2">{status.location.quartier}</p>
                    )}
                    <p className="mb-2">
                      <strong>Statut:</strong> {getStatusLabel(status.status)}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      Depuis: {new Date(status.since).toLocaleString('fr-FR')}
                    </p>
                    {status.duration && (
                      <p className="text-xs text-slate-500 mb-2">
                        Durée: {Math.round(status.duration / 60)} heures
                      </p>
                    )}
                    {status.scheduledEnd && (
                      <p className="text-xs text-slate-500 mb-2">
                        Fin prévue: {new Date(status.scheduledEnd).toLocaleString('fr-FR')}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {status.reportedBy === 'official' ? '✓ Officiel' : '👤 Citoyen'}
                      {status.verified && ' • Vérifié'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">
            {waterStatus.filter((s) => s.status === 'available').length}
          </div>
          <div className="text-sm text-green-300">Zones avec eau</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">
            {waterStatus.filter((s) => s.status === 'low_pressure').length}
          </div>
          <div className="text-sm text-yellow-300">Faible pression</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-400">
            {waterStatus.filter((s) => s.status === 'scheduled_cut').length}
          </div>
          <div className="text-sm text-orange-300">Coupures prévues</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-400">
            {waterStatus.filter((s) => s.status === 'cut').length}
          </div>
          <div className="text-sm text-red-300">Coupures actives</div>
        </div>
      </div>
    </div>
  );
}
