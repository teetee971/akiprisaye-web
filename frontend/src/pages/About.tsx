import { Link } from 'react-router-dom';

const territories = [
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
  'Nouvelle-Calédonie',
  'Polynésie française',
  'Wallis-et-Futuna',
  'Saint-Pierre-et-Miquelon',
  'Saint-Barthélemy',
  'Saint-Martin',
  'TAAF'
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white">Pourquoi A KI PRI SA YÉ ?</h1>
        <p className="mt-3 text-slate-300">
          Nous rendons visibles les écarts de prix observés localement afin d'aider les citoyens à comparer de façon neutre.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-white">Ce que vous gagnez</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
          <li>Comparaison multi-enseignes sur données terrain.</li>
          <li>Historique local pour suivre les variations.</li>
          <li>Parcours mobile rapide: recherche, scan EAN, scan ticket.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-white">12 territoires couverts</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300 md:grid-cols-3">
          {territories.map((territory) => (
            <span key={territory} className="rounded-lg border border-slate-700 px-3 py-2">
              {territory}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-xl font-semibold text-white">Exemple de comparaison</h2>
        <p className="mt-3 text-slate-300">
          Un même panier peut afficher des écarts significatifs entre enseignes selon le territoire.
          Notre comparateur centralise ces observations pour vous faire gagner du temps.
        </p>
        <Link to="/comparateur" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">
          Ouvrir le comparateur
        </Link>
      </section>
    </div>
  );
}
