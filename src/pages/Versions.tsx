const versions = [
  {
    version: 'v1.0',
    date: 'janvier 2025',
    territoires: 'Guadeloupe (périmètre pilote)',
    description: 'Première mise en ligne du panier alimentaire citoyen. Fichier statique vérifié manuellement.',
    lien: '/data/observatoire/prix-panier-base.json',
  },
  {
    version: 'v1.1',
    date: 'février 2025',
    territoires: 'Guadeloupe (périmètre constant)',
    description: 'Ajustement des libellés et clarification des sources publiques. Aucune extension territoriale.',
    lien: '/data/observatoire/prix-panier-base.json',
  },
];

export default function Versions() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Données publiques</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Historique &amp; versions</h1>
          <p className="text-slate-300 max-w-3xl">
            Traçabilité simple des fichiers publiés. Chaque entrée précise la date, le territoire couvert et le lien
            direct vers le JSON public hébergé dans <code className="font-mono">/public/data/observatoire/</code>.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-slate-100">
              <caption className="px-4 py-3 text-sm text-slate-300 bg-slate-800 border-b border-slate-700">
                Historique des publications de l&apos;observatoire citoyen
              </caption>
              <thead className="bg-slate-800 text-slate-200 text-sm uppercase tracking-wide">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Version
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Territoires
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Fichier JSON
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {versions.map((item) => (
                  <tr key={item.version} className="align-top">
                    <th scope="row" className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                      {item.version}
                    </th>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-200">{item.date}</td>
                    <td className="px-4 py-3 whitespace-pre-line text-slate-200">{item.territoires}</td>
                    <td className="px-4 py-3 text-slate-200">{item.description}</td>
                    <td className="px-4 py-3">
                      <a
                        href={item.lien}
                        className="text-blue-400 hover:text-blue-300 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Télécharger
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Notes de traçabilité</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Pas d&apos;historique caché : seules les versions listées ici sont publiées.</li>
            <li>Chaque lien pointe vers un fichier statique accessible sans compte ni API.</li>
            <li>Aucune promesse d&apos;exhaustivité ou d&apos;actualisation automatique.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
