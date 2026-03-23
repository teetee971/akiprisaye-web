import { CheckCircle2, Clock3, Database, FileText, ShieldCheck } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { SEOHead } from '../components/ui/SEOHead';

type StatusTone = 'neutral' | 'success' | 'warning';

type StatusItem = {
  id: string;
  text: string;
};

type StatusCardProps = {
  title: string;
  icon: React.ReactNode;
  items: StatusItem[];
  tone?: StatusTone;
};

const AVAILABLE_NOW: StatusItem[] = [
  { id: 'compareur-public', text: 'Consultation libre du comparateur sans obligation de compte pour découvrir le service.' },
  { id: 'pages-publiques', text: 'Page méthodologie, observatoire et pages explicatives accessibles publiquement.' },
  { id: 'statut-produit', text: 'Communication explicite sur ce qui est disponible maintenant vs. ce qui reste en préparation.' },
];

const IN_PROGRESS: StatusItem[] = [
  { id: 'open-data-enrichi', text: 'Open data enrichi avec exports mieux documentés.' },
  { id: 'couverture-etendue', text: 'Couverture plus large des territoires et des catégories suivies.' },
  { id: 'historique-profond', text: 'Historique de données plus profond et plus lisible pour le grand public.' },
];

const PRIVACY_COMMITMENTS: StatusItem[] = [
  { id: 'pas-de-vente', text: 'Pas de vente de données personnelles.' },
  { id: 'pas-d-ambigui-te', text: 'Pas d’ambiguïté entre page de confidentialité et page de transparence produit.' },
  { id: 'beta-visible', text: 'Signalement visible lorsqu’une fonctionnalité est en bêta, limitée ou en préparation.' },
const AVAILABLE_NOW = [
  'Consultation libre du comparateur sans obligation de compte pour découvrir le service.',
  'Page méthodologie, observatoire et pages explicatives accessibles publiquement.',
  'Communication explicite sur ce qui est disponible maintenant vs. ce qui reste en préparation.',
];

const IN_PROGRESS = [
  'Open data enrichi avec exports mieux documentés.',
  'Couverture plus large des territoires et des catégories suivies.',
  'Historique de données plus profond et plus lisible pour le grand public.',
];

const PRIVACY_COMMITMENTS = [
  'Pas de vente de données personnelles.',
  'Pas d’ambiguïté entre page de confidentialité et page de transparence produit.',
  'Signalement visible lorsqu’une fonctionnalité est en bêta, limitée ou en préparation.',
];

function StatusCard({
  title,
  icon,
  items,
  tone = 'neutral',
}: StatusCardProps) {
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  tone?: 'neutral' | 'success' | 'warning';
}) {
  const tones = {
    neutral: 'border-slate-800 bg-slate-900/80',
    success: 'border-emerald-800/60 bg-emerald-950/30',
    warning: 'border-amber-800/60 bg-amber-950/30',
  };

  return (
    <section className={`rounded-2xl border p-6 ${tones[tone]}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-black/20 p-2 text-white">{icon}</div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <ul className="space-y-3 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            <span>{item.text}</span>
          <li key={item} className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Transparence() {
  return (
    <>
      <SEOHead
        title="Transparence — ce qui existe aujourd’hui, ce qui arrive ensuite"
        description="Comprenez clairement ce qu’A KI PRI SA YÉ propose déjà, ce qui est en cours de déploiement et nos engagements de confidentialité."
        canonical="https://teetee971.github.io/akiprisaye-web/transparence"
      />

      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <HeroImage
            src={PAGE_HERO_IMAGES.transparence}
            alt="Transparence et confiance"
            gradient="from-slate-950 to-slate-800"
            height="h-44 sm:h-56"
          >
            <h1 className="text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
              🔎 Transparence
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 drop-shadow sm:text-base">
              Cette page explique simplement ce qui est disponible maintenant, ce qui est encore en cours de
              déploiement, et comment nous traitons la confidentialité.
            </p>
          </HeroImage>

          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-950/70 p-2 text-blue-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Pourquoi cette page existe</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Un visiteur doit pouvoir distinguer en quelques secondes ce qui relève de la promesse produit, de la
                  couverture réelle et des engagements de confidentialité. Nous avons donc séparé ici les statuts
                  “disponible”, “en préparation” et “engagements”.
                </p>
              </div>
            </div>
          </section>


      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <HeroImage
            src={PAGE_HERO_IMAGES.transparence}
            alt="Transparence et confiance"
            gradient="from-slate-950 to-slate-800"
            height="h-44 sm:h-56"
          >
            <h1 className="text-3xl font-extrabold text-white drop-shadow sm:text-4xl">
              🔎 Transparence
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 drop-shadow sm:text-base">
              Cette page explique simplement ce qui est disponible maintenant, ce qui est encore en cours de
              déploiement, et comment nous traitons la confidentialité.
            </p>
          </HeroImage>

          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-950/70 p-2 text-blue-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Pourquoi cette page existe</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Un visiteur doit pouvoir distinguer en quelques secondes ce qui relève de la promesse produit, de la
                  couverture réelle et des engagements de confidentialité. Nous avons donc séparé ici les statuts
                  “disponible”, “en préparation” et “engagements”.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <StatusCard
              title="Disponible aujourd’hui"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden="true" />}
              items={AVAILABLE_NOW}
              tone="success"
            />
            <StatusCard
              title="En préparation"
              icon={<Clock3 className="h-5 w-5 text-amber-300" aria-hidden="true" />}
              items={IN_PROGRESS}
              tone="warning"
            />
            <StatusCard
              title="Confidentialité"
              icon={<ShieldCheck className="h-5 w-5 text-cyan-300" aria-hidden="true" />}
              items={PRIVACY_COMMITMENTS}
            />
          </div>

          <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-emerald-950/70 p-2 text-emerald-300">
                  <Database className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-white">Comment lire nos données</h2>
              </div>
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <p>
                  Quand un chiffre ou une couverture territoriale est affiché, il doit idéalement être accompagné d’un
                  contexte : date, source, périmètre et niveau de maturité. Notre objectif est d’aller vers cette
                  lecture la plus explicite possible sur les pages publiques.
                </p>
                <p>
                  Si une fonctionnalité est encore en test ou seulement partiellement activée, nous préférons l’indiquer
                  clairement plutôt que de la présenter comme totalement finalisée.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold text-white">En pratique</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-medium text-white">Comparateur &amp; découverte</p>
                  <p className="mt-1 text-slate-400">Accessible publiquement pour comprendre la proposition de valeur.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-medium text-white">Pages de confiance</p>
                  <p className="mt-1 text-slate-400">Méthodologie, transparence et contact doivent rester cohérents entre eux.</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-medium text-white">Open data</p>
                  <p className="mt-1 text-slate-400">Présenté comme un chantier progressif, pas comme une promesse déjà totalement livrée.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
