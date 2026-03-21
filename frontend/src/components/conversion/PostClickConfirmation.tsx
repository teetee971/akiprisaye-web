import React, { useEffect } from 'react';

interface PostClickConfirmationProps {
  productName?: string;
  onDismiss?: () => void;
  /** Auto-dismiss delay in ms (default 4000) */
  autoHideMs?: number;
}

export function PostClickConfirmation({
  productName,
  onDismiss,
  autoHideMs = 4000,
}: PostClickConfirmationProps) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss?.(), autoHideMs);
    return () => window.clearTimeout(id);
  }, [autoHideMs, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm"
    >
      <div className="bg-green-900 border border-green-600 rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3">
        <span className="text-xl shrink-0">✅</span>
        <div>
          <p className="text-sm font-semibold text-white">Bon choix !</p>
          <p className="text-xs text-green-300 mt-0.5">
            {productName
              ? `On te prévient si le prix de "${productName}" baisse encore.`
              : 'On te prévient si le prix baisse encore.'}
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Fermer"
          className="ml-auto text-green-400 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default PostClickConfirmation;
