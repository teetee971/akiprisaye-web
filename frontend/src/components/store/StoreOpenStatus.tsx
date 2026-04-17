/**
 * StoreOpenStatus Component
 *
 * Displays a colored badge indicating if a store is currently open, closing soon, or closed
 */

import { useStoreOpenStatus } from '../../hooks/useStoreOpenStatus';
import { getStatusColor, getStatusIcon, StoreHours } from '../../utils/storeHoursUtils';

interface StoreOpenStatusProps {
  hours: StoreHours | null | undefined;
  showIcon?: boolean;
  compact?: boolean;
  className?: string;
}

export function StoreOpenStatus({
  hours,
  showIcon = true,
  compact = false,
  className = '',
}: StoreOpenStatusProps) {
  const statusInfo = useStoreOpenStatus(hours);

  if (!hours || statusInfo.status === 'unknown') {
    return null;
  }

  const colorClass = getStatusColor(statusInfo.status);
  const icon = getStatusIcon(statusInfo.status);

  // Color mapping for Tailwind classes
  const bgColorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const dotColorClasses = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  };

  const statusLabels = {
    open: 'OUVERT',
    closing_soon: 'FERME BIENTÔT',
    closed: 'FERMÉ',
    unknown: 'HORAIRES INCONNUS',
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 ${className}`}
        role="status"
        aria-label={`Statut: ${statusInfo.message}`}
      >
        {showIcon && (
          <span
            className={`w-2 h-2 rounded-full ${dotColorClasses[colorClass as keyof typeof dotColorClasses]}`}
            aria-hidden="true"
          />
        )}
        <span className="text-xs font-medium">{statusInfo.message}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgColorClasses[colorClass as keyof typeof bgColorClasses]} ${className}`}
      role="status"
      aria-label={`Statut: ${statusInfo.message}`}
    >
      {showIcon && (
        <span
          className={`w-2.5 h-2.5 rounded-full ${dotColorClasses[colorClass as keyof typeof dotColorClasses]} animate-pulse`}
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-bold leading-tight">{statusLabels[statusInfo.status]}</span>
        {statusInfo.nextChangeMessage && (
          <span className="text-xs leading-tight opacity-80">{statusInfo.nextChangeMessage}</span>
        )}
      </div>
    </div>
  );
}
