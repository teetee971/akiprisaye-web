import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAlertById } from '../services/alertsService';

export default function AlerteDetail() {
  const { id = '' } = useParams();
  const [alert, setAlert] = useState(undefined);

  useEffect(() => {
    let mounted = true;
    getAlertById(id).then((item) => {
      if (mounted) setAlert(item);
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (typeof alert === 'undefined') {
    return <main className="max-w-4xl mx-auto px-4 py-8 text-slate-100">Chargement…</main>;
  }

  if (!alert) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 text-slate-100">
        <h1 className="text-2xl font-bold mb-4">Alerte introuvable</h1>
        <Link to="/alertes" className="text-blue-300 underline">Retour aux alertes</Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 text-slate-100">
      <Link to="/alertes" className="text-sm text-blue-300 underline">← Retour aux alertes</Link>
      <h1 className="text-2xl font-bold mt-3">{alert.title}</h1>
      <p className="text-sm text-slate-400 mt-2">
        {alert.publishedAt ? `Publié le ${new Date(alert.publishedAt).toLocaleDateString('fr-FR')}` : 'Date non renseignée'}
        {` • ${alert.status}`}
      </p>

      <section className="mt-6 space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
        <p><strong>Produit:</strong> {alert.productName ?? 'Non précisé'}</p>
        <p><strong>Marque:</strong> {alert.brand ?? 'Non précisée'}</p>
        <p><strong>Catégorie:</strong> {alert.category ?? 'Non précisée'}</p>
        <p><strong>EAN:</strong> {alert.ean ?? 'Non précisé'}</p>
        <p><strong>Lot:</strong> {alert.lot ?? 'Non précisé'}</p>
        <p><strong>Motif:</strong> {alert.reason ?? 'Non communiqué'}</p>
        <p><strong>Risque:</strong> {alert.risk ?? 'Non communiqué'}</p>
        <p><strong>Consignes:</strong> {alert.instructions ?? 'Non communiqué'}</p>
        <p><strong>Source:</strong> {alert.sourceName}</p>
        {alert.sourceUrl && (
          <a
            href={alert.sourceUrl}
            target="_blank"
            rel="noopener"
            className="inline-block text-blue-300 underline"
          >
            Consulter la source officielle
          </a>
        )}
      </section>
    </main>
  );
}
