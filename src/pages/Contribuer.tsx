import { Link } from 'react-router-dom';

export default function Contribuer() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Contribution citoyenne</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Contribuer aux données</h1>
          <p className="text-slate-300 max-w-3xl">
            Un canal clair, sans scraping ni API privées : contributions humaines vérifiées, publiées en open-data,
            avec source affichée.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Qui peut contribuer ?</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Agents de terrain mandatés ou associatifs.</li>
            <li>Bénévoles ou collectifs locaux souhaitant partager leurs relevés.</li>
            <li>Collectivités et partenaires institutionnels.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Comment les données sont vérifiées ?</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>1 fichier CSV contrôlé par semaine, validé manuellement.</li>
            <li>Horodatage obligatoire et territoire déclaré sur chaque ligne.</li>
            <li>Relecture éditoriale avant mise en ligne et historique public des versions.</li>
          </ul>
          <p className="text-xs text-slate-400">
            Les données horaires reflètent les dernières observations disponibles, sans promesse de « live garanti ».
          </p>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Protection &amp; ouverture</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Aucune donnée personnelle collectée pour consulter ou déposer un relevé.</li>
            <li>Licence open-data (ODbL) pour réutiliser les fichiers publiés.</li>
            <li>Sources affichées clairement pour chaque jeu de données.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Exemple d&apos;affichage</h2>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
            <p>Source : Relevé terrain – Association X</p>
            <p>Zone : Guadeloupe – Basse-Terre</p>
            <p>Format : CSV hebdomadaire validé</p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Participer</h2>
          <p className="text-slate-200">
            Pour déposer vos relevés : passez par le formulaire sécurisé ou contactez-nous pour un dépôt CSV encadré.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contribuer-prix"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Formulaire de relevé
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-400 text-slate-200 text-sm font-semibold transition-colors"
            >
              Contacter l&apos;équipe
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
