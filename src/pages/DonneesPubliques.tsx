const dataFiles = [
  {
    name: 'prices.csv',
    path: '/open-data/prices.csv',
    description: 'Export agrégé multi-territoires (14 derniers jours) – prêt pour tableur.',
    territory: 'DOM/COM (multi)',
    period: 'Heure / jour / semaine / mois',
    source: 'Open-data cache (pas de flux caisse)',
  },
  {
    name: 'prices.jsonl',
    path: '/open-data/prices.jsonl',
    description: 'Export NDJSON (une ligne = une observation horodatée).',
    territory: 'DOM/COM (multi)',
    period: 'Heure / jour / semaine / mois',
    source: 'Open-data cache (pas de flux caisse)',
  },
  {
    name: 'metadata.json',
    path: '/open-data/metadata.json',
    description: 'Métadonnées officielles (licence, périmètre, fraîcheur).',
    territory: 'Global',
    period: 'Horodatage inclus',
    source: 'A KI PRI SA YÉ – Observatoire',
  },
  {
    name: 'prix-panier-base.json',
    path: '/data/observatoire/prix-panier-base.json',
    description: 'Panier de référence observatoire (prix moyens par produit).',
    territory: 'Outre-mer – panier type',
    period: 'Mise à jour mensuelle (2026)',
    source: 'Relevés citoyens et publications officielles',
  },
  {
    name: 'guadeloupe_2026-01.json',
    path: '/data/observatoire/guadeloupe_2026-01.json',
    description: 'Observation mensuelle Guadeloupe – relevés agrégés.',
    territory: 'Guadeloupe',
    period: 'Janvier 2026',
    source: 'Open-data locale + collectes terrain',
  },
  {
    name: 'guadeloupe_2026-02.json',
    path: '/data/observatoire/guadeloupe_2026-02.json',
    description: 'Observation mensuelle Guadeloupe – relevés agrégés.',
    territory: 'Guadeloupe',
    period: 'Février 2026',
    source: 'Open-data locale + collectes terrain',
  },
];

export default function DonneesPubliques() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-blue-200">Open-data officiel</p>
          <h1 className="text-3xl font-bold text-white">Données publiques</h1>
          <p className="text-slate-300 max-w-3xl">
            Liste des fichiers statiques mis à disposition par l’observatoire citoyen. Aucun appel réseau dynamique,
            aucune collecte personnelle. Pas de promesse “flux caisse live” : la source et la fraîcheur sont affichées.
          </p>
        </header>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-blue-100">Confiance et sobriété</p>
              <p className="text-slate-200 font-semibold">
                Les données sont stockées localement dans le navigateur après chargement.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-2 rounded-full bg-blue-900/40 text-blue-100 text-xs font-medium">
              Données publiques — stockage local — aucun suivi
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Formats CSV / JSONL / JSON lisibles par tous · Pas de cookie · Pas de tracker · Pas d’identifiants requis.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="/open-data/prices.csv"
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500"
            >
              Télécharger prices.csv
            </a>
            <a
              href="/open-data/prices.jsonl"
              className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-blue-400 text-sm"
            >
              Export JSONL
            </a>
            <a
              href="/open-data/metadata.json"
              className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-blue-400 text-sm"
            >
              Métadonnées
            </a>
          </div>
        </div>

        <section className="space-y-4">
          {dataFiles.map((file) => (
            <article key={file.name} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{file.name}</h2>
                <code className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-200">{file.path}</code>
              </div>
              <p className="text-slate-300">{file.description}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-200">
                <div>
                  <dt className="text-slate-400">Territoire</dt>
                  <dd className="font-medium">{file.territory}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Période</dt>
                  <dd className="font-medium">{file.period}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Source</dt>
                  <dd className="font-medium">{file.source}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
