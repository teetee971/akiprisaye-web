/**
 * ProductCard Component - v1.2.0
 *
 * Mobile-first product card with photo, price, and detailed info
 * Includes validation buttons and transparency badges
 *
 * @module ProductCard
 */

import React from 'react';
import type { Product } from '../../types/product';
import {
  formatPrice,
  formatDate,
  getReliabilityLabel,
  getReliabilityColor,
} from '../../services/productService';
import { AnomalyList, type PriceAnomaly } from '../anomaly/AnomalyBadge';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onValidate?: (productId: string, isValid: boolean) => void;
  /** Price anomalies detected for this product */
  anomalies?: PriceAnomaly[];
}

export function ProductCard({ product, onClick, onValidate, anomalies }: ProductCardProps) {
  const mainPhoto = product.photos.find((p) => p.isMain) || product.photos[0];
  const priceChangeIcon = product.price_change
    ? product.price_change.trend === 'up'
      ? '📈'
      : product.price_change.trend === 'down'
        ? '📉'
        : '➡️'
    : null;

  const handleValidation = (e: React.MouseEvent, isValid: boolean) => {
    e.stopPropagation();
    onValidate?.(product.id, isValid);
  };

  const cardContent = (
    <>
      {/* Photo */}
      {mainPhoto ? (
        <div
          style={{
            width: '100%',
            height: '180px',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '12px',
            background: '#0f172a',
          }}
        >
          <img
            src={mainPhoto.url}
            alt={product.nom}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '180px',
            borderRadius: '8px',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            fontSize: '48px',
          }}
        >
          📦
        </div>
      )}

      {/* Product Info */}
      <div>
        {/* Name and Brand */}
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#f1f5f9',
            marginBottom: '4px',
            lineHeight: '1.4',
          }}
        >
          {product.nom}
        </h3>

        {product.marque && (
          <p
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              marginBottom: '8px',
            }}
          >
            {product.marque}
          </p>
        )}

        {/* Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#3b82f6',
            }}
          >
            {formatPrice(product.prix_unitaire)}
          </span>

          {priceChangeIcon && (
            <span
              style={{ fontSize: '16px' }}
              title={
                product.price_change
                  ? `${product.price_change.trend === 'up' ? '+' : ''}${product.price_change.percentage.toFixed(1)}%`
                  : ''
              }
            >
              {priceChangeIcon}
            </span>
          )}
        </div>

        {/* Price per unit */}
        <p
          style={{
            fontSize: '13px',
            color: '#cbd5e1',
            marginBottom: '12px',
          }}
        >
          {formatPrice(product.prix_au_kilo_ou_litre)} /{' '}
          {product.unite === 'g' || product.unite === 'kg' ? 'kg' : 'L'}
        </p>

        {/* Store and Territory */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#334155',
              color: '#e2e8f0',
            }}
          >
            🏪 {product.enseigne}
          </span>

          <span
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: '#334155',
              color: '#e2e8f0',
            }}
          >
            📍 {product.territoire}
          </span>
        </div>

        {/* Anomaly badges */}
        {anomalies && anomalies.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <AnomalyList anomalies={anomalies} maxVisible={2} />
          </div>
        )}

        {/* Source badge */}
        <div
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '6px',
            background:
              product.source_prix === 'api'
                ? '#10b981'
                : product.source_prix === 'user'
                  ? '#3b82f6'
                  : product.source_prix === 'estimated'
                    ? '#f59e0b'
                    : '#6b7280',
            color: 'white',
            display: 'inline-block',
            marginBottom: '12px',
          }}
        >
          Source:{' '}
          {product.source_prix === 'api'
            ? 'API officielle'
            : product.source_prix === 'user'
              ? 'Utilisateur vérifié'
              : product.source_prix === 'estimated'
                ? 'Estimation'
                : 'Historique'}
        </div>

        {/* Reliability and validation */}
        <div
          style={{
            paddingTop: '12px',
            borderTop: '1px solid #334155',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getReliabilityColor(product.fiabilite_score),
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                {getReliabilityLabel(product.fiabilite_score)}
              </span>
            </div>

            <span
              style={{
                fontSize: '11px',
                color: '#64748b',
              }}
            >
              {formatDate(product.date_releve)}
            </span>
          </div>

          {/* Validation buttons */}
          {onValidate && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={(e) => handleValidation(e, true)}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                👍 Prix correct
              </button>
              <button
                type="button"
                onClick={(e) => handleValidation(e, false)}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                👎 Prix incorrect
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const cardStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px',
  };

  if (onClick) {
    return (
      <button
        type="button"
        className="product-card w-full text-left"
        onClick={onClick}
        style={{
          ...cardStyle,
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="product-card" style={{ ...cardStyle, cursor: 'default' }}>
      {cardContent}
    </div>
  );
}

/**
 * Skeleton loader for ProductCard
 */
export function ProductCardSkeleton() {
  return (
    <div
      style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '12px',
        animation: 'pulse 2s infinite',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '180px',
          borderRadius: '8px',
          background: '#334155',
          marginBottom: '12px',
        }}
      />

      <div
        style={{
          height: '20px',
          background: '#334155',
          borderRadius: '4px',
          marginBottom: '8px',
          width: '80%',
        }}
      />

      <div
        style={{
          height: '16px',
          background: '#334155',
          borderRadius: '4px',
          marginBottom: '12px',
          width: '50%',
        }}
      />

      <div
        style={{
          height: '32px',
          background: '#334155',
          borderRadius: '4px',
          width: '40%',
        }}
      />
    </div>
  );
}
