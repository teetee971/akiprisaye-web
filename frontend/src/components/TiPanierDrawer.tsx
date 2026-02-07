import React, { useEffect, useRef } from "react";
import { X, Trash2, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTiPanier } from "../hooks/useTiPanier";
import { GlassCard } from "./ui/glass-card";

// Price comparison tolerance for determining min/max
const PRICE_COMPARISON_TOLERANCE = 0.01;

/**
 * Drawer/modal showing saved items.
 * - Full client-side, safeLocalStorage via useTiPanier
 * - Firestore persistence for authenticated users
 * - Accessible: role="dialog", aria-labelledby
 * - Mobile-first: appears from bottom on small screens
 *
 * Adds: ESC key handling and lightweight focus trap (no extra dependency)
 * Enhanced: Price statistics, min/max indicators
 */
export default function TiPanierDrawer({ open, onClose, type = 'comparison' }: { open: boolean; onClose: () => void; type?: 'comparison' | 'wishlist' }) {
  const { items, removeItem, clear, priceStats, isAuthenticated } = useTiPanier(type);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  function getFocusableElements(container: HTMLElement | null) {
    if (!container) return [] as HTMLElement[];
    const selectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ];
    return Array.from(container.querySelectorAll(selectors.join(','))) as HTMLElement[];
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = getFocusableElements(containerRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          containerRef.current?.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && (active === first || active === containerRef.current)) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

      // Lock body scroll on mobile when modal is open
      document.body.classList.add('modal-open');

      // Wait for DOM render then focus the first focusable or the container
      requestAnimationFrame(() => {
        const focusables = getFocusableElements(containerRef.current);
        if (focusables.length) {
          focusables[0].focus();
        } else {
          containerRef.current?.focus();
        }
      });

      document.addEventListener('keydown', onKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);

      // Unlock body scroll when modal closes
      document.body.classList.remove('modal-open');

      // restore focus when closing
      if (!open) {
        previouslyFocusedRef.current?.focus?.();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ti-panier-title" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()} ref={containerRef} tabIndex={-1}>
        <GlassCard>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 id="ti-panier-title" className="text-lg font-semibold">
                {type === 'wishlist' ? '⭐ Ma Liste' : '🛒 Ti‑panier'}
              </h3>
              {isAuthenticated && (
                <p className="text-xs text-gray-400 mt-1">
                  💾 Sauvegardé automatiquement
                </p>
              )}
            </div>
            <button aria-label="Fermer le ti‑panier" onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded">
              <X />
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400">
              {type === 'wishlist' ? 'Votre liste est vide.' : 'Votre ti‑panier est vide.'}
            </p>
          ) : (
            <>
              {/* Price Statistics */}
              {priceStats.min !== null && priceStats.max !== null && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="text-green-400" size={16} />
                      <span className="text-gray-300">Prix le plus bas:</span>
                    </div>
                    <span className="font-semibold text-green-400">{priceStats.min.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-red-400" size={16} />
                      <span className="text-gray-300">Prix le plus haut:</span>
                    </div>
                    <span className="font-semibold text-red-400">{priceStats.max.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700">
                    <span className="text-gray-300">Total estimé:</span>
                    <span className="font-semibold text-white">{priceStats.total.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <ul className="space-y-3 max-h-64 overflow-auto">
                {items.map((it) => {
                  const name = String((it.meta && (it.meta as any).name) ?? 'Produit');
                  const price = (it.meta && (it.meta as any).price) ?? '';
                  const priceNum = typeof price === 'number' ? price : parseFloat(String(price || '0'));
                  const store = (it.meta && (it.meta as any).store) ?? '';
                  const territory = (it.meta && (it.meta as any).territory) ?? '';
                  
                  // Determine if this is the min or max price
                  const isMinPrice = priceStats.min !== null && priceNum > 0 && Math.abs(priceNum - priceStats.min) < PRICE_COMPARISON_TOLERANCE;
                  const isMaxPrice = priceStats.max !== null && priceNum > 0 && Math.abs(priceNum - priceStats.max) < PRICE_COMPARISON_TOLERANCE;

                  return (
                    <li key={it.id} className="flex items-start justify-between p-2 rounded bg-slate-800/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-white">{name}</div>
                          {isMinPrice && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-900/30 border border-green-700 text-green-300 rounded">
                              🟢 Moins cher
                            </span>
                          )}
                          {isMaxPrice && priceStats.min !== priceStats.max && (
                            <span className="px-1.5 py-0.5 text-xs bg-red-900/30 border border-red-700 text-red-300 rounded">
                              🔴 Plus cher
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {price ? `${typeof price === 'number' ? price.toFixed(2) : price} €` : ''}{store ? ` — ${store}` : ''}{territory ? ` — ${territory}` : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Quantité: {it.quantity}</div>
                      </div>

                      <div className="ml-3 flex-shrink-0">
                        <button onClick={() => removeItem(it.id)} aria-label={`Supprimer ${name}`} className="p-1 rounded text-red-400 hover:text-red-200">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {/* Compare Button - Only for comparison type with items */}
            {type === 'comparison' && items.length > 0 && (
              <button 
                onClick={() => {
                  navigate('/comparaison-panier');
                  onClose();
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <BarChart3 size={18} />
                Comparer mon panier
              </button>
            )}

            {/* Action buttons row */}
            <div className="flex gap-3 justify-end">
              <button onClick={() => { clear(); onClose(); }} className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-md text-white text-sm" disabled={items.length === 0}>
                Vider
              </button>

              <button onClick={onClose} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white text-sm">
                Fermer
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
