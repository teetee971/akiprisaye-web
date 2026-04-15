/**
 * PartnerPage.tsx — /devenir-partenaire
 *
 * B2B partnership page for retailers and brands.
 * No auth required — publicly accessible.
 *
 * Conversion goal: visitor contacts via WhatsApp or email.
 */

import { SEOHead } from '../components/ui/SEOHead';
import { SITE_URL } from '../utils/seoHelpers';
import { trackConversionEvent, getVariantForPage } from '../utils/conversionTracker';
import { useLocation } from 'react-router-dom';

const WA_NUMBER = import.meta.env.VITE_FEEDBACK_WHATSAPP ?? '';

const CONTACT_WA_URL = WA_NUMBER
  ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
      'Bonjour,\n\nJe suis intéressé par un partenariat avec A KI PRI SA YÉ pour augmenter la visibilité de mon enseigne en Guadeloupe / DOM.\n\nPouvons-nous en discuter ?',
    )}`
  : `https://wa.me/?text=${encodeURIComponent(
      'Bonjour, je souhaite devenir partenaire A KI PRI SA YÉ.',
    )}`;

const OFFERS = [
  {
    tier:  'Starter',
    price: '99€ / mois',
    desc:  'Mise en avant de votre enseigne sur les pages comparateur.',
    perks: ['Badge "Enseigne partenaire"', 'Priorité dans le classement', 'Lien direct vers votre site'],
  },
  {
    tier:  'Pro',
    price: '249€ / mois',
    desc:  'Visibilité étendue + accès aux données de tendances.',
    perks: ['Tout Starter', 'Rapport mensuel des prix', 'Top 3 garanti sur vos catégories', 'Alerte concurrents'],
  },
  {
    tier:  'Premium',
    price: 'Sur devis',
    desc:  'Données exclusives + intégration complète.',
    perks: ['Tout Pro', 'Export données prix', 'Dashboard analytique dédié', 'Accompagnement stratégique'],
  },
];

const TESTIMONIAL_STATS = [
  { value: '10 s',    label: 'Temps moyen de comparaison' },
  { value: '+1 000',  label: 'Comparaisons / semaine'     },
  { value: '4 DOM',   label: 'Territoires couverts'       },
  { value: '3',       label: 'Enseignes comparées'        },
];

export default function PartnerPage() {
  const { pathname } = useLocation();
  const variant = getVariantForPage(pathname);

  function handleContactClick(source: string) {
    trackConversionEvent({
      pageUrl:     pathname,
      retailer:    `partner-contact-${source}`,
      productName: 'b2b-lead',
      variant,
      clickedAt:   new Date().toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEOHead
        title="Devenir partenaire — A KI PRI SA YÉ"
        description="Augmentez votre visibilité locale et attirez plus de clients en Guadeloupe et dans les DOM. Offres partenaires pour enseignes et marques."
        canonical={`${SITE_URL}/devenir-partenaire`}
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center">
        <div className="mb-4 inline-block rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
          Espace Partenaires
        </div>

        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Vous êtes une enseigne&nbsp;?<br />
          <span className="text-emerald-400">Soyez vu en premier.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
          A KI PRI SA YÉ compare les prix entre Carrefour, E.Leclerc, Super U et d'autres enseignes locales.
          Chaque jour, des consommateurs décident <strong className="text-white">où faire leurs courses</strong> grâce à notre comparateur.
          Votre enseigne peut être en tête de liste.
        </p>

        <a
          href={CONTACT_WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleContactClick('hero')}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-black transition hover:bg-emerald-400"
        >
          <span>Discutons-en sur WhatsApp</span>
          <span aria-hidden="true">→</span>
        </a>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-white/[0.02] py-10">
        <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-6 px-4 sm:grid-cols-4">
          {TESTIMONIAL_STATS.map(({ value, label }) => (
            <li key={label} className="text-center">
              <div className="text-3xl font-extrabold text-emerald-400">{value}</div>
              <div className="mt-1 text-xs text-zinc-500">{label}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── VALUE PROP ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-8 text-center text-xl font-bold">
          Pourquoi être partenaire ?
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon:  '🎯',
              title: 'Clients qualifiés',
              desc:  "Nos visiteurs sont en intention d'achat immédiate — ils cherchent où acheter maintenant.",
            },
            {
              icon:  '📊',
              title:  "Données décision",
              desc:  "Accédez aux tendances des prix et aux comportements d'achat locaux.",
            },
            {
              icon:  '🏆',
              title: 'Visibilité prioritaire',
              desc:  'Votre enseigne apparaît en premier dans les résultats de comparaison.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <div className="mb-3 text-2xl">{icon}</div>
              <h3 className="mb-1 font-bold">{title}</h3>
              <p className="text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OFFERS ────────────────────────────────────────────────────────── */}
      <section className="border-t border-white/8 bg-white/[0.02] py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-xl font-bold">Nos offres</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {OFFERS.map(({ tier, price, desc, perks }) => (
              <div
                key={tier}
                className={`flex flex-col rounded-2xl border p-6 ${
                  tier === 'Pro'
                    ? 'border-emerald-400/50 bg-emerald-400/[0.06] ring-1 ring-emerald-400/20'
                    : 'border-white/8 bg-white/[0.02]'
                }`}
              >
                {tier === 'Pro' && (
                  <span className="mb-3 self-start rounded-full bg-emerald-400/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                    Recommandé
                  </span>
                )}
                <h3 className="text-lg font-bold">{tier}</h3>
                <p className="mt-1 text-2xl font-extrabold text-emerald-400">{price}</p>
                <p className="mt-2 text-sm text-zinc-400">{desc}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="mt-0.5 text-emerald-400" aria-hidden="true">✔</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <a
                  href={CONTACT_WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick(`offer-${tier.toLowerCase()}`)}
                  className={`mt-6 block rounded-xl py-3 text-center text-sm font-bold transition ${
                    tier === 'Pro'
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'border border-white/10 text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  Nous contacter
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PITCH TEXT ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="mb-4 text-xl font-bold">Notre message aux enseignes</h2>
        <blockquote className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left text-sm leading-relaxed text-zinc-300">
          <p>Bonjour,</p>
          <br />
          <p>
            Nous développons un comparateur de prix local pour la Guadeloupe et les DOM.
            Nous montrons chaque jour aux consommateurs où acheter au meilleur prix.
          </p>
          <br />
          <p>
            Nous proposons aux enseignes d'être mises en avant auprès de ces acheteurs décidés.
            C'est une visibilité ciblée — pas de la publicité générique.
          </p>
          <br />
          <p>Seriez-vous intéressé pour en discuter ?</p>
        </blockquote>

        <a
          href={CONTACT_WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleContactClick('pitch')}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-black transition hover:bg-emerald-400"
        >
          <span>Démarrer la conversation</span>
          <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}
