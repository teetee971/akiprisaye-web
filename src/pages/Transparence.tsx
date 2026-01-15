export default function Transparence() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Service public</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Données & transparence</h1>
          <p className="text-slate-300">
            Ce qui est publié aujourd&apos;hui, ce qui ne l&apos;est pas encore, et nos engagements de mise à jour.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Données publiées</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Prix réels (TTC) d&apos;un panier alimentaire de base relevé en Guadeloupe.</li>
            <li>Date de référence et source affichées sur la page Observatoire.</li>
            <li>Fichier JSON public, téléchargeable directement sans compte.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Ce qui n&apos;est pas encore couvert</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Pas d&apos;historique multi-mois pour l&apos;instant.</li>
            <li>Pas de couverture des autres territoires ni des catégories non alimentaires.</li>
            <li>Pas d&apos;alertes prix ni de notifications : volontairement désactivées pour cette version.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Engagement de transparence</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Indiquer systématiquement la date, la source et le territoire de chaque donnée.</li>
            <li>Signaler clairement toute donnée manquante ou en cours d&apos;activation.</li>
            <li>Publier les mises à jour mensuelles même si le périmètre reste réduit.</li>
            <li>Pas de collecte de données personnelles pour consulter l&apos;observatoire.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
