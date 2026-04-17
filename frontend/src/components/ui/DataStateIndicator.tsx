/**
 * DataStateIndicator - Reusable component for loading, empty, and partial data states
 * Provides clear user feedback to avoid "broken site" impression
 */
import React from 'react';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { GlassCard } from './glass-card';

interface DataStateIndicatorProps {
  state: 'loading' | 'empty' | 'partial' | 'error';
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function DataStateIndicator({
  state,
  title,
  message,
  icon,
  action,
}: DataStateIndicatorProps) {
  // Default titles and messages based on state
  const defaults = {
    loading: {
      title: 'Chargement en cours...',
      message: 'Recherche des données',
      icon: <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />,
      bgClass: 'bg-blue-900/10 border-blue-500/30',
    },
    empty: {
      title: 'Aucune donnée disponible',
      message: "Ce produit n'est pas encore référencé pour ce territoire.",
      icon: <Info className="w-12 h-12 text-gray-400" />,
      bgClass: 'bg-gray-900/10 border-gray-500/30',
    },
    partial: {
      title: 'Données en cours de consolidation',
      message: 'Les informations affichées sont partielles et seront complétées progressivement.',
      icon: <AlertCircle className="w-12 h-12 text-yellow-400" />,
      bgClass: 'bg-yellow-900/10 border-yellow-500/30',
    },
    error: {
      title: 'Erreur de chargement',
      message: 'Impossible de charger les données. Veuillez réessayer ultérieurement.',
      icon: <AlertCircle className="w-12 h-12 text-red-400" />,
      bgClass: 'bg-red-900/10 border-red-500/30',
    },
  };

  const config = defaults[state];

  return (
    <GlassCard className={`text-center py-12 ${config.bgClass}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Icon */}
        <div className="mb-2">{icon || config.icon}</div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white">{title || config.title}</h3>

        {/* Message */}
        <p className="text-gray-300 text-sm max-w-md mx-auto">{message || config.message}</p>

        {/* Optional Action Button */}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </GlassCard>
  );
}

// Convenience components for common use cases
export function LoadingState({ message }: { message?: string }) {
  return <DataStateIndicator state="loading" message={message} />;
}

export function EmptyState({ title, message }: { title?: string; message?: string }) {
  return <DataStateIndicator state="empty" title={title} message={message} />;
}

export function PartialDataState({ message }: { message?: string }) {
  return <DataStateIndicator state="partial" message={message} />;
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <DataStateIndicator
      state="error"
      message={message}
      action={onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined}
    />
  );
}
