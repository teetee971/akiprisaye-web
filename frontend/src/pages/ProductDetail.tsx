import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCachedProduct } from '../services/freemium';

function formatPrice(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = id ? getCachedProduct(id) : null;

  if (!product) {
    return <div className="max-w-3xl mx-auto p-4">Produit introuvable. <Link to="/comparateur" className="text-blue-600">Retour</Link></div>;
  }

  const current = formatPrice(product.price);
  const min = current ?? 0;
  const median = current ?? 0;
  const max = current ?? 0;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Link to="/comparateur" className="text-blue-600">← Retour comparateur</Link>
      <h1 className="text-2xl font-bold">{String(product.title ?? 'Produit')}</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="border rounded p-3"><p className="text-sm text-slate-500">Min</p><p className="font-bold">{min} €</p></div>
        <div className="border rounded p-3"><p className="text-sm text-slate-500">Médiane</p><p className="font-bold">{median} €</p></div>
        <div className="border rounded p-3"><p className="text-sm text-slate-500">Max</p><p className="font-bold">{max} €</p></div>
      </div>
      <div className="border rounded p-3 space-y-2">
        <p><strong>Source:</strong> {String(product.merchant ?? 'N/A')}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
        <p><strong>Fiabilité:</strong> <span className="px-2 py-1 bg-emerald-100 rounded text-emerald-700">Fiable</span></p>
      </div>
      <div className="border rounded p-3 bg-slate-50 dark:bg-slate-800">
        <p className="font-medium">Insights (aperçu)</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Tendance stable cette semaine. Passez Pro pour les outliers et l’analyse complète.</p>
      </div>
    </div>
  );
}
