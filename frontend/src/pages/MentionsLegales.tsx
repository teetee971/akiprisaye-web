import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
export default function MentionsLegales() {
  return (
    <>
      <SEOHead
        title="Mentions légales — A KI PRI SA YÉ"
        description="Mentions légales, politique de confidentialité et conditions d'utilisation de l'application A KI PRI SA YÉ."
        canonical="https://teetee971.github.io/akiprisaye-web/mentions-legales"
      />
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <HeroImage
          src={PAGE_HERO_IMAGES.mentionsLegales}
          alt="Mentions légales"
          gradient="from-slate-950 to-slate-800"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>⚖️ Mentions légales</h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>Informations légales et conditions d'utilisation</p>
        </HeroImage>

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
    </>
  );
}
