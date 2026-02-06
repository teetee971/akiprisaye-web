import { Link } from 'react-router-dom';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-blue-200">Cadre institutionnel</p>
          <h1 className="text-3xl font-bold text-white">Mentions légales</h1>
          <p className="text-slate-300 max-w-3xl">
            A KI PRI SA YÉ est un observatoire citoyen indépendant. Le service est fourni sans authentification,
            sans backend et sans collecte de données utilisateurs.
          </p>
        </header>

        <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Responsabilité et publication</h2>
            <ul className="mt-2 space-y-2 text-slate-300">
              <li><strong>Nature du site :</strong> observatoire citoyen open-data, informatif uniquement.</li>
              <li><strong>Responsable de publication :</strong> projet A KI PRI SA YÉ.</li>
              <li><strong>Hébergement :</strong> Cloudflare Pages (infrastructure statique, sans serveur dédié).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Données et confidentialité</h2>
            <ul className="mt-2 space-y-2 text-slate-300">
              <li><strong>Sources :</strong> données publiques et contributions ouvertes, non contractuelles.</li>
              <li>
                <strong>APIs externes :</strong> Open Food Facts et Open Prices peuvent être interrogées pour
                enrichir les informations produit et prix (requêtes anonymes).
              </li>
              <li>
                <strong>Géolocalisation :</strong> détection de territoire possible via géolocalisation navigateur
                ou via IP (ipapi.co) en mode de secours, avec stockage local du choix.
              </li>
              <li><strong>Données personnelles :</strong> aucune collecte, aucune exploitation nominative.</li>
              <li><strong>Cookies & trackers :</strong> aucun cookie publicitaire, aucun suivi utilisateur.</li>
              <li><strong>Stockage :</strong> uniquement local dans le navigateur pour les préférences et données chargées.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Limitation de responsabilité</h2>
            <p className="mt-2 text-slate-300">
              Les informations publiées sont fournies à titre informatif. Malgré le soin apporté à leur exactitude,
              A KI PRI SA YÉ ne peut être tenue responsable d’erreurs, d’omissions ou de l’usage qui en est fait.
            </p>
          </div>
        </section>

        <footer className="flex flex-wrap gap-3 text-sm text-slate-400">
          <Link to="/" className="hover:text-blue-300">Accueil</Link>
          <span aria-hidden="true">•</span>
          <Link to="/donnees-publiques" className="hover:text-blue-300">Données publiques</Link>
        </footer>
      </div>
    </div>
  );
}
