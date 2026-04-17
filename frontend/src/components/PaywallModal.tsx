import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  open: boolean;
  reason: 'quota' | 'pro_feature';
  isGuest: boolean;
  onClose: () => void;
};

export default function PaywallModal({ open, reason, isGuest, onClose }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <h2 id="paywall-modal-title" className="text-xl font-bold mb-2">
          {reason === 'quota' ? 'Limite atteinte' : 'Fonction Pro'}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {reason === 'quota'
            ? 'Vous avez atteint votre limite de recherches pour aujourd’hui.'
            : 'Cette fonctionnalité est réservée aux utilisateurs Pro.'}
        </p>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded border">
            Fermer
          </button>
          {isGuest && (
            <Link
              to="/auth"
              className="px-3 py-2 rounded bg-slate-800 text-white"
              onClick={onClose}
            >
              Créer un compte
            </Link>
          )}
          <Link
            to="/pricing"
            className="px-3 py-2 rounded bg-blue-600 text-white"
            onClick={onClose}
          >
            Voir Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
