/**
 * InflationAlert Component - v1.3.0
 *
 * Displays inflation alerts and trends
 *
 * @module InflationAlert
 */

import React, { useEffect, useState } from 'react';
import type { InflationAnalysis } from '../../types/observatory';
import type { TerritoryCode } from '../../types/extensions';
import {
  detectInflation,
  formatInflationRate,
  getSeverityColor,
} from '../../services/observatoryService';

interface InflationAlertProps {
  territory: TerritoryCode;
  period?: '7d' | '30d' | '90d' | '1y';
}

export function InflationAlert({ territory, period = '30d' }: InflationAlertProps) {
  const [analysis, setAnalysis] = useState<InflationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInflationData();
  }, [territory, period]);

  async function loadInflationData() {
    try {
      setLoading(true);
      const data = await detectInflation(territory, period);
      setAnalysis(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load inflation data:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '16px',
          animation: 'pulse 2s infinite',
        }}
      >
        <div
          style={{
            height: '20px',
            background: '#334155',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        />
        <div style={{ height: '16px', background: '#334155', borderRadius: '4px', width: '70%' }} />
      </div>
    );
  }

  if (!analysis) return null;

  const severityColor = getSeverityColor(analysis.severity);
  const periodLabel = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': '3 derniers mois',
    '1y': 'Dernière année',
  }[period];

  return (
    <div
      style={{
        background: '#1e293b',
        border: `2px solid ${severityColor}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '24px' }}>📊</span>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#f1f5f9',
              margin: 0,
            }}
          >
            Alerte Inflation
          </h3>
        </div>

        <span
          style={{
            fontSize: '24px',
            fontWeight: '700',
            color: severityColor,
          }}
        >
          {formatInflationRate(analysis.inflationRate)}
        </span>
      </div>

      {/* Period */}
      <p
        style={{
          fontSize: '13px',
          color: '#94a3b8',
          marginBottom: '16px',
        }}
      >
        {periodLabel} • {territory}
      </p>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: '#0f172a',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#3b82f6',
              marginBottom: '4px',
            }}
          >
            {analysis.affectedProducts}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            Produits impactés
          </div>
        </div>

        <div
          style={{
            background: '#0f172a',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '4px',
            }}
          >
            {analysis.totalProducts}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#94a3b8',
            }}
          >
            Produits suivis
          </div>
        </div>
      </div>

      {/* Categories impacted */}
      <div>
        <h4
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#e2e8f0',
            marginBottom: '8px',
          }}
        >
          Catégories les plus touchées:
        </h4>

        {analysis.categoriesImpacted.map((cat, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#0f172a',
              borderRadius: '6px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#cbd5e1',
                textTransform: 'capitalize',
              }}
            >
              {cat.category}
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: cat.rate > 5 ? '#ef4444' : cat.rate > 3 ? '#f59e0b' : '#10b981',
              }}
            >
              {formatInflationRate(cat.rate)}
            </span>
          </div>
        ))}
      </div>

      {/* Transparency note */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: '#0f172a',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#94a3b8',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>Calcul transparent:</strong> Moyenne des variations de
        prix sur {analysis.totalProducts} produits suivis. Données: API officielles + contributions
        utilisateurs vérifiées.
      </div>
    </div>
  );
}
