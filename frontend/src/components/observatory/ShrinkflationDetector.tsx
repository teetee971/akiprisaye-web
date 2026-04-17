/**
 * ShrinkflationDetector Component - v1.3.0
 *
 * Displays detected shrinkflation cases
 *
 * @module ShrinkflationDetector
 */

import React, { useEffect, useState } from 'react';
import type { ShrinkflationDetection } from '../../types/observatory';
import type { TerritoryCode } from '../../types/extensions';
import { detectShrinkflation, formatInflationRate } from '../../services/observatoryService';

interface ShrinkflationDetectorProps {
  territory: TerritoryCode;
}

export function ShrinkflationDetector({ territory }: ShrinkflationDetectorProps) {
  const [cases, setCases] = useState<ShrinkflationDetection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShrinkflationData();
  }, [territory]);

  async function loadShrinkflationData() {
    try {
      setLoading(true);
      const data = await detectShrinkflation(territory);
      setCases(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load shrinkflation data:', error);
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
        }}
      >
        <div
          style={{
            height: '20px',
            background: '#334155',
            borderRadius: '4px',
            marginBottom: '12px',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
          Aucun cas de shrinkflation détecté récemment
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#1e293b',
        border: '2px solid #f59e0b',
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
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f1f5f9',
            margin: 0,
          }}
        >
          Shrinkflation Détectée
        </h3>
        <span
          style={{
            marginLeft: 'auto',
            padding: '4px 12px',
            background: '#f59e0b',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          {cases.length} cas
        </span>
      </div>

      {/* Cases list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {cases.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: '#0f172a',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            {/* Product name */}
            <div
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#f1f5f9',
                marginBottom: '8px',
              }}
            >
              {item.productName}
            </div>

            {/* Store and territory */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#e2e8f0',
                }}
              >
                🏪 {item.enseigne}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#334155',
                  color: '#e2e8f0',
                }}
              >
                📍 {item.territory}
              </span>
            </div>

            {/* Size reduction */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Avant</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#cbd5e1' }}>
                  {item.oldContenance}g
                </div>
              </div>

              <div
                style={{
                  fontSize: '20px',
                  color: '#f59e0b',
                }}
              >
                →
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Après</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>
                  {item.newContenance}g
                </div>
              </div>
            </div>

            {/* Impact */}
            <div
              style={{
                background: '#1e293b',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Réduction de contenance:</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>
                -{item.reductionPercentage.toFixed(1)}%
              </span>
            </div>

            <div
              style={{
                background: '#1e293b',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Augmentation réelle du prix:
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>
                {formatInflationRate(item.realPriceIncrease)}
              </span>
            </div>
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
        <strong style={{ color: '#e2e8f0' }}>Détection transparente:</strong> Comparaison
        automatique des contenances historiques. Le prix réel par unité révèle l'augmentation
        masquée.
      </div>
    </div>
  );
}
