/**
 * PromoCodeWidget — Real-time promo code validation and application
 */
import React, { useState, useCallback } from 'react';
import { Tag, CheckCircle, XCircle, Loader } from 'lucide-react';
import { resolveApiBaseUrl } from '@/services/apiBaseUrl';

interface PromoResult {
  valid: boolean;
  discount: number;
  message?: string;
  expiresAt?: string;
  usesRemaining?: number;
}

interface PromoCodeWidgetProps {
  planKey: string;
  onApply?: (discount: number, code: string) => void;
  onRemove?: () => void;
  className?: string;
}

export default function PromoCodeWidget({
  planKey,
  onApply,
  onRemove,
  className = '',
}: PromoCodeWidgetProps) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<PromoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const validate = useCallback(async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const base = resolveApiBaseUrl();
      const resp = await fetch(`${base}/api/promos/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), planKey }),
      });
      const data = (await resp.json()) as Partial<PromoResult> & {
        success?: boolean;
        error?: string;
        message?: string;
      };

      const normalizedResult: PromoResult =
        resp.ok && data.success !== false && data.valid === true && typeof data.discount === 'number'
          ? {
              valid: true,
              discount: data.discount,
              message: data.message,
              expiresAt: data.expiresAt,
              usesRemaining: data.usesRemaining,
            }
          : {
              valid: false,
              discount: 0,
              message:
                data.message ||
                data.error ||
                'Impossible de valider le code. Réessayez.',
            };

      setResult(normalizedResult);

      if (normalizedResult.valid && normalizedResult.discount > 0) {
        setApplied(true);
        onApply?.(normalizedResult.discount, code.trim().toUpperCase());
      }
    } catch {
      setResult({ valid: false, discount: 0, message: 'Impossible de valider le code. Réessayez.' });
    } finally {
      setLoading(false);
    }
  }, [code, planKey, onApply]);

  const handleRemove = () => {
    setCode('');
    setResult(null);
    setApplied(false);
    onRemove?.();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <Tag className="w-4 h-4 text-blue-400" />
        Avez-vous un code promo&nbsp;?
      </label>

      {applied && result?.valid ? (
        <div className="flex items-center gap-3 p-3 bg-green-900/30 border border-green-500/40 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-green-300 font-semibold text-sm">
              Code <span className="font-mono">{code.toUpperCase()}</span> appliqué
            </p>
            <p className="text-green-400 text-xs">{result.message}</p>
          </div>
          <button
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-400 text-xs underline flex-shrink-0"
          >
            Retirer
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setResult(null);
              setApplied(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && validate()}
            placeholder="Ex: BIENVENUE20"
            className="flex-1 px-3 py-2 bg-white/[0.08] border border-white/[0.22] rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none font-mono uppercase"
            aria-label="Code promo"
          />
          <button
            onClick={validate}
            disabled={loading || !code.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Appliquer'}
          </button>
        </div>
      )}

      {result && !applied && (
        <div
          className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
            result.valid
              ? 'bg-green-900/20 text-green-300'
              : 'bg-red-900/20 text-red-300'
          }`}
        >
          {result.valid ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{result.message}</span>
          {result.usesRemaining !== undefined && result.valid && (
            <span className="ml-auto text-xs text-gray-400">
              {result.usesRemaining} util. restantes
            </span>
          )}
        </div>
      )}
    </div>
  );
}
