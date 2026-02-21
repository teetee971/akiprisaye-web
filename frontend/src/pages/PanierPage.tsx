import React from 'react';
import { Link } from 'react-router-dom';
import { useTiPanier } from '../hooks/useTiPanier';

export default function PanierPage() {
  const { items, count, removeItem, clear } = useTiPanier('comparison');

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Panier</h1>
            <p className="mt-1 text-sm text-slate-300">
              {count} article{count > 1 ? 's' : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={clear}
            disabled={items.length === 0}
            className="rounded-lg border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Vider
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
            <p className="mb-4 text-slate-300">Votre panier est vide.</p>
            <Link
              to="/scanner"
              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Aller au scan
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const name = String((item.meta as any)?.name ?? `Produit ${item.id}`);
              const barcode = String((item.meta as any)?.barcode ?? item.id);

              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4"
                >
                  <div>
                    <div className="font-semibold text-white">{name}</div>
                    <div className="text-xs text-slate-400">Code-barres: {barcode}</div>
                    <div className="text-xs text-slate-400">Quantité: {item.quantity}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                    aria-label={`Retirer ${name} du panier`}
                  >
                    Retirer
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
