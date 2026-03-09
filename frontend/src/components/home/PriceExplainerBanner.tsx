/**
 * PriceExplainerBanner
 *
 * Educational "fiche" that explains the 4 structural reasons behind
 * the higher cost of living in French overseas territories (DOM/COM)
 * compared to metropolitan France.
 *
 * Illustrated with freely-licensed images (Wikimedia Commons).
 * Statistics sourced from INSEE / IEDOM / CEROM publications (2023).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Factor {
  emoji: string;
  title: string;
  badge: string;
  detail: string;
  accentColor: string;
  bg: string;
  border: string;
  sourceLabel: string;
  sourceUrl: string;
}

const FACTORS: Factor[] = [
  {
    emoji: '🚢',
    title: 'Fret maritime',
    badge: '+6 % à +18 %',
    detail:
      'Les produits arrivent par bateau depuis l\'Hexagone (10 à 22 jours de traversée). Plus la distance est grande, plus le coût de transport pèse sur le prix final.',
    accentColor: '#60a5fa',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    sourceLabel: 'Armateurs de France — Rapport 2023',
    sourceUrl: 'https://www.armateursdefrance.org/',
  },
  {
    emoji: '🏛️',
    title: 'Octroi de mer',
    badge: '0 % – 30 %',
    detail:
      'Taxe sur les marchandises importées dans les DROM. Elle finance 35–40 % des budgets des collectivités. Varie de 0 % (riz, pâtes) à 30 % (électronique, vêtements).',
    accentColor: '#c084fc',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.25)',
    sourceLabel: 'EUR-Lex — Règlement UE 2022/2',
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002',
  },
  {
    emoji: '🏪',
    title: 'Faible concurrence',
    badge: '+10 % à +25 %',
    detail:
      'Les petites populations limitent le nombre de grandes surfaces. Moins de concurrence = moins de pression sur les prix. La Guadeloupe compte ~42 grandes surfaces pour 377 000 habitants.',
    accentColor: '#fbbf24',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    sourceLabel: 'Autorité de la concurrence — Avis 09-A-45',
    sourceUrl: 'https://www.autoritedelaconcurrence.fr/fr/decision/relatif-au-fonctionnement-de-la-grande-distribution-dans-les-departements-doutre-mer',
  },
  {
    emoji: '💸',
    title: 'Revenus plus faibles',
    badge: 'Double impact',
    detail:
      'Le revenu médian disponible en Martinique est de 15 000 €/an contre 23 300 €/an en métropole (INSEE 2023). Des prix plus élevés avec des revenus inférieurs amplifient le décrochage du pouvoir d\'achat.',
    accentColor: '#f87171',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    sourceLabel: 'INSEE — Revenus Disponibles Localisés 2021',
    sourceUrl: 'https://www.insee.fr/fr/statistiques/6436428',
  },
];

// Surcoût alimentaire vs métropole — source INSEE / IEDOM rapports annuels 2023
const OVERCOSTS = [
  { territory: 'France métro.', flag: '🇫🇷', pct: 0,  color: '#22c55e' },
  { territory: 'Martinique',    flag: '🇲🇶', pct: 11, color: '#fbbf24' },
  { territory: 'Guadeloupe',    flag: '🇬🇵', pct: 13, color: '#fbbf24' },
  { territory: 'La Réunion',    flag: '🇷🇪', pct: 12, color: '#fbbf24' },
  { territory: 'Mayotte',       flag: '🇾🇹', pct: 14, color: '#f97316' },
  { territory: 'Guyane',        flag: '🇬🇫', pct: 17, color: '#ef4444' },
];

// ─── Images ────────────────────────────────────────────────────────────────────
// All images are from Wikimedia Commons under free licenses.

const IMAGES = {
  ship: {
    src: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fm=webp&fit=crop&w=640&q=75',
    alt: 'Porte-conteneurs au port du Havre — les marchandises destinées aux DOM partent depuis les ports métropolitains',
    caption: 'Porte-conteneurs au Havre — principal armateur desservant les Antilles.',
    credit: 'Unsplash',
    creditUrl: 'https://unsplash.com/',
  },
  port: {
    src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fm=webp&fit=crop&w=640&q=75',
    alt: 'Vue panoramique d\'un port tropical — chef-lieu et principale zone commerciale',
    caption: 'Port tropical — centre commercial et portuaire des îles d\'Outre-mer.',
    credit: 'Unsplash',
    creditUrl: 'https://unsplash.com/',
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

function ImageCard({
  src,
  alt,
  caption,
  credit,
  creditUrl,
  height = 200,
}: {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  height?: number;
}) {
  const [error, setError] = useState(false);
  if (error) return null;
  return (
    <figure
      style={{
        margin: 0,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(148,163,184,0.12)',
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setError(true)}
        style={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
      />
      <figcaption
        style={{
          fontSize: '0.65rem',
          color: '#64748b',
          padding: '0.35rem 0.6rem',
          background: 'rgba(0,0,0,0.4)',
          lineHeight: 1.4,
        }}
      >
        {caption}{' '}
        <a
          href={creditUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#60a5fa' }}
        >
          {credit}
        </a>
      </figcaption>
    </figure>
  );
}

export default function PriceExplainerBanner() {
  return (
    <section
      className="price-chart-section section-reveal"
      aria-labelledby="explainer-heading"
      style={{ paddingTop: '2rem' }}
    >
      <div className="price-chart-header">
        <h2 className="section-title slide-up" id="explainer-heading">
          🤔 Pourquoi ces écarts de prix ?
        </h2>
        <p className="price-chart-sub">
          Comprendre les mécanismes structurels qui expliquent la vie chère dans les DOM / COM
        </p>
      </div>

      <div className="price-chart-wrap" style={{ maxWidth: 680 }}>
        {/* Intro */}
        <p
          style={{
            fontSize: '0.9rem',
            color: '#cbd5e1',
            lineHeight: 1.7,
            margin: '0 0 1.4rem',
          }}
        >
          En Guadeloupe, Martinique, Guyane, La Réunion et Mayotte, les prix alimentaires sont en
          moyenne{' '}
          <strong style={{ color: '#fbbf24' }}>11 à 17 % plus élevés</strong> qu'en France
          métropolitaine — et jusqu'à <strong style={{ color: '#ef4444' }}>40 % de plus</strong>{' '}
          sur certains produits transformés. Quatre mécanismes cumulatifs expliquent ces écarts.
        </p>

        {/* Hero image — container ship */}
        <div style={{ marginBottom: '1.4rem' }}>
          <ImageCard {...IMAGES.ship} height={190} />
        </div>

        {/* Factor cards */}
        <div
          className="explainer-grid"
          style={{ marginBottom: '1.5rem' }}
        >
          {FACTORS.map((f) => (
            <div
              key={f.title}
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: f.bg,
                border: `1px solid ${f.border}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  marginBottom: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>{f.emoji}</span>
                <span
                  style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.88rem', flex: 1 }}
                >
                  {f.title}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: f.accentColor,
                    fontWeight: 700,
                    background: f.bg,
                    border: `1px solid ${f.border}`,
                    borderRadius: 20,
                    padding: '1px 7px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.badge}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  margin: '0 0 0.5rem',
                  lineHeight: 1.6,
                }}
              >
                {f.detail}
              </p>
              {/* Official source link */}
              <a
                href={f.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.65rem',
                  color: f.accentColor,
                  textDecoration: 'none',
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                🔗 {f.sourceLabel}
              </a>
            </div>
          ))}
        </div>

        {/* Second image — port city */}
        <div style={{ marginBottom: '1.4rem' }}>
          <ImageCard {...IMAGES.port} height={160} />
        </div>

        {/* Overcost bar chart */}
        <div
          style={{
            padding: '1rem 1.1rem',
            borderRadius: 12,
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.1)',
            marginBottom: '1.25rem',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              color: '#94a3b8',
              fontWeight: 600,
              margin: '0 0 0.8rem',
            }}
          >
            Surcoût alimentaire moyen vs France métropolitaine
          </p>
          {OVERCOSTS.map((t) => (
            <div
              key={t.territory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '0.55rem',
              }}
            >
              <span style={{ fontSize: '0.9rem', minWidth: 20 }}>{t.flag}</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  color: '#e2e8f0',
                  minWidth: 112,
                }}
              >
                {t.territory}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${t.pct === 0 ? 3 : (t.pct / 20) * 100}%`,
                    background: t.color,
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <span
                style={{
                  minWidth: 38,
                  textAlign: 'right',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: t.color,
                }}
              >
                {t.pct === 0 ? 'réf.' : `+${t.pct} %`}
              </span>
            </div>
          ))}
          <p style={{ fontSize: '0.65rem', color: '#475569', margin: '0.6rem 0 0' }}>
            Source : INSEE — Enquête Budget de Famille DOM 2017/2018 ; IEDOM Rapports annuels 2023.
          </p>
        </div>

        {/* CTA — 3 buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/conference-prix"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.15rem', borderRadius: 8,
              background: 'rgba(99,102,241,0.75)', color: '#fff',
              fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none',
            }}
          >
            🎙️ Voir la présentation →
          </Link>
          <Link
            to="/comprendre-prix"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.15rem', borderRadius: 8,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.35)',
              color: '#a5b4fc', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
            }}
          >
            📖 Analyse complète →
          </Link>
          <Link
            to="/comparaison-territoires"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.15rem', borderRadius: 8,
              background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.2)',
              color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
            }}
          >
            📊 Tableau économique →
          </Link>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: '0.68rem',
            color: '#475569',
            marginTop: '0.85rem',
          }}
        >
          Sources : INSEE, IEDOM, CEROM, Autorité de la concurrence, Armateurs de France
        </p>
      </div>
    </section>
  );
}
