import { Link, useParams } from 'react-router-dom';

const territoryLabels: Record<string, string> = {
  guadeloupe: 'Guadeloupe',
  martinique: 'Martinique',
  guyane: 'Guyane',
  reunion: 'La Réunion',
  mayotte: 'Mayotte',
};

export default function TerritoryHub() {
  const { territory } = useParams<{ territory: string }>();
  const territoryLabel = territory ? territoryLabels[territory] || territory : 'Territoire';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">{territoryLabel}</h1>
        <p className="text-white/70 mb-10">
          Accédez rapidement aux outils clés pour votre territoire.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/${territory}/scanner`}
            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Scanner
          </Link>
          <Link
            to={`/${territory}/comparateurs`}
            className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            Comparateurs
          </Link>
          <Link
            to="/carte-itineraires"
            className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Carte
          </Link>
        </div>
      </div>
    </div>
  );
}
