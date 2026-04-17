import React, { useState } from 'react';
import { ShieldCheck, Info, ExternalLink } from 'lucide-react';
import { getCommissionStatus } from '../../utils/bookingLinks';

interface BookingLinkBadgeProps {
  /** Afficher le tooltip au survol (défaut : true) */
  showTooltip?: boolean;
  /** Taille : sm (défaut) ou md */
  size?: 'sm' | 'md';
}

/**
 * Badge transparent indiquant le type de lien sortant.
 * - Lien direct (vert)
 * - Lien partenaire (jaune)
 */
const BookingLinkBadge: React.FC<BookingLinkBadgeProps> = ({ showTooltip = true, size = 'sm' }) => {
  const [open, setOpen] = useState(false);
  const status = getCommissionStatus();

  const colorClasses =
    status.color === 'green'
      ? 'bg-green-500/10 border-green-500/30 text-green-400'
      : status.color === 'yellow'
        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className="relative inline-flex items-center">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${colorClasses} ${textSize} font-medium select-none`}
        title={showTooltip ? status.detail : undefined}
      >
        <ShieldCheck className={iconSize} />
        {status.label}
        {showTooltip && (
          <button
            type="button"
            aria-label="En savoir plus sur les liens"
            onClick={() => setOpen((v) => !v)}
            className="ml-0.5 opacity-70 hover:opacity-100 focus:outline-none"
          >
            <Info className={iconSize} />
          </button>
        )}
      </span>

      {showTooltip && open && (
        <div
          role="tooltip"
          aria-label="Informations sur les liens"
          className="absolute bottom-full left-0 mb-2 z-50 w-72 bg-slate-800 border border-slate-600 rounded-xl p-3 shadow-xl text-xs text-gray-300 leading-relaxed"
        >
          <p className="font-semibold text-gray-100 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            Informations sur les liens
          </p>
          <p>{status.detail}</p>
          <p className="mt-2 text-gray-400 flex items-center gap-1">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            Les liens « Voir l'offre » ouvrent le site officiel de l'opérateur dans un nouvel
            onglet.
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-gray-500 hover:text-gray-300 underline text-xs"
          >
            Fermer
          </button>
        </div>
      )}
    </span>
  );
};

export default BookingLinkBadge;
