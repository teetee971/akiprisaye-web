export default function Gouvernance() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm text-blue-200 uppercase tracking-wide">Statut &amp; gouvernance</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Observatoire citoyen indépendant</h1>
          <p className="text-slate-300 max-w-3xl">
            Publication publique, sans autorité administrative ni exploitation commerciale. Les données sont sourcées,
            limitées et relues avant diffusion.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Statut</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Observatoire citoyen, opéré sans mandat administratif.</li>
            <li>Financement neutre : aucune publicité ni partenariat commercial associé aux données.</li>
            <li>Responsabilité éditoriale assumée : chaque publication est relue avant mise en ligne.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Ce que nous ne faisons pas</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Pas d&apos;investigation administrative ni d&apos;inspection officielle.</li>
            <li>Pas d&apos;exploitation commerciale des données publiées.</li>
            <li>Pas d&apos;engagement automatique de mise à jour : chaque itération est annoncée.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Principes de publication</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Données publiques sourcées, disponibles sans authentification.</li>
            <li>Indication systématique du territoire, de la date et de la source.</li>
            <li>Signalement explicite des limites de couverture et des zones non couvertes.</li>
            <li>Protection des personnes : aucune donnée personnelle collectée pour consulter.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Gouvernance des données</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>Qui décide : le collectif citoyen A KI PRI SA YÉ priorise les publications.</li>
            <li>Qui valide : un binôme relecteur vérifie chaque fichier et sa source avant diffusion.</li>
            <li>Qui corrige : toute personne peut signaler une erreur, les corrections sont tracées publiquement.</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Responsabilité éditoriale</h2>
          <p className="text-slate-200">
            Les contenus publiés relèvent d&apos;une initiative citoyenne. Ils peuvent être cités par les médias,
            associations et collectivités, avec mention de la source. Toute correction ou précision peut être demandée
            via la page Contact.
          </p>
        </section>
      </div>
    </div>
  );
}
