import { Download } from 'lucide-react';

const datasets = [
  {
    title: 'Flux prix réel - janvier 2026',
    path: '/data/prix_snapshot.json',
    format: 'JSON',
    updated: '2026-01',
    description: 'Relevé mensuel terrain et tickets scannés (Guadeloupe).',
  },
  {
    title: 'Observatoire mensuel - janvier 2026',
    path: '/data/observatoire_2026-01.json',
    format: 'JSON',
    updated: '2026-01',
    description: 'Indice panier et comparatif enseignes pour le périmètre pilote.',
  },
  {
    title: 'Snapshot agrégé public',
    path: '/data/observatory_snapshot.json',
    format: 'JSON',
    updated: '2026-01',
    description: 'Indicateurs consolidés (lecture seule, versionnée).',
  },
];

export default function Donnees() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-blue-100 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Transparence et accès direct aux données
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Données & transparence
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Périmètre couvert : Guadeloupe, Martinique (phase pilote)
              </p>
            </div>
            <a
              href="/methodologie"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Voir la méthodologie</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Accès direct aux jeux de données
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Données versionnées, mises à jour mensuellement, sans sponsoring d’enseigne. Licence : Ouverte / Etalab v2.0.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {datasets.map((dataset) => (
              <article
                key={dataset.title}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{dataset.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{dataset.description}</p>
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 mt-3">
                  <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                    {dataset.format}
                  </span>
                  <span>Mise à jour : {dataset.updated}</span>
                </div>
                <a
                  href={dataset.path}
                  download
                  className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  <Download size={16} />
                  Télécharger
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Engagements</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li>Données collectées de manière indépendante et vérifiables.</li>
            <li>Fréquence : publication mensuelle, avec versionnage des fichiers.</li>
            <li>Neutralité : aucune publicité, aucun sponsoring d’enseigne.</li>
            <li>
              Contact dédié pour signaler une erreur :{' '}
              <a
                href="mailto:contact@akiprisaye.fr"
                className="text-blue-600 dark:text-blue-300 underline"
                aria-label="Contacter l'équipe pour signaler une erreur par email"
              >
                contact@akiprisaye.fr
              </a>.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
