import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const territoiresCouverts = [
  'Guadeloupe — périmètre pilote construit avec des relevés citoyens et des données publiques.',
  'Martinique — relevés ponctuels vérifiés manuellement avant publication.',
];

const territoiresNonCouverts = [
  'Guyane, La Réunion, Mayotte',
  'Saint-Martin, Saint-Barthélemy',
  'Polynésie française, Nouvelle-Calédonie, Wallis-et-Futuna',
  'Métropole et autres territoires non listés',
];

const prochainesEtapes = [
  'Extension progressive après validation publique des premiers relevés.',
  'Publication hebdomadaire d’un fichier CSV contrôlé, par territoire.',
  'Intégration des partenaires terrain lorsque la qualité est vérifiée.',
];

export default function Perimetre() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <HeroImage
          src={PAGE_HERO_IMAGES.perimetre}
          alt="Périmètre géographique"
          gradient="from-slate-950 to-blue-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🗺️ Périmètre géographique
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            Territoires et zones couverts par la plateforme
          </p>
        </HeroImage>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Territoires couverts</h2>
          </div>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            {territoiresCouverts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-400">
            Données vérifiées manuellement, mises en ligne sur un périmètre défini pour garantir la
            fiabilité avant extension.
          </p>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Territoires non couverts</h2>
          </div>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            {territoiresNonCouverts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-400">
            Ces zones ne sont pas incluses dans les fichiers publics. Toute extension fera
            l&apos;objet d&apos;une publication dédiée, sans engagement automatique.
          </p>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-white">Justification méthodologique</h2>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            <li>
              Priorité aux données publiques sourcées et aux relevés citoyens facilement
              vérifiables.
            </li>
            <li>
              Périmètre volontairement limité pour éviter toute confusion sur la couverture réelle.
            </li>
            <li>
              Pas d&apos;API ni de collecte automatique : chaque jeu de données est contrôlé avant
              diffusion.
            </li>
            <li>
              Clarification systématique du territoire, de la date et de la source sur chaque
              publication.
            </li>
          </ul>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-white">Ce qui arrive plus tard</h2>
          </div>
          <ul className="list-disc list-inside text-slate-200 space-y-2">
            {prochainesEtapes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section
          className="bg-slate-900 border border-amber-500/60 rounded-2xl p-6 space-y-2"
          role="note"
          aria-label="Données non exhaustives"
        >
          <h2 className="text-xl font-semibold text-white">Données non exhaustives</h2>
          <p className="text-slate-200">
            Les fichiers publiés reflètent uniquement les relevés disponibles sur le périmètre
            ci-dessus. Ils ne couvrent pas l&apos;ensemble des commerces ni des territoires et ne
            constituent pas une base officielle. Chaque jeu de données indique clairement son champ
            exact et ses limites.
          </p>
        </section>
      </div>
    </div>
  );
}
