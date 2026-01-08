import React, { useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { requestGeolocation, type GeoPosition, type GeolocationResult } from '../utils/geoLocation';

export interface LocationButtonProps {
  /** Callback when location is successfully obtained */
  onLocationObtained?: (position: GeoPosition) => void;
  /** Callback when there's an error */
  onError?: (error: GeolocationResult['error']) => void;
  /** Custom button text (default: "Ma position") */
  buttonText?: string;
  /** Custom button className */
  className?: string;
  /** Show detailed error messages in UI */
  showDetailedErrors?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * LocationButton Component
 * 
 * A button component that requests user's geolocation with comprehensive
 * error handling and user feedback.
 * 
 * Features:
 * - Requests geolocation on click
 * - Shows loading state during request
 * - Displays permission prompts and error messages
 * - Handles Permissions-Policy errors gracefully
 * - Provides remediation guidance for common issues
 */
export default function LocationButton({
  onLocationObtained,
  onError,
  buttonText = 'Ma position',
  className = '',
  showDetailedErrors = true,
  variant = 'primary',
  size = 'md',
}: LocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleShowMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    // Auto-clear success and info messages after 5 seconds
    if (type !== 'error') {
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleClick = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await requestGeolocation(showDetailedErrors ? handleShowMessage : undefined);

      if (result.success && result.position) {
        if (onLocationObtained) {
          onLocationObtained(result.position);
        }
      } else if (result.error) {
        if (onError) {
          onError(result.error);
        }
        // Error message already shown by requestGeolocation callback
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button styles based on variant and size
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const baseClasses = `
    inline-flex items-center gap-2 rounded-lg font-medium
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return (
    <div className="location-button-container">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={baseClasses}
        aria-label={isLoading ? 'Obtention de la position en cours...' : buttonText}
      >
        {isLoading ? (
          <Loader2 size={iconSize[size]} className="animate-spin" />
        ) : (
          <MapPin size={iconSize[size]} />
        )}
        <span>{isLoading ? 'Localisation...' : buttonText}</span>
      </button>

      {/* Message display */}
      {message && showDetailedErrors && (
        <div
          className={`
            mt-3 p-3 rounded-lg text-sm
            ${message.type === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800' : ''}
            ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800' : ''}
            ${message.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800' : ''}
          `}
          role="alert"
        >
          <div className="flex items-start gap-2">
            {message.type === 'error' && <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
