import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
export default function Methodologie() {
  return (
    <>
      <SEOHead
        title="Méthodologie — Comment nous collectons et validons les prix"
        description="Découvrez la méthodologie de collecte, validation et publication des données de prix de l'observatoire citoyen ultramarinois."
        canonical="https://teetee971.github.io/akiprisaye-web/methodologie"
      />
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          <HeroImage
            src={PAGE_HERO_IMAGES.methodologie}
            alt="Méthodologie"
            gradient="from-slate-950 to-blue-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              🔬 Méthodologie
            </h1>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Comment nous collectons et vérifions les prix
            </p>
          </HeroImage>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Origine des données</h2>
            <ul className="list-disc list-inside text-slate-200 space-y-2">
              <li>Relevés terrain réalisés en Guadeloupe (janvier 2026).</li>
              <li>Prix TTC observés en rayons pour un panier alimentaire de base.</li>
              <li>
                Pas de projections ni de moyennes nationales : chaque prix correspond à une
                étiquette vérifiée.
              </li>
              <li>Source déclarée : lien public explicitement indiqué sur la page Observatoire.</li>
            </ul>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Fréquence de mise à jour</h2>
            <ul className="list-disc list-inside text-slate-200 space-y-2">
              <li>Mise à jour manuelle mensuelle (périodicité minimale assurée).</li>
              <li>
                Nouvelle version publiée dans le dossier{' '}
                <code className="bg-slate-800 px-1 rounded">public/data/observatoire</code>.
              </li>
              <li>Date et périmètre toujours affichés pour éviter toute ambiguïté.</li>
            </ul>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Limites actuelles</h2>
            <ul className="list-disc list-inside text-slate-200 space-y-2">
              <li>Périmètre restreint à quatre produits essentiels (panier de base).</li>
              <li>
                Un seul territoire couvert : Guadeloupe. Les autres territoires seront ajoutés
                progressivement.
              </li>
              <li>
                Échantillon réduit : premiers relevés expérimentaux, susceptibles d&apos;évoluer.
              </li>
              <li>Aucune donnée utilisateur collectée pour cette publication.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
