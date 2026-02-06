import { useParams, Link } from 'react-router-dom';

export default function TerritoryComparateurs() {
  const { territory } = useParams<{ territory: string }>();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">Comparateurs — {territory}</h1>
        <p className="text-white/70 mb-8">
          Accédez aux comparateurs dédiés à votre territoire. Le hub complet arrive bientôt.
        </p>
        <Link
          to="/comparateurs"
          className="inline-flex px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
        >
          Voir les comparateurs globaux
        </Link>
      </div>
    </div>
  );
}
