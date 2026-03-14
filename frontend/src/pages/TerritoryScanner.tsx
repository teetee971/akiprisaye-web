import { useParams, Link } from 'react-router-dom';

export default function TerritoryScanner() {
  const { territory } = useParams<{ territory: string }>();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-4">Scanner — {territory}</h1>
        <p className="text-white/70 mb-8">
          Cette page de scanner territoriale arrive bientôt. Vous pouvez déjà utiliser le scanner global.
        </p>
        <Link
          to="/scanner"
          className="inline-flex px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          Ouvrir le scanner global
        </Link>
      </div>
    </div>
  );
}
