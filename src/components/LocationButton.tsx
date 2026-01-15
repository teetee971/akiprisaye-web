/**
 * LocationButton Component
 * 
 * Example React component demonstrating how to use the enhanced geolocation utility.
 * Shows user-friendly error messages and handles all error states gracefully.
 */

import React, { useState } from 'react';
import { Navigation, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { requestGeolocation, isGeolocationAvailable, type GeolocationResult } from '../utils/geolocation';

interface LocationButtonProps {
  onLocationReceived?: (lat: number, lon: number) => void;
  className?: string;
  disabled?: boolean;
}

export default function LocationButton({ 
  onLocationReceived, 
  className = '',
  disabled = false 
}: LocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'info' | 'success' | 'error';
    message: string;
    suggestions?: string[];
  }>({
    type: 'idle',
    message: ''
  });
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);

  // Message display callback
  const showMessage = (message: string, type: 'info' | 'error' | 'success') => {
    // Split message into main text and suggestions
    const parts = message.split('\n\nSuggestions:\n');
    const mainMessage = parts[0];
    const suggestions = parts[1] ? parts[1].split('\n').map(s => s.replace('• ', '')) : [];
    
    setStatus({
      type,
      message: mainMessage,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    });
  };

  // Handle location request
  const handleActivateLocation = async () => {
    setLoading(true);
    setStatus({ type: 'idle', message: '' });

    // Check if geolocation is available first
    const availability = await isGeolocationAvailable();
    if (!availability.available) {
      setStatus({
        type: 'error',
        message: availability.reason || 'La géolocalisation n\'est pas disponible',
      });
      setLoading(false);
      return;
    }

    // Request geolocation
    const result: GeolocationResult = await requestGeolocation(showMessage);
    
    setLoading(false);

    if (result.success && result.position) {
      setPosition({
        lat: result.position.latitude,
        lon: result.position.longitude
      });
      
      // Call parent callback if provided
      if (onLocationReceived) {
        onLocationReceived(result.position.latitude, result.position.longitude);
      }
    }
  };

  // Get button styling based on state
  const getButtonStyle = () => {
    if (position) {
      return 'bg-green-600 hover:bg-green-700';
    }
    if (status.type === 'error') {
      return 'bg-red-600 hover:bg-red-700';
    }
    return 'bg-blue-600 hover:bg-blue-700';
  };

  // Get icon based on state
  const getIcon = () => {
    if (loading) {
      return <Navigation className="w-4 h-4 animate-spin" />;
    }
    if (position) {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (status.type === 'error') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Navigation className="w-4 h-4" />;
  };

  // Get button text based on state
  const getButtonText = () => {
    if (loading) return 'Activation...';
    if (position) return 'Position activée';
    return 'Activer ma position';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Location Button */}
      <button
        onClick={handleActivateLocation}
        disabled={disabled || loading || !!position}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${getButtonStyle()}
        `}
        aria-label={getButtonText()}
      >
        {getIcon()}
        {getButtonText()}
      </button>

      {/* Status Message */}
      {status.message && status.type !== 'idle' && (
        <div
          className={`
            p-3 rounded-lg border text-sm
            ${status.type === 'success' ? 'bg-green-900/20 border-green-500/30 text-green-100' : ''}
            ${status.type === 'error' ? 'bg-red-900/20 border-red-500/30 text-red-100' : ''}
            ${status.type === 'info' ? 'bg-blue-900/20 border-blue-500/30 text-blue-100' : ''}
          `}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            {status.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {status.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            {status.type === 'info' && <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="font-medium">{status.message.split('\n\n')[0]}</p>
              
              {/* Suggestions */}
              {status.suggestions && status.suggestions.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs opacity-90">
                  {status.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Position Display (for debugging) */}
      {position && (
        <div className="text-xs text-slate-400 font-mono">
          Position: {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
        </div>
      )}
    </div>
  );
}
