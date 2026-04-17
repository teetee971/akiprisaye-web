import { CheckCircle2, Clock3, Database, FileText, Mail, ShieldCheck } from 'lucide-react';
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
  {
    id: 'compareur-public',
    text: 'Consultation libre du comparateur sans obligation de compte pour découvrir le service.',
  },
  {
    id: 'pages-publiques',
    text: 'Page méthodologie, observatoire et pages explicatives accessibles publiquement.',
  },
  {
    id: 'statut-produit',
    text: 'Communication explicite sur ce qui est disponible maintenant vs. ce qui reste en préparation.',
  },
];

const IN_PROGRESS: StatusItem[] = [
  { id: 'open-data-enrichi', text: 'Open data enrichi avec exports mieux documentés.' },
  {
    id: 'couverture-etendue',
    text: 'Couverture plus large des territoires et des catégories suivies.',
  },
  {
    id: 'historique-profond',
    text: 'Historique de données plus profond et plus lisible pour le grand public.',
  },
];

const PRIVACY_COMMITMENTS: StatusItem[] = [
  { id: 'pas-de-vente', text: 'Pas de vente de données personnelles.' },
  {
    id: 'pas-d-ambigui-te',
    text: 'Pas d’ambiguïté entre page de confidentialité et page de transparence produit.',
  },
  {
    id: 'beta-visible',
    text: 'Signalement visible lorsqu’une fonctionnalité est en bêta, limitée ou en préparation.',
  },
];

function StatusCard({ title, icon, items, tone = 'neutral' }: StatusCardProps) {
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
            <span
              className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-80"
              aria-hidden="true"
            />
            <span>{item.text}</span>
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
              Cette page explique simplement ce qui est disponible maintenant, ce qui est encore en
              cours de déploiement, et comment nous traitons la confidentialité.
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
                  Un visiteur doit pouvoir distinguer en quelques secondes ce qui relève de la
                  promesse produit, de la couverture réelle et des engagements de confidentialité.
                  Nous avons donc séparé ici les statuts “disponible”, “en préparation” et
                  “engagements”.
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
                  Quand un chiffre ou une couverture territoriale est affiché, il doit idéalement
                  être accompagné d’un contexte : date, source, périmètre et niveau de maturité.
                  Notre objectif est d’aller vers cette lecture la plus explicite possible sur les
                  pages publiques.
                </p>
                <p>
                  Si une fonctionnalité est encore en test ou seulement partiellement activée, nous
                  préférons l’indiquer clairement plutôt que de la présenter comme totalement
                  finalisée.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold text-white">En pratique</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-medium text-white">Comparateur &amp; découverte</p>
                  <p className="mt-1 text-slate-400">
                    Accessible publiquement pour comprendre la proposition de valeur.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-medium text-white">Pages de confiance</p>
                  <p className="mt-1 text-slate-400">
                    Méthodologie, transparence et contact doivent rester cohérents entre eux.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-medium text-white">Open data</p>
                  <p className="mt-1 text-slate-400">
                    Présenté comme un chantier progressif, pas comme une promesse déjà totalement
                    livrée.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* RGPD — Données personnelles */}
          <section
            className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
            aria-labelledby="rgpd-title"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-violet-950/70 p-2 text-violet-300">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 id="rgpd-title" className="text-lg font-semibold text-white">
                Données personnelles &amp; RGPD
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Durée de conservation */}
              <div className="space-y-3 text-sm leading-6 text-slate-300">
                <h3 className="font-semibold text-white">Durée de conservation</h3>
                <ul className="space-y-2">
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 opacity-80"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-slate-200">Compte utilisateur :</strong> données
                      conservées jusqu'à suppression du compte ou 3 ans d'inactivité.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 opacity-80"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-slate-200">Signalements de prix :</strong> données
                      pseudonymisées et conservées 24 mois maximum.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 opacity-80"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-slate-200">Historiques de scan :</strong> stockés
                      localement (localStorage) — supprimés à la désinscription ou à la demande.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400 opacity-80"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-slate-200">Logs d'accès :</strong> conservés 12 mois
                      maximum à des fins de sécurité et de débogage.
                    </span>
                  </li>
                </ul>
              </div>

              {/* DPO & exercice des droits */}
              <div className="space-y-3 text-sm leading-6 text-slate-300">
                <h3 className="font-semibold text-white">Vos droits &amp; contact DPO</h3>
                <p>
                  Conformément au RGPD (articles 15 à 22), vous disposez d'un droit d'accès, de
                  rectification, d'effacement, de portabilité et d'opposition au traitement de vos
                  données personnelles.
                </p>
                <p>
                  Pour exercer vos droits ou contacter notre délégué·e à la protection des données
                  (DPO), adressez votre demande à :
                </p>
                <a
                  href="mailto:contact@akiprisaye.re"
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-700/50 bg-violet-950/40 px-4 py-2.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  aria-label="Envoyer un email au DPO — contact@akiprisaye.re"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  contact@akiprisaye.re
                </a>
                <p className="text-xs text-slate-400">
                  Réponse sous 30 jours. En cas de non-réponse, vous pouvez saisir la{' '}
                  <a
                    href="https://www.cnil.fr/fr/plaintes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-slate-300"
                  >
                    CNIL
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
