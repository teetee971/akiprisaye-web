import React, { useState } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { useTiPanier } from '../hooks/useTiPanier';
import TiPanierDrawer from './TiPanierDrawer';

/**
 * Ti‑panier button (mobile-first floating + optional header placement).
 * - Shows counter
 * - Opens TiPanierDrawer
 * - Supports both 'comparison' and 'wishlist' types
 */
export default function TiPanierButton({
  float = true,
  type = 'comparison',
}: {
  float?: boolean;
  type?: 'comparison' | 'wishlist';
}) {
  const { count } = useTiPanier(type);
  const [open, setOpen] = useState(false);

  const Icon = type === 'wishlist' ? Heart : ShoppingCart;
  const label =
    type === 'wishlist'
      ? count > 0
        ? `Ma liste — ${count} éléments`
        : 'Ma liste vide'
      : count > 0
        ? `Ti‑panier — ${count} éléments`
        : 'Ti‑panier vide';

  const bgColor =
    type === 'wishlist' ? 'bg-pink-600 hover:bg-pink-500' : 'bg-blue-600 hover:bg-blue-500';
  const ringColor = type === 'wishlist' ? 'focus:ring-pink-400' : 'focus:ring-blue-400';
  const buttonClass = float
    ? `flex items-center gap-2 px-3 py-2 ${bgColor} text-white rounded-full shadow-lg focus:outline-none focus:ring-2 ${ringColor}`
    : `inline-flex items-center gap-2 px-3 py-2 ${bgColor} text-white rounded-md focus:outline-none focus:ring-2 ${ringColor}`;

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
        className={buttonClass}
        data-tour="ti-panier"
      >
        <Icon size={18} aria-hidden />
        <span className="sr-only">{label}</span>
        <span aria-hidden className="font-medium">
          {count}
        </span>
      </button>

      <TiPanierDrawer open={open} onClose={() => setOpen(false)} type={type} />
    </>
  );
}
