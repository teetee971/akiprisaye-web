import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
export default function Gouvernance() {
  return (
    <>
      <SEOHead
        title="Gouvernance — A KI PRI SA YÉ"
        description="Structure de gouvernance, membres fondateurs et principes de fonctionnement de l'observatoire citoyen des prix ultramarins."
        canonical="https://teetee971.github.io/akiprisaye-web/gouvernance"
      />
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <HeroImage
          src={PAGE_HERO_IMAGES.gouvernance}
          alt="Gouvernance"
          gradient="from-slate-950 to-slate-800"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            ⚖️ Gouvernance
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            Principes de gouvernance et éthique de la plateforme
          </p>
        </HeroImage>

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
    </>
  );
}
