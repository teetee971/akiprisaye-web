export default function Methodologie() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="animate-fade-in">
          <header className="space-y-2">
            <p className="text-sm text-blue-200 uppercase tracking-wide">Observatoire public</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Méthodologie</h1>
            <p className="text-slate-300">
              Cadre clair pour la première publication de prix réels. Aucun modèle, aucune estimation : uniquement des
              relevés tangibles.
            </p>
          </header>
        </div>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Origine des données</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Relevés terrain réalisés en Guadeloupe (janvier 2026).</li>
            <li>Prix TTC observés en rayons pour un panier alimentaire de base.</li>
            <li>Pas de projections ni de moyennes nationales : chaque prix correspond à une étiquette vérifiée.</li>
            <li>Source déclarée : lien public explicitement indiqué sur la page Observatoire.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Fréquence de mise à jour</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Mise à jour manuelle mensuelle (périodicité minimale assurée).</li>
            <li>Nouvelle version publiée dans le dossier <code className="bg-slate-800 px-1 rounded">public/data/observatoire</code>.</li>
            <li>Date et périmètre toujours affichés pour éviter toute ambiguïté.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Limites actuelles</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Périmètre restreint à quatre produits essentiels (panier de base).</li>
            <li>Un seul territoire couvert : Guadeloupe. Les autres territoires seront ajoutés progressivement.</li>
            <li>Échantillon réduit : premiers relevés expérimentaux, susceptibles d&apos;évoluer.</li>
            <li>Aucune donnée utilisateur collectée pour cette publication.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
