import { useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function Presse() {
  const today = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <style>
        {`
          @media print {
            .presse-print-hide { display: none !important; }
            .presse-print-block { display: block !important; }
            body { background: white; color: #0f172a; }
          }
        `}
      </style>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Pack presse officiel</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            A KI PRI SA YÉ — Observatoire citoyen des prix
          </h1>
          <p className="text-slate-300">
            Communiqué prêt à publier, citations officielles, fiche projet et angles éditoriaux. Texte neutre, copiable,
            sans jargon ni promesse excessive.
          </p>
          <div className="flex flex-wrap gap-3 presse-print-hide">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Télécharger le communiqué (PDF)
            </button>
            <Link
              to="/dossier-media"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-400 text-slate-200 text-sm font-semibold transition-colors"
            >
              Dossier médias
            </Link>
          </div>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Communiqué de presse</h2>
          <p className="text-slate-200 font-semibold">
            A KI PRI SA YÉ lance un observatoire citoyen des prix pour mieux comprendre la vie chère dans les territoires
            ultramarins
          </p>
          <p className="text-sm text-slate-400">Guadeloupe, {today}</p>
          <p className="text-slate-200 leading-relaxed">
            A KI PRI SA YÉ met en ligne un observatoire citoyen des prix destiné à rendre plus lisible l’évolution du coût de la
            vie dans les territoires ultramarins. La plateforme permet de consulter des prix observés, de comparer les territoires
            à produit équivalent, d’analyser les évolutions dans le temps et de détecter automatiquement des variations
            inhabituelles, grâce à des méthodes statistiques simples et explicables. L’ensemble des données est publié en open
            data, sans collecte de données personnelles, sans publicité et sans système de notation. A KI PRI SA YÉ se positionne
            comme un outil citoyen, indépendant et transparent, au service du débat public, des collectivités, des associations et
            des chercheurs.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-400">Mentions presse</p>
              <ul className="list-disc list-inside text-slate-200 space-y-1 text-sm">
                <li>Données publiques et ouvertes</li>
                <li>Aucune collecte utilisateur</li>
                <li>Méthodologie explicable</li>
                <li>Projet non partisan</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-400">Liens utiles</p>
              <ul className="list-disc list-inside text-slate-200 space-y-1 text-sm">
                <li>
                  <Link className="text-blue-300 hover:text-blue-200" to="/observatoire">
                    Page Observatoire
                  </Link>
                </li>
                <li>
                  <Link className="text-blue-300 hover:text-blue-200" to="/donnees-publiques">
                    Données publiques
                  </Link>
                </li>
                <li>
                  <Link className="text-blue-300 hover:text-blue-200" to="/methodologie">
                    Méthodologie
                  </Link>
                </li>
                <li>
                  <Link className="text-blue-300 hover:text-blue-200" to="/contact-collectivites">
                    Dossier collectivités
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Citations officielles</h2>
          <div className="space-y-2 text-slate-200">
            <p className="italic">« A KI PRI SA YÉ n’accuse pas, il montre. Les chiffres parlent d’eux-mêmes. »</p>
            <p className="italic">
              « Notre objectif est de rendre les prix visibles, comparables et compréhensibles, sans jugement ni polémique. »
            </p>
            <p className="italic">
              « L’observatoire repose sur des méthodes simples, ouvertes et auditées. Chacun peut vérifier les données. »
            </p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Fiche projet — synthèse</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-slate-200">
            <div className="space-y-1">
              <p className="font-semibold">Nom</p>
              <p>A KI PRI SA YÉ</p>
              <p className="font-semibold">Nature</p>
              <p>Observatoire citoyen des prix</p>
              <p className="font-semibold">Territoires</p>
              <p>Outre-mer (périmètre précisé sur le site)</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Fonctionnalités clés</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Observatoire des prix vivant</li>
                <li>Comparaison inter-territoires</li>
                <li>Détection d’anomalies explicable</li>
                <li>Export open data (JSON / CSV)</li>
              </ul>
              <p className="font-semibold">Spécificités</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Pas de publicité</li>
                <li>Pas de tracking</li>
                <li>Pas de données personnelles</li>
                <li>Code et méthodologie transparents</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Angles éditoriaux proposés</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>« La vie chère vue par les chiffres, sans discours »</li>
            <li>« Comparer les prix entre territoires : que disent réellement les données ? »</li>
            <li>« Un observatoire citoyen pour objectiver le débat sur le coût de la vie »</li>
            <li>« Quand les données publiques deviennent accessibles à tous »</li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Contact & liens</h2>
          <p className="text-slate-200">
            Pour interviews, citations ou précisions méthodologiques, contactez l’équipe via la page dédiée ou consultez le
            dossier collectivités.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              Page contact
            </Link>
            <Link
              to="/observatoire"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-400 text-slate-200 text-sm font-semibold transition-colors"
            >
              Observatoire
            </Link>
            <Link
              to="/donnees-publiques"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-400 text-slate-200 text-sm font-semibold transition-colors"
            >
              Données publiques
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
