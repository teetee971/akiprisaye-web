/**
 * AnalyseConcurrence — Tableau d'analyse concurrentielle
 *
 * Page transparente montrant la position d'A KI PRI SA YÉ face aux concurrents,
 * ce qu'ils ont que nous n'avions pas, ce que nous avons d'unique,
 * et ce qui a été intégré suite à cette analyse.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Data ──────────────────────────────────────────────────────────────────────

interface Feature {
  id: string;
  label: string;
  category: string;
  kiprix: boolean | 'partial';
  kosto: boolean | 'partial';
  circl: boolean | 'partial';
  shopmium: boolean | 'partial';
  nous: boolean | 'partial' | 'unique';
  route?: string;
  nouveau?: boolean;
}

const FEATURES: Feature[] = [
  // ── Comparaison de prix ──
  {
    id: 'comp-dom-metro',
    label: 'Comparaison prix DOM vs métropole',
    category: 'Comparaison',
    kiprix: true,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: true,
  },
  {
    id: 'comp-dom-dom',
    label: 'Comparaison DOM vs DOM (multi-territ.)',
    category: 'Comparaison',
    kiprix: 'partial',
    kosto: false,
    circl: false,
    shopmium: false,
    nous: true,
  },
  {
    id: 'panier-comp',
    label: 'Comparaison de panier multi-enseignes',
    category: 'Comparaison',
    kiprix: false,
    kosto: true,
    circl: true,
    shopmium: false,
    nous: true,
  },
  {
    id: 'histo-prix',
    label: "Historique d'évolution des prix",
    category: 'Comparaison',
    kiprix: true,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: true,
  },
  {
    id: 'alertes-prix',
    label: 'Alertes de prix personnalisées',
    category: 'Comparaison',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: true,
  },

  // ── Scan & identification ──
  {
    id: 'scan-ean',
    label: 'Scan code-barres EAN',
    category: 'Scan',
    kiprix: true,
    kosto: false,
    circl: false,
    shopmium: true,
    nous: true,
  },
  {
    id: 'scan-ocr',
    label: "OCR d'étiquette / ticket de caisse",
    category: 'Scan',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: 'partial',
    nous: true,
  },
  {
    id: 'nutri',
    label: 'Nutri-Score & analyse nutritionnelle',
    category: 'Scan',
    kiprix: false,
    kosto: 'partial',
    circl: false,
    shopmium: false,
    nous: true,
    route: '/analyse-nutri',
    nouveau: true,
  },

  // ── Budget & planification ──
  {
    id: 'simulateur',
    label: 'Simulateur budgétaire familial DOM',
    category: 'Budget',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/simulateur-budget',
    nouveau: true,
  },
  {
    id: 'planif-repas',
    label: 'Planificateur de repas + liste auto',
    category: 'Budget',
    kiprix: false,
    kosto: true,
    circl: 'partial',
    shopmium: false,
    nous: true,
    route: '/planificateur-repas',
    nouveau: true,
  },
  {
    id: 'liste-courses',
    label: 'Liste de courses intelligente',
    category: 'Budget',
    kiprix: false,
    kosto: true,
    circl: true,
    shopmium: false,
    nous: true,
  },
  {
    id: 'rapport-pdf',
    label: 'Rapport PDF exportable',
    category: 'Budget',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/rapport-citoyen',
    nouveau: true,
  },

  // ── Anti-gaspi ──
  {
    id: 'dlc',
    label: 'Tracker DLC / anti-gaspillage',
    category: 'Anti-gaspi',
    kiprix: false,
    kosto: false,
    circl: true,
    shopmium: false,
    nous: true,
    route: '/dlc-antigaspi',
    nouveau: true,
  },

  // ── Civic & éducation ──
  {
    id: 'conference',
    label: 'Conférence éducative sur la vie chère',
    category: 'Éducation',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/conference-prix',
  },
  {
    id: 'calculateur-octroi',
    label: "Calculateur de l'octroi de mer",
    category: 'Éducation',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/calculateur-octroi',
    nouveau: true,
  },
  {
    id: 'lettre-hebdo',
    label: "Lettre d'actualité IA hebdomadaire",
    category: 'Éducation',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/lettre-hebdo',
  },
  {
    id: 'reclamation',
    label: 'Générateur de lettre de réclamation',
    category: 'Éducation',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/ia-reclamation',
    nouveau: true,
  },
  {
    id: 'rupture',
    label: 'Signalement ruptures de stock',
    category: 'Éducation',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
    route: '/alertes-rupture',
    nouveau: true,
  },

  // ── Gamification ──
  {
    id: 'badges',
    label: 'Badges & récompenses citoyens',
    category: 'Communauté',
    kiprix: 'partial',
    kosto: false,
    circl: false,
    shopmium: true,
    nous: true,
  },
  {
    id: 'contribution',
    label: 'Contribution citoyenne des prix',
    category: 'Communauté',
    kiprix: true,
    kosto: false,
    circl: true,
    shopmium: false,
    nous: true,
  },
  {
    id: 'groupes-parole',
    label: 'Groupes de parole citoyens',
    category: 'Communauté',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: false,
    nous: 'unique',
  },

  // ── Cashback (pas encore) ──
  {
    id: 'cashback',
    label: 'Cashback / remboursement courses',
    category: 'Cashback',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: true,
    nous: false,
  },
  {
    id: 'coupons',
    label: 'Coupons de réduction',
    category: 'Cashback',
    kiprix: false,
    kosto: false,
    circl: false,
    shopmium: true,
    nous: false,
  },
];

const CATEGORIES = [...new Set(FEATURES.map((f) => f.category))];

const COMPETITORS = [
  {
    id: 'kiprix',
    label: 'Kiprix',
    url: 'https://www.kiprix.com/',
    desc: 'Comparateur DOM spécialisé',
    flag: '🔴',
  },
  {
    id: 'kosto',
    label: 'Kosto',
    url: 'https://kostoapp.fr/',
    desc: 'Planificateur repas + IA',
    flag: '🟠',
  },
  {
    id: 'circl',
    label: 'Circl',
    url: 'https://www.circl.app/',
    desc: 'Comparateur anti-gaspi',
    flag: '🟡',
  },
  {
    id: 'shopmium',
    label: 'Shopmium',
    url: 'https://www.shopmium.com/fr/',
    desc: 'Cashback courses',
    flag: '🟢',
  },
];

function StatusIcon({ v }: { v: boolean | 'partial' | 'unique' }) {
  if (v === true) return <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>✅</span>;
  if (v === 'unique') return <span style={{ color: '#6366f1', fontSize: '0.85rem' }}>🏆</span>;
  if (v === 'partial') return <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>🟡</span>;
  return <span style={{ color: '#475569', fontSize: '0.85rem' }}>—</span>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AnalyseConcurrence() {
  const [activeCategory, setActiveCategory] = useState<string>('tout');

  const displayed =
    activeCategory === 'tout' ? FEATURES : FEATURES.filter((f) => f.category === activeCategory);

  const totals = {
    nous: FEATURES.filter((f) => f.nous === true || f.nous === 'unique').length,
    unique: FEATURES.filter((f) => f.nous === 'unique').length,
    kiprix: FEATURES.filter((f) => f.kiprix === true || f.kiprix === 'partial').length,
    kosto: FEATURES.filter((f) => f.kosto === true || f.kosto === 'partial').length,
    circl: FEATURES.filter((f) => f.circl === true || f.circl === 'partial').length,
    shopmium: FEATURES.filter((f) => f.shopmium === true || f.shopmium === 'partial').length,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '1.5rem 1rem 3rem',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to="/innovation-lab"
            style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}
          >
            ← Innovation Lab
          </Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.analyseConcurrence}
          alt="Analyse concurrentielle"
          gradient="from-slate-950 to-indigo-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🔭 Analyse concurrentielle
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            Ce que nos concurrents font — et ce qu'on a intégré en réponse
          </p>
        </HeroImage>

        {/* Competitor cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          {COMPETITORS.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.3rem',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{c.flag}</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: '#e2e8f0',
                    textDecoration: 'none',
                  }}
                >
                  {c.label}
                </a>
              </div>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', color: '#64748b' }}>{c.desc}</p>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1' }}>
                {
                  FEATURES.filter(
                    (f) =>
                      (f as unknown as Record<string, unknown>)[c.id] === true ||
                      (f as unknown as Record<string, unknown>)[c.id] === 'partial'
                  ).length
                }{' '}
                fonctionnalités
              </div>
            </div>
          ))}
        </div>

        {/* Our score vs competitors */}
        <div
          style={{
            padding: '1.1rem 1.3rem',
            borderRadius: 14,
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              margin: '0 0 0.75rem',
              fontSize: '0.78rem',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Score fonctionnel sur {FEATURES.length} fonctionnalités analysées
          </p>
          {[
            {
              label: '🏆 A KI PRI SA YÉ',
              value: totals.nous,
              max: FEATURES.length,
              color: '#6366f1',
              bold: true,
            },
            { label: '🔴 Kiprix', value: totals.kiprix, max: FEATURES.length, color: '#ef4444' },
            { label: '🟠 Kosto', value: totals.kosto, max: FEATURES.length, color: '#f97316' },
            { label: '🟡 Circl', value: totals.circl, max: FEATURES.length, color: '#fbbf24' },
            {
              label: '🟢 Shopmium',
              value: totals.shopmium,
              max: FEATURES.length,
              color: '#22c55e',
            },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: '0.55rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.2rem',
                }}
              >
                <span
                  style={{
                    fontSize: row.bold ? '0.82rem' : '0.78rem',
                    fontWeight: row.bold ? 800 : 400,
                    color: row.bold ? '#e2e8f0' : '#94a3b8',
                  }}
                >
                  {row.label}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: row.color }}>
                  {row.value}/{row.max}
                </span>
              </div>
              <div
                style={{
                  height: row.bold ? 10 : 7,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(row.value / row.max) * 100}%`,
                    background: row.color,
                    borderRadius: 6,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          ))}
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.68rem', color: '#475569' }}>
            🏆{' '}
            <strong style={{ color: '#a5b4fc' }}>{totals.unique} fonctionnalités exclusives</strong>{' '}
            non présentes chez les concurrents
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '0.85rem',
            fontSize: '0.72rem',
            color: '#64748b',
          }}
        >
          <span>✅ Disponible</span>
          <span>🟡 Partiel</span>
          <span>— Absent</span>
          <span>🏆 Exclusif A KI PRI SA YÉ</span>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>🆕 Nouveau</span>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['tout', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: 20,
                border: `1px solid ${activeCategory === cat ? 'rgba(99,102,241,0.5)' : 'rgba(148,163,184,0.2)'}`,
                background: activeCategory === cat ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: activeCategory === cat ? '#a5b4fc' : '#64748b',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              {cat === 'tout' ? 'Toutes' : cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.9)' }}>
                <th
                  style={{
                    padding: '0.65rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.72rem',
                    color: '#64748b',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    minWidth: 180,
                  }}
                >
                  Fonctionnalité
                </th>
                <th
                  style={{
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: '#ef4444',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    width: 60,
                  }}
                >
                  🔴 Kiprix
                </th>
                <th
                  style={{
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: '#f97316',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    width: 60,
                  }}
                >
                  🟠 Kosto
                </th>
                <th
                  style={{
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: '#fbbf24',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    width: 60,
                  }}
                >
                  🟡 Circl
                </th>
                <th
                  style={{
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: '#22c55e',
                    fontWeight: 600,
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    width: 70,
                  }}
                >
                  🟢 Shopmium
                </th>
                <th
                  style={{
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: '#a5b4fc',
                    fontWeight: 700,
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    width: 80,
                  }}
                >
                  🏆 Nous
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((f, i) => (
                <tr
                  key={f.id}
                  style={{
                    background: i % 2 === 0 ? 'rgba(15,23,42,0.6)' : 'rgba(30,41,59,0.4)',
                    borderBottom: '1px solid rgba(148,163,184,0.06)',
                  }}
                >
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', color: '#e2e8f0' }}>{f.label}</span>
                      {f.nouveau && (
                        <span
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 6px',
                            borderRadius: 20,
                            background: 'rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            color: '#4ade80',
                            fontWeight: 700,
                          }}
                        >
                          🆕
                        </span>
                      )}
                      {f.route && (
                        <Link
                          to={f.route}
                          style={{ fontSize: '0.6rem', color: '#6366f1', textDecoration: 'none' }}
                        >
                          Accéder →
                        </Link>
                      )}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: '0.1rem' }}>
                      {f.category}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <StatusIcon v={f.kiprix} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <StatusIcon v={f.kosto} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <StatusIcon v={f.circl} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <StatusIcon v={f.shopmium} />
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                    <StatusIcon v={f.nous} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* What's missing */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.2rem',
            borderRadius: 14,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <h2
            style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', color: '#fbbf24', fontWeight: 800 }}
          >
            🎯 Ce qui reste à intégrer (roadmap)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {FEATURES.filter((f) => f.nous === false).map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                }}
              >
                <span style={{ color: '#f59e0b' }}>◉</span>
                <span>{f.label}</span>
                <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                  (présent chez :{' '}
                  {['kiprix', 'kosto', 'circl', 'shopmium']
                    .filter(
                      (c) =>
                        (f as unknown as Record<string, unknown>)[c] === true ||
                        (f as unknown as Record<string, unknown>)[c] === 'partial'
                    )
                    .join(', ')}
                  )
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
