/**
 * SumUpPaymentForm
 * Embedded SumUp payment widget for subscription checkout.
 *
 * Flow:
 * 1. Backend creates a SumUp checkout → returns checkout_id
 * 2. This component loads SumUp's hosted payment widget via CDN SDK
 * 3. On success → calls onSuccess()
 * 4. On failure → calls onError(message)
 */
import React, { useEffect, useRef, useState } from 'react';

interface SumUpPaymentFormProps {
  checkoutId: string;
  amount: number;
  currency?: string;
  planName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    SumUpCard?: {
      mount: (config: Record<string, unknown>) => { unmount: () => void };
    };
  }
}

const SUMUP_WIDGET_SCRIPT = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';

export default function SumUpPaymentForm({
  checkoutId,
  amount,
  currency = 'EUR',
  planName,
  onSuccess,
  onError,
}: SumUpPaymentFormProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;

    // Hold the unmount function returned by SumUpCard.mount
    let widgetInstance: { unmount: () => void } | null = null;

    function mountWidget() {
      if (!window.SumUpCard) {
        setError('Widget SumUp non disponible.');
        setLoading(false);
        return;
      }
      setLoading(false);

      widgetInstance = window.SumUpCard.mount({
        id: checkoutId,
        mountPoint: mountRef.current,
        showSubmitButton: true,
        showInstallments: false,
        onResponse: (type: string, body: { status?: string; error?: string }) => {
          if (type === 'success' || body?.status === 'PAID') {
            onSuccess?.();
          } else if (type === 'error' || type === 'failure') {
            const msg = body?.error || 'Le paiement a échoué.';
            onError?.(msg);
          }
        },
      });
    }

    // Load SumUp card widget script if not already present
    const existing = document.getElementById('sumup-sdk');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'sumup-sdk';
      script.src = SUMUP_WIDGET_SCRIPT;
      script.async = true;
      script.onload = () => mountWidget();
      script.onerror = () => {
        setError('Impossible de charger le formulaire de paiement SumUp.');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      mountWidget();
    }

    // Cleanup: unmount the widget when the component unmounts or checkoutId changes
    return () => {
      widgetInstance?.unmount?.();
      widgetInstance = null;
    };
  }, [checkoutId, onSuccess, onError]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm">
        <p className="font-semibold mb-1">Erreur de chargement du paiement</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-sm">Plan :</span>
          <span className="text-white font-semibold">{planName}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-gray-300 text-sm">Montant :</span>
          <span className="text-blue-400 font-bold text-lg">
            {amount.toFixed(2)} {currency}
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
          <span className="ml-3 text-gray-300 text-sm">Chargement du formulaire de paiement…</span>
        </div>
      )}

      {/* SumUp widget mount point */}
      <div ref={mountRef} id="sumup-card" className={loading ? 'hidden' : ''} />

      <p className="text-center text-gray-500 text-xs mt-4">
        🔒 Paiement sécurisé par SumUp · PCI-DSS certifié
      </p>
    </div>
  );
}
