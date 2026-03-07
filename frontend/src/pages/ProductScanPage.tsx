// @ts-nocheck -- Legacy component with untyped props; TODO: add proper types
 
import React, { useEffect, useState } from 'react';
import ScanProductPWA from '../components/ScanProductPWA';

export default function ProductScanPage({ ean }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(`/api/scan/${ean}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Impossible de charger les données du produit.');
        }
        return res.json();
      })
      .then((res) => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (isMounted) {
          setError("La récupération des informations a échoué. Veuillez réessayer.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [ean]);

  if (loading) {
    return <div>Chargement…</div>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-500/60 bg-red-500/10 p-4 text-red-100">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-slate-200">
        Aucune donnée produit disponible pour ce scan.
      </div>
    );
  }

  return <ScanProductPWA {...data} />;
}
