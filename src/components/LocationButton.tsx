/**
 * LocationButton - Example component demonstrating geolocation usage
 * 
 * Shows how to:
 * - Request user location with proper error handling
 * - Display status messages to the user
 * - Handle all error states gracefully
 * - Integrate with the enhanced geolocation utility
 */

import { useState } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { requestGeolocation, getCoordinates, type GeolocationCoordinates } from '../utils/geolocation';

interface LocationButtonProps {
  onLocationObtained?: (coordinates: GeolocationCoordinates) => void;
  className?: string;
  label?: string;
}

export default function LocationButton({ 
  onLocationObtained, 
  className = '',
  label = 'Activer ma position'
}: LocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info');
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);

  const handleLocationRequest = async () => {
    setLoading(true);
    setStatusMessage('');
    
    const result = await requestGeolocation((message, type) => {
      setStatusMessage(message);
      setStatusType(type);
    });

    setLoading(false);

    if (result.position) {
      const coords = getCoordinates(result);
      if (coords) {
        setCoordinates(coords);
        onLocationObtained?.(coords);
      }
    }
  };

  // Status icon based on message type
  const StatusIcon = statusType === 'error' 
    ? AlertCircle 
    : statusType === 'success' 
    ? CheckCircle 
    : MapPin;

  // Status color classes
  const statusColorClass = statusType === 'error'
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : statusType === 'success'
    ? 'text-green-400 bg-green-500/10 border-green-500/20'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/20';

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        onClick={handleLocationRequest}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={label}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <MapPin size={18} aria-hidden="true" />
        )}
        <span>{loading ? 'Localisation...' : label}</span>
      </button>

      {/* Status message display */}
      {statusMessage && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg border ${statusColorClass} animate-fade-in`}
          role={statusType === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <StatusIcon size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm">{statusMessage}</p>
        </div>
      )}

      {/* Coordinates display (for development/debugging) */}
      {coordinates && (
        <div className="text-xs text-gray-400 font-mono">
          <div>Lat: {coordinates.latitude.toFixed(6)}</div>
          <div>Lon: {coordinates.longitude.toFixed(6)}</div>
          {coordinates.accuracy && (
            <div>Précision: ±{Math.round(coordinates.accuracy)}m</div>
          )}
        </div>
      )}
    </div>
  );
}
