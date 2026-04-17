import React from 'react';

interface PriceDropAlertBannerProps {
  productName: string;
  priceDrop: number;
  currentPrice?: number;
  onDismiss?: () => void;
}

export function PriceDropAlertBanner({
  productName,
  priceDrop,
  currentPrice,
  onDismiss,
}: PriceDropAlertBannerProps) {
  const pct = Math.round(priceDrop * 100);

  return (
    <div
      role="alert"
      className="rounded-xl bg-red-950 border border-red-700 px-4 py-3 flex items-start gap-3"
    >
      <span className="text-xl shrink-0">📉</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">Baisse de prix détectée !</p>
        <p className="text-xs text-red-300 mt-0.5 truncate">
          {productName} — <strong>-{pct}%</strong>
          {currentPrice != null && ` → ${currentPrice.toFixed(2)} €`}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Fermer l'alerte"
          className="text-red-400 hover:text-white text-lg leading-none shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default PriceDropAlertBanner;
