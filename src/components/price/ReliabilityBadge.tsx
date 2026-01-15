/**
 * Reliability Badge Component
 * 
 * Displays price reliability information including:
 * - Reliability score and level
 * - Source type
 * - Confirmation count
 * - Last verification date
 */

import type { PriceReliability, PriceSource } from '../../types/enhancedPrice';

interface ReliabilityBadgeProps {
  reliability: PriceReliability;
  source: PriceSource;
  showDetails?: boolean;
  compact?: boolean;
}

const getReliabilityColor = (level: string): string => {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getReliabilityIcon = (level: string): string => {
  switch (level) {
    case 'high':
      return '✓';
    case 'medium':
      return '○';
    case 'low':
      return '!';
    default:
      return '?';
  }
};

const getSourceLabel = (type: string): string => {
  switch (type) {
    case 'official_api':
      return 'API officielle';
    case 'field_observation':
      return 'Observation terrain';
    case 'user_receipt':
      return 'Ticket utilisateur';
    case 'user_report':
      return 'Signalement';
    case 'historical':
      return 'Données historiques';
    default:
      return 'Source inconnue';
  }
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

export default function ReliabilityBadge({
  reliability,
  source,
  showDetails = true,
  compact = false,
}: ReliabilityBadgeProps) {
  const colorClass = getReliabilityColor(reliability.level);
  const icon = getReliabilityIcon(reliability.level);
  const sourceLabel = getSourceLabel(source.type);
  const dateLabel = formatDate(reliability.lastVerified);
  
  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colorClass}`}
        title={`Fiabilité ${reliability.level} - ${reliability.score}/100 - ${reliability.confirmations} confirmations`}
      >
        <span className="font-bold">{icon}</span>
        <span>{reliability.score}%</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {/* Main reliability indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClass}`}>
        <span className="text-lg font-bold">{icon}</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Fiabilité {reliability.level === 'high' ? 'élevée' : reliability.level === 'medium' ? 'moyenne' : 'faible'}
            </span>
            <span className="text-sm opacity-75">
              {reliability.score}/100
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <span>{reliability.confirmations} confirmation{reliability.confirmations > 1 ? 's' : ''}</span>
            {reliability.verifiedBy.length > 0 && (
              <>
                <span>•</span>
                <span>{reliability.verifiedBy.length} source{reliability.verifiedBy.length > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Detailed information */}
      {showDetails && (
        <div className="text-sm space-y-1 text-gray-700">
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[100px]">Source :</span>
            <span>{sourceLabel}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[100px]">Vérifié par :</span>
            <div className="flex flex-wrap gap-1">
              {reliability.verifiedBy.map((verifier) => (
                <span
                  key={verifier}
                  className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                >
                  {verifier === 'official_api' && 'API officielle'}
                  {verifier === 'field_agent' && 'Agent terrain'}
                  {verifier === 'user' && 'Utilisateur'}
                  {verifier === 'community' && 'Communauté'}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium min-w-[100px]">Dernière vérif. :</span>
            <span>{dateLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
