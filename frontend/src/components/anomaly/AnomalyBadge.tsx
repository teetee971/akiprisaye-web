/**
 * AnomalyBadge Component - v1.0.0
 * 
 * Displays a warning badge for price anomalies with citizen-friendly explanation
 * No "AI" marketing - transparent statistical methods only
 * 
 * @module AnomalyBadge
 */

import React, { useState } from 'react';

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Anomaly type
 */
export type AnomalyType = 'TEMPORAL' | 'TERRITORIAL' | 'OUTLIER';

/**
 * Price anomaly interface
 */
export interface PriceAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  description: string;
  details: {
    currentPrice?: number;
    referencePrice?: number;
    percentageChange?: number;
  };
}

interface AnomalyBadgeProps {
  anomaly: PriceAnomaly;
  /** Show full tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Get badge styling based on severity
 */
function getSeverityStyles(severity: AnomalySeverity): {
  background: string;
  color: string;
  icon: string;
} {
  switch (severity) {
    case 'HIGH':
      return {
        background: '#dc2626',
        color: 'white',
        icon: '⚠️',
      };
    case 'MEDIUM':
      return {
        background: '#f59e0b',
        color: 'white',
        icon: '⚡',
      };
    case 'LOW':
      return {
        background: '#3b82f6',
        color: 'white',
        icon: 'ℹ️',
      };
  }
}

/**
 * Get anomaly type label
 */
function getTypeLabel(type: AnomalyType): string {
  switch (type) {
    case 'TEMPORAL':
      return 'Variation inhabituelle';
    case 'TERRITORIAL':
      return 'Écart territorial';
    case 'OUTLIER':
      return 'Valeur atypique';
  }
}

export function AnomalyBadge({ anomaly, showTooltip = true }: AnomalyBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const styles = getSeverityStyles(anomaly.severity);
  const typeLabel = getTypeLabel(anomaly.type);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '6px',
          background: styles.background,
          color: styles.color,
          fontSize: '12px',
          fontWeight: '500',
          cursor: showTooltip ? 'help' : 'default',
          whiteSpace: 'nowrap',
        }}
        role="status"
        aria-label={`Anomalie de prix: ${anomaly.description}`}
      >
        <span>{styles.icon}</span>
        <span>{typeLabel}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipVisible && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '250px',
            maxWidth: '320px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#e2e8f0',
          }}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              left: '50%',
              width: '12px',
              height: '12px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRight: 'none',
              borderBottom: 'none',
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '6px', color: '#f1f5f9' }}>
              {typeLabel}
            </div>

            <div style={{ marginBottom: '8px', color: '#cbd5e1' }}>
              {anomaly.description}
            </div>

            {/* Details */}
            {(anomaly.details.currentPrice || anomaly.details.referencePrice) && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  paddingTop: '8px',
                  borderTop: '1px solid #334155',
                }}
              >
                {anomaly.details.currentPrice && (
                  <div>Prix actuel: {anomaly.details.currentPrice.toFixed(2)}€</div>
                )}
                {anomaly.details.referencePrice && (
                  <div>Prix de référence: {anomaly.details.referencePrice.toFixed(2)}€</div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #334155',
              }}
            >
              ℹ️ Détection par règles statistiques simples
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Multiple anomalies display
 */
interface AnomalyListProps {
  anomalies: PriceAnomaly[];
  /** Maximum number to display before "show more" */
  maxVisible?: number;
}

export function AnomalyList({ anomalies, maxVisible = 2 }: AnomalyListProps) {
  const [showAll, setShowAll] = useState(false);

  if (anomalies.length === 0) {
    return null;
  }

  const visibleAnomalies = showAll ? anomalies : anomalies.slice(0, maxVisible);
  const hasMore = anomalies.length > maxVisible;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {visibleAnomalies.map((anomaly, index) => (
        <AnomalyBadge key={`${anomaly.type}-${anomaly.severity}-${anomaly.description.slice(0, 30)}`} anomaly={anomaly} />
      ))}

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e293b';
            e.currentTarget.style.color = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          +{anomalies.length - maxVisible} autre{anomalies.length - maxVisible > 1 ? 's' : ''}
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1e293b';
            e.currentTarget.style.color = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          Voir moins
        </button>
      )}
    </div>
  );
}
