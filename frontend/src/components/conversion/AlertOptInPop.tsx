import React, { useState, useEffect } from 'react';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

const KEY = 'akp:alert-optin:v1';

export function AlertOptInPop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only once — never show again once user chose
    const seen = safeLocalStorage.getItem(KEY);
    if (!seen) {
      // Small delay so it doesn't compete with page load
      const id = window.setTimeout(() => setVisible(true), 3000);
      return () => window.clearTimeout(id);
    }
  }, []);

  function dismiss(accepted: boolean) {
    safeLocalStorage.setItem(KEY, accepted ? 'accepted' : 'dismissed');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Activer les alertes prix"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => dismiss(false)}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-auto p-5 shadow-2xl">
        <p className="text-lg font-bold text-white mb-1">🔔 Ne rate plus les baisses</p>
        <p className="text-sm text-gray-300 mb-4">
          Active les alertes pour être averti quand le prix baisse sur tes produits favoris.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => dismiss(true)}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            Activer
          </button>
          <button
            onClick={() => dismiss(false)}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl py-2.5 text-sm transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertOptInPop;
