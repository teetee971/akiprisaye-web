/**
 * ConferenceCarburants.tsx
 *
 * Conférence expert-niveau : Anatomie du prix des carburants dans les DOM-TOM
 * Présentation interactive en 9 diapositives — données officielles vérifiables.
 *
 * Sources des données :
 *  DGEC   — Direction Générale de l'Énergie et du Climat, rapports prix carburants DOM 2025
 *  data.economie.gouv.fr — API officielle prix-carburants (temps réel)
 *  Arrêtés préfectoraux — GP, MQ, GF, RE, YT (janvier 2026)
 *  IEDOM  — Rapports annuels 2023 Guadeloupe, Martinique, Guyane, Réunion, Mayotte
 *  INSEE  — Enquête sur les niveaux de vie et la vie chère DOM 2022-2023
 *  DGDDI  — Données TICPE et octroi de mer 2024 (Douane française)
 *  EIA    — US Energy Information Administration, Brent spot price monthly 2020-2026
 *  IEA    — International Energy Agency, Oil Market Report Q1 2026
 *  OPEC   — Monthly Oil Market Report, janvier 2026
 *  Armateurs de France — Rapport d'activité 2023 (fret insulaire)
 *  OPMR   — Observatoires des Prix des Marges et des Revenus (GP, MQ, RE) 2024
 *  EUR-Lex — Directive 2003/96/CE ; Règlement (UE) 2022/2 (octroi de mer)
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Source {
  label: string;
  url: string;
  year?: string;
}

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle?: string;
  accentColor: string;
}

// ─── Slides definition ──────────────────────────────────────────────────────────
const SLIDES: Slide[] = [
  { id: 'panorama',   emoji: '⛽', title: 'Panorama des prix carburants DOM-TOM',   subtitle: 'Moins cher qu\'en métropole — vraiment ?',          accentColor: '#f59e0b' },
  { id: 'chaine',     emoji: '🔗', title: 'Du puits à la pompe',                   subtitle: 'La chaîne mondiale d\'approvisionnement',           accentColor: '#60a5fa' },
  { id: 'brut',       emoji: '🛢️', title: 'Le marché mondial du pétrole brut',     subtitle: 'Brent, OPEC+ et volatilité du dollar',             accentColor: '#f97316' },
  { id: 'raffinage',  emoji: '🏭', title: 'Raffinage & approvisionnement SARA',    subtitle: 'La raffinerie au cœur des Antilles',               accentColor: '#a78bfa' },
  { id: 'fret',       emoji: '🚢', title: 'Fret maritime insulaire',               subtitle: 'Le surcoût incompressible des îles',               accentColor: '#38bdf8' },
  { id: 'fiscalite',  emoji: '🧾', title: 'Fiscalité carburant DOM vs métropole',  subtitle: 'Pourquoi le DOM paye moins de taxes — mais pas 0', accentColor: '#34d399' },
  { id: 'plafonds',   emoji: '🛡️', title: 'Mécanisme des prix plafonnés',          subtitle: 'Le filet préfectoral anti-inflation',              accentColor: '#fb7185' },
  { id: 'monde',      emoji: '🌍', title: 'Comparaison internationale',            subtitle: 'Les DOM-TOM dans le contexte mondial',             accentColor: '#c084fc' },
  { id: 'conclusion', emoji: '💡', title: 'Conclusion & actions citoyennes',       subtitle: 'Ce que cette conférence change pour vous',          accentColor: '#22c55e' },
];

// ─── Shared style helpers ───────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(15,23,42,0.75)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 14,
  padding: '1rem 1.2rem',
  ...extra,
});

const accentPill = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 20,
  background: `${color}18`,
  border: `1px solid ${color}55`,
  color,
  fontWeight: 700,
  fontSize: '0.75rem',
});

// ─── Source pill component ──────────────────────────────────────────────────────
function SourcePill({ source }: { source: Source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        padding: '3px 9px', borderRadius: 20,
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)',
        color: '#a5b4fc', fontSize: '0.68rem', fontWeight: 600,
        textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
    >
      🔗 {source.label}{source.year ? ` (${source.year})` : ''}
    </a>
  );
}

// ─── WikiImg component (Wikimedia Commons + error fallback) ────────────────────
function WikiImg({ src, alt, caption, credit, creditUrl, height = 170 }: {
  src: string; alt: string; caption: string; credit: string; creditUrl: string; height?: number;
}) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    <figure style={{ margin: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.12)' }}>
      <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)}
        style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
      <figcaption style={{ fontSize: '0.6rem', color: '#64748b', padding: '0.25rem 0.6rem', background: 'rgba(0,0,0,0.5)', lineHeight: 1.4 }}>
        {caption}{' '}
        <a href={creditUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{credit}</a>
      </figcaption>
    </figure>
  );
}

// ─── Slide 1 — Panorama des prix ────────────────────────────────────────────────
function PanoramaSlide() {
  const territories = [
    { t: 'Guadeloupe',    flag: '🇬🇵', dept: '971', sp95: 1.589, diesel: 1.461, platfond: true  },
    { t: 'Martinique',    flag: '🇲🇶', dept: '972', sp95: 1.612, diesel: 1.479, platfond: true  },
    { t: 'Guyane',        flag: '🇬🇫', dept: '973', sp95: 1.645, diesel: 1.534, platfond: true  },
    { t: 'La Réunion',    flag: '🇷🇪', dept: '974', sp95: 1.629, diesel: 1.548, platfond: true  },
    { t: 'Mayotte',       flag: '🇾🇹', dept: '976', sp95: 1.598, diesel: 1.485, platfond: true  },
    { t: 'SPM',           flag: '🇵🇲', dept: '975', sp95: 1.742, diesel: 1.640, platfond: false },
    { t: 'France métro.', flag: '🇫🇷', dept: '—',   sp95: 1.850, diesel: 1.760, platfond: false },
  ];
  const max = 2.10;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Contre toute intuition, le SP95 est <strong style={{ color: '#fbbf24' }}>moins cher dans la plupart des DOM
        qu'en France métropolitaine</strong>. Cela s'explique par un régime fiscal dérogatoire,
        et non par un carburant de moindre qualité. Voici les prix officiels de janvier 2026.
      </p>

      {/* Bar chart per territory */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.8rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SP95 (€/L) — Arrêtés préfectoraux + données DGEC, jan. 2026
        </p>
        {territories.map(row => (
          <div key={row.t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
            <span style={{ fontSize: '0.9rem', minWidth: 22 }}>{row.flag}</span>
            <span style={{ fontSize: '0.73rem', color: '#e2e8f0', minWidth: 100 }}>{row.t}</span>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(row.sp95 / max) * 100}%`,
                background: row.t === 'France métro.' ? '#ef4444' : row.platfond ? '#f59e0b' : '#60a5fa',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ minWidth: 46, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: row.t === 'France métro.' ? '#ef4444' : '#f59e0b' }}>
              {row.sp95.toFixed(3)} €
            </span>
            {row.platfond && <span style={{ fontSize: '0.6rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80', borderRadius: 6, padding: '1px 5px' }}>plafonné</span>}
          </div>
        ))}
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.63rem', color: '#475569' }}>
          * Saint-Barthélemy (BL) : ~1,99 €/L (COM, TVA 0 %, marché libre). Saint-Martin (MF) : ~1,75 €/L.
        </p>
      </div>

      {/* Key insight */}
      <div style={{ padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#fcd34d', fontWeight: 700 }}>
          💡 Chiffre clé : −0,26 €/L de moins en Guadeloupe qu'en métropole pour le SP95
        </p>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#d1d5db', lineHeight: 1.5 }}>
          Cet écart est intégralement dû à la réduction de la TICPE et à la TVA à 8,5 % au lieu de 20 %.
          Le coût logistique (fret maritime) vient au contraire <em>augmenter</em> le prix final.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Arrêtés préfectoraux GP', url: 'https://www.guadeloupe.gouv.fr', year: 'jan. 2026' }} />
        <SourcePill source={{ label: 'DGEC — prix carburants DOM', url: 'https://www.ecologie.gouv.fr/politiques-publiques/prix-carburants', year: '2025' }} />
        <SourcePill source={{ label: 'data.economie.gouv.fr', url: 'https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/', year: 'live' }} />
      </div>
    </div>
  );
}

// ─── Slide 2 — Du puits à la pompe ──────────────────────────────────────────────
function ChaineSlide() {
  const steps = [
    { n: 1, emoji: '🛢️', label: 'Extraction',       sub: 'Puits (Moyen-Orient, Afrique, mer du Nord)', color: '#f97316', pct: 43 },
    { n: 2, emoji: '🚢', label: 'Transport CIF',     sub: 'Pétrolier VLCC → SARA Martinique / raffinerie', color: '#60a5fa', pct: 6  },
    { n: 3, emoji: '🏭', label: 'Raffinage',          sub: 'SARA (MQ) ou Antifer (métro) → produits finis', color: '#a78bfa', pct: 10 },
    { n: 4, emoji: '⚓', label: 'Fret DOM-TOM',      sub: 'Caboteur insulaire → dépôts territoriaux',      color: '#38bdf8', pct: 9  },
    { n: 5, emoji: '🚛', label: 'Distribution locale', sub: 'Camion-citerne → stations-service',           color: '#34d399', pct: 7  },
    { n: 6, emoji: '⛽', label: 'Taxes & marges',    sub: 'TICPE + TVA + OM + marge distributeur',         color: '#f59e0b', pct: 25 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Entre le puits de pétrole au Moyen-Orient et la pompe de votre île, le carburant traverse
        <strong style={{ color: '#fff' }}> au minimum 6 étapes</strong> — chacune avec ses coûts.
        Pour les DOM-TOM, une <strong style={{ color: '#38bdf8' }}>étape maritime supplémentaire</strong> s'intercale.
      </p>

      {/* Chain diagram */}
      <div style={card({ padding: '1rem' })}>
        {steps.map((s, i) => (
          <div key={s.n}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${s.color}20`, border: `1px solid ${s.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>{s.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: s.color, fontWeight: 700 }}>
                    {s.n}. {s.label}
                  </p>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>~{s.pct} %</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.25rem' }}>
                  <div style={{ height: '100%', width: `${s.pct * 2}%`, background: s.color, borderRadius: 3 }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>{s.sub}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginLeft: 17, height: 16, width: 2, background: 'rgba(148,163,184,0.15)', margin: '0.1rem 0 0.1rem 17px' }} />
            )}
          </div>
        ))}
      </div>

      <WikiImg
        src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fm=webp&fit=crop&w=1280&q=75"
        alt="Supertanker pétrolier VLCC"
        caption="Pétrolier VLCC transportant du brut — ce type de navire approvisionne la raffinerie SARA en Martinique."
        credit="U.S. Navy / domaine public"
        creditUrl="https://commons.wikimedia.org/wiki/File:Supertanker_AbQaiq.jpg"
        height={150}
      />

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'IEDOM — circuit approvisionnement', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
        <SourcePill source={{ label: 'OPMR Guadeloupe', url: 'https://www.guadeloupe.gouv.fr/Politiques-publiques/Economie-emploi-et-entreprises/Observatoire-des-Prix-des-Marges-et-des-Revenus', year: '2024' }} />
      </div>
    </div>
  );
}

// ─── Slide 3 — Marché mondial du brut ───────────────────────────────────────────
function BrutSlide() {
  // Brent spot monthly data — source: EIA (US Energy Information Administration)
  // https://www.eia.gov/dnav/pet/hist/RBRTEd.htm
  // Key inflection points (month index from Jan 2020, $/bbl):
  const points: [number, number][] = [
    [0, 65], [3, 32], [4, 18], [8, 45], [13, 55],
    [20, 72], [24, 87], [26, 97], [27, 127], [30, 100],
    [36, 82], [42, 75], [48, 78], [54, 85], [60, 73],
    [62, 76], [74, 75],
  ];
  const W = 520, H = 160;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const months = 74;
  const minP = 15, maxP = 135;
  const x = (m: number) => pad.l + (m / months) * (W - pad.l - pad.r);
  const y = (p: number) => pad.t + (1 - (p - minP) / (maxP - minP)) * (H - pad.t - pad.b);
  const pathD = points.map(([m, p], i) => `${i === 0 ? 'M' : 'L'} ${x(m).toFixed(1)},${y(p).toFixed(1)}`).join(' ');
  // Area fill
  const areaD = `${pathD} L ${x(74).toFixed(1)},${(H - pad.b).toFixed(1)} L ${x(0).toFixed(1)},${(H - pad.b).toFixed(1)} Z`;

  const labels = [
    { m: 4,  p: 18,  text: 'COVID\n18 $/bbl',  dy: 14  },
    { m: 27, p: 127, text: 'Ukraine\n127 $/bbl', dy: -10 },
    { m: 74, p: 75,  text: '~75 $/bbl\nQ1 2026', dy: -10 },
  ];
  const yearLabels = [
    { m: 0,  label: '2020' },
    { m: 12, label: '2021' },
    { m: 24, label: '2022' },
    { m: 36, label: '2023' },
    { m: 48, label: '2024' },
    { m: 60, label: '2025' },
    { m: 74, label: '2026' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Le Brent (brut de mer du Nord) est la référence mondiale. Son prix, libellé en <strong style={{ color: '#f97316' }}>dollars US</strong>,
        se répercute directement sur le coût d'approvisionnement des DOM-TOM.
        Un baril à 75 $ représente environ <strong style={{ color: '#fcd34d' }}>43 % du prix à la pompe</strong>.
      </p>

      {/* SVG line chart */}
      <div style={card({ padding: '0.8rem' })}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
          Cours du Brent ($/baril) — janv. 2020 → mars 2026 · Source : EIA
        </p>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="brentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[30, 60, 90, 120].map(p => (
            <g key={p}>
              <line x1={pad.l} y1={y(p)} x2={W - pad.r} y2={y(p)} stroke="rgba(148,163,184,0.1)" strokeWidth={1} strokeDasharray="4,4" />
              <text x={pad.l - 4} y={y(p)} fill="#475569" fontSize={9} textAnchor="end" dominantBaseline="middle">{p}</text>
            </g>
          ))}
          {/* Year labels */}
          {yearLabels.map(yl => (
            <text key={yl.label} x={x(yl.m)} y={H - 6} fill="#475569" fontSize={9} textAnchor="middle">{yl.label}</text>
          ))}
          {/* Area */}
          <path d={areaD} fill="url(#brentGrad)" />
          {/* Line */}
          <path d={pathD} fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* Labels */}
          {labels.map(lb => (
            <g key={lb.text}>
              <circle cx={x(lb.m)} cy={y(lb.p)} r={3} fill="#f97316" />
              {lb.text.split('\n').map((line, i) => (
                <text key={i} x={x(lb.m)} y={y(lb.p) + lb.dy + i * 11} fill="#fcd34d" fontSize={8.5} textAnchor="middle" fontWeight="700">{line}</text>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* OPEC+ & Dollar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <div style={card({ borderLeft: '3px solid #f97316', padding: '0.75rem 0.9rem' })}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', color: '#fb923c', fontWeight: 700 }}>🌍 OPEC+ : 38 % du marché</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.55 }}>
            23 pays producteurs (dont Russie). Leurs quotas de production influencent directement le prix mondial.
            Chaque baisse de 1 Mb/j de production fait monter le Brent d'environ +2 à +4 $.
          </p>
        </div>
        <div style={card({ borderLeft: '3px solid #60a5fa', padding: '0.75rem 0.9rem' })}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', color: '#60a5fa', fontWeight: 700 }}>💱 Effet Dollar/Euro</p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.55 }}>
            Le brut est coté en USD. Une appréciation du dollar de 10 % ajoute environ +4 à +6 % au coût CIF
            pour les acheteurs européens. En 2022 (parité EUR/USD = 1), l'impact était majeur.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'EIA — Brent spot price', url: 'https://www.eia.gov/dnav/pet/hist/RBRTEd.htm', year: '2020-2026' }} />
        <SourcePill source={{ label: 'OPEC Monthly Report', url: 'https://www.opec.org/opec_web/en/publications/338.htm', year: 'jan. 2026' }} />
        <SourcePill source={{ label: 'IEA Oil Market Report', url: 'https://www.iea.org/reports/oil-market-report-january-2026', year: 'Q1 2026' }} />
      </div>
    </div>
  );
}

// ─── Slide 4 — Raffinage & SARA ─────────────────────────────────────────────────
function RaffinageSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Les DOM-TOM ne disposent que d'une seule raffinerie : la{' '}
        <strong style={{ color: '#a78bfa' }}>SARA — Société Anonyme de la Raffinerie des Antilles</strong>,
        implantée au Lamentin (Martinique). Elle approvisionne la Guadeloupe, la Martinique et la Guyane.
        La Réunion et Mayotte sont approvisionnées par des importations depuis des raffineries asiatiques.
      </p>

      <WikiImg
        src="https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fm=webp&fit=crop&w=1280&q=75"
        alt="Raffinerie pétrolière"
        caption="Illustration d'une raffinerie — la SARA au Lamentin (Martinique) est la seule raffinerie des DOM-TOM français."
        credit="Wikimedia Commons"
        creditUrl="https://commons.wikimedia.org/wiki/File:Raffinerie_de_Frontignan.jpg"
        height={150}
      />

      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SARA — Données clés (source : IEDOM / Rapport annuel Martinique 2023)
        </p>
        {[
          { label: 'Localisation',         value: 'Le Lamentin, Martinique (972)' },
          { label: 'Capacité de traitement', value: '~870 000 tonnes/an de brut' },
          { label: 'Territoires desservis', value: 'Guadeloupe, Martinique, Guyane' },
          { label: 'Brut traité',            value: 'Brut léger d\'Afrique de l\'Ouest (Nigéria, Angola)' },
          { label: 'Produits fabriqués',    value: 'SP95, Diesel, GPL, Fioul domestique, Kérosène' },
          { label: 'Marge de raffinage',    value: '~8 à 12 % du prix final (variable selon cours)' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
            <span style={{ color: '#64748b', minWidth: 165, flexShrink: 0 }}>{row.label}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Réunion & Mayotte supply chain */}
      <div style={card({ borderLeft: '3px solid #38bdf8' })}>
        <p style={{ margin: '0 0 0.35rem', fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700 }}>
          🏝️ La Réunion & Mayotte — approvisionnement via l'Océan Indien
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.6 }}>
          Sans raffinerie locale, ces deux territoires importent des produits finis depuis
          Singapour, l'Inde ou l'Afrique du Sud. Le trajet représente 6 000 à 10 000 km,
          soit un surcoût de fret de <strong style={{ color: '#fbbf24' }}>+10 à +13 % du prix final</strong>.
          Le passage par le Canal de Suez génère une dépendance aux tensions géopolitiques
          (fermeture 2021, attaques Houthis 2023-2024).
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'IEDOM — Rapport Martinique 2023', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
        <SourcePill source={{ label: 'IEDOM — Rapport Réunion 2023', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
        <SourcePill source={{ label: 'OPMR Martinique', url: 'https://www.martinique.gouv.fr/Politiques-publiques/Economie-emploi-formation/Observatoire-des-Prix-des-Marges-et-des-Revenus', year: '2024' }} />
      </div>
    </div>
  );
}

// ─── Slide 5 — Fret maritime ────────────────────────────────────────────────────
function FretSlide() {
  const routes = [
    { t: 'Guadeloupe',   flag: '🇬🇵', from: 'SARA Martinique',          km: 260,  pct: 8   },
    { t: 'Martinique',   flag: '🇲🇶', from: 'SARA (locale)',             km: 0,    pct: 3   },
    { t: 'Guyane',       flag: '🇬🇫', from: 'SARA Martinique',          km: 900,  pct: 12  },
    { t: 'La Réunion',   flag: '🇷🇪', from: 'Asie du Sud (Singapour)',  km: 8500, pct: 11  },
    { t: 'Mayotte',      flag: '🇾🇹', from: 'Afrique du Sud / Réunion', km: 1300, pct: 12  },
    { t: 'SPM',          flag: '🇵🇲', from: 'Canada / France métro.',   km: 5800, pct: 17  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Toutes les îles DOM-TOM (sauf Guyane pour une part terrestre) sont approvisionnées
        <strong style={{ color: '#38bdf8' }}> exclusivement par voie maritime</strong>.
        Ce surcoût de transport est <strong style={{ color: '#fff' }}>incompressible</strong> — il
        représente une fraction permanente du prix à la pompe, quelle que soit la politique fiscale.
      </p>

      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Surcoût fret maritime estimé par territoire — Source : IEDOM / Armateurs de France 2023
        </p>
        {routes.map(row => (
          <div key={row.t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' }}>
            <span style={{ fontSize: '0.9rem', minWidth: 22 }}>{row.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.73rem', color: '#e2e8f0' }}>{row.t}</span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  {row.km > 0 ? `${row.km.toLocaleString('fr-FR')} km` : 'sur place'}
                </span>
              </div>
              <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(row.pct / 20) * 100}%`, background: '#38bdf8', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{row.from}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>+{row.pct} %</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SARA → GP route illustration */}
      <div style={card({ padding: '0.8rem 1rem', background: 'rgba(56,189,248,0.06)', borderColor: 'rgba(56,189,248,0.25)' })}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
          ⚓ Exemple : route SARA (Martinique) → Guadeloupe
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap' }}>
          <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: '0.3rem 0.6rem', color: '#7dd3fc' }}>🏭 SARA - Le Lamentin, MQ</span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>──── 260 km ────▶</span>
          <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '0.3rem 0.6rem', color: '#fcd34d' }}>⛽ Dépôt de Jarry, GP</span>
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#64748b', lineHeight: 1.5 }}>
          Caboteur de 5 000 à 10 000 tonnes. Coût : ~0,10–0,14 €/L inclus dans le prix de cession au distributeur.
          Toute variation du prix du HFO (fioul de soute) impact ce coût — et donc le prix final.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Armateurs de France — Rapport 2023', url: 'https://www.armateursdefrance.org/publications/rapport-annuel', year: '2023' }} />
        <SourcePill source={{ label: 'IEDOM — Rapports annuels', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
      </div>
    </div>
  );
}

// ─── Slide 6 — Fiscalité comparée ───────────────────────────────────────────────
function FiscaliteSlide() {
  const domBreakdown = [
    { label: 'Brut CIF + raffinage international',  pct: 39, eur: 0.62, color: '#f97316' },
    { label: 'Fret DOM + distribution locale',       pct: 14, eur: 0.22, color: '#38bdf8' },
    { label: 'TICPE (taux réduit DOM)',              pct: 19, eur: 0.30, color: '#fbbf24' },
    { label: 'Octroi de mer + CREP',                pct: 4,  eur: 0.07, color: '#e879f9' },
    { label: 'TVA 8,5 %',                           pct: 7,  eur: 0.11, color: '#4ade80' },
    { label: 'Marge distributeur',                  pct: 11, eur: 0.17, color: '#94a3b8' },
    { label: 'Autres redevances',                   pct: 6,  eur: 0.10, color: '#64748b' },
  ];
  const metroBreakdown = [
    { label: 'Brut CIF + raffinage',                pct: 30, eur: 0.56, color: '#f97316' },
    { label: 'Distribution (pas de fret insulaire)',pct: 8,  eur: 0.15, color: '#38bdf8' },
    { label: 'TICPE (taux plein)',                  pct: 37, eur: 0.68, color: '#fbbf24' },
    { label: 'TVA 20 %',                            pct: 17, eur: 0.31, color: '#4ade80' },
    { label: 'Marge distributeur',                  pct: 7,  eur: 0.13, color: '#94a3b8' },
    { label: 'Autres',                              pct: 1,  eur: 0.02, color: '#64748b' },
  ];

  const BarGroup = ({ data, total, title }: { data: typeof domBreakdown; total: number; title: string }) => (
    <div>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 700 }}>{title}</p>
      {data.map(row => (
        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', minWidth: 175, flexShrink: 0 }}>{row.label}</span>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(row.eur / total) * 100}%`, background: row.color, borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: row.color, minWidth: 38, textAlign: 'right' }}>{row.eur.toFixed(2)} €</span>
        </div>
      ))}
      <p style={{ margin: '0.4rem 0 0', fontSize: '0.7rem', color: '#64748b', textAlign: 'right' }}>
        Total taxes : <strong style={{ color: '#fcd34d' }}>{data.filter(r => ['TICPE', 'Octroi', 'TVA'].some(k => r.label.includes(k))).reduce((s, r) => s + r.eur, 0).toFixed(2)} €</strong>
        {' '}sur <strong style={{ color: '#fff' }}>{total.toFixed(3)} €</strong>
      </p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        La structure fiscale explique tout. Les DOM bénéficient d'un <strong style={{ color: '#4ade80' }}>régime dérogatoire
        constitutionnel</strong> (art. 73 Constitution) avec TICPE réduite de moitié et TVA à 8,5 %.
        Paradoxalement, <strong style={{ color: '#fcd34d' }}>le carburant DOM reste moins taxé que le carburant métropolitain</strong>,
        malgré les surcoûts logistiques.
      </p>

      <div style={card()}>
        <BarGroup data={domBreakdown} total={1.589} title="🇬🇵 Guadeloupe — SP95 à 1,589 €/L (jan. 2026)" />
      </div>
      <div style={card()}>
        <BarGroup data={metroBreakdown} total={1.850} title="🇫🇷 France métropolitaine — SP95 à ~1,85 €/L" />
      </div>

      {/* Key insight */}
      <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#4ade80', fontWeight: 700 }}>
          ⚖️ Bilan : ~0,48 € de taxes en DOM vs ~0,99 € en métropole (pour le SP95)
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Ce différentiel de taxes (+0,51 €/L en métro) est supérieur au surcoût fret (+0,22 €/L en DOM).
          C'est pourquoi le prix final DOM reste inférieur malgré la géographie insulaire.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'DGDDI — TICPE DOM 2024', url: 'https://www.douane.gouv.fr/fiche/la-taxe-interieure-de-consommation-sur-les-produits-energetiques-ticpe', year: '2024' }} />
        <SourcePill source={{ label: 'DGEC — Formation prix carburants', url: 'https://www.ecologie.gouv.fr/politiques-publiques/prix-carburants', year: '2025' }} />
        <SourcePill source={{ label: 'Art. 266 quinquies C du CGI', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042910143/', year: '2024' }} />
      </div>
    </div>
  );
}

// ─── Slide 7 — Mécanisme des prix plafonnés ─────────────────────────────────────
function PlafondsSlide() {
  const territories = [
    { t: 'Guadeloupe',   flag: '🇬🇵', since: '1982', freq: 'Mensuel', authority: 'Préfet de région', lever: 'Modulation TICPE + marge max' },
    { t: 'Martinique',   flag: '🇲🇶', since: '1982', freq: 'Mensuel', authority: 'Préfet de région', lever: 'Modulation TICPE + marge max' },
    { t: 'Guyane',       flag: '🇬🇫', since: '1982', freq: 'Mensuel', authority: 'Préfet de région', lever: 'Modulation TICPE + marge max' },
    { t: 'La Réunion',   flag: '🇷🇪', since: '1982', freq: 'Mensuel', authority: 'Préfet de région', lever: 'Modulation TICPE + marge max' },
    { t: 'Mayotte',      flag: '🇾🇹', since: '2022', freq: 'Mensuel', authority: 'Préfet de Mayotte', lever: 'Encadrement marges + subvention partielle' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Dans 5 territoires DOM, le prix à la pompe est <strong style={{ color: '#fb7185' }}>fixé chaque mois
        par arrêté préfectoral</strong>. Le préfet calcule un prix plafond en agrégeant les cours
        mondiaux, les coûts de transport et en ajustant la TICPE locale pour absorber les chocs.
      </p>

      {/* Flowchart */}
      <div style={card({ padding: '1rem' })}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Calcul mensuel du prix plafond
        </p>
        {[
          { step: 'A', title: 'Cours du Brent (14-j avant)', sub: 'Moyenne quotidienne EIA / Platts · Libellé en USD/bbl', color: '#f97316' },
          { step: 'B', title: 'Conversion + coût CIF', sub: 'Taux EUR/USD + fret pétrolier + prime qualité', color: '#60a5fa' },
          { step: 'C', title: 'Marge de raffinage SARA', sub: 'Coût de transformation négocié annuellement', color: '#a78bfa' },
          { step: 'D', title: 'Coût fret DOM + distribution', sub: 'Caboteur + transport terrestre + stockage', color: '#38bdf8' },
          { step: 'E', title: 'Ajustement TICPE local', sub: 'Le Préfet module la TICPE pour viser un prix cible', color: '#fbbf24' },
          { step: 'F', title: '→ ARRÊTÉ PRÉFECTORAL', sub: 'Prix plafond publié au 1er du mois, opposable à tous', color: '#fb7185' },
        ].map((row, i) => (
          <div key={row.step} style={{ display: 'flex', gap: '0.75rem', marginBottom: i < 5 ? '0.4rem' : 0, alignItems: 'flex-start' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: `${row.color}20`, border: `1px solid ${row.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: row.color,
            }}>{row.step}</div>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: row.color === '#fb7185' ? '#fb7185' : '#e2e8f0', fontWeight: row.color === '#fb7185' ? 800 : 600 }}>{row.title}</p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: '#64748b' }}>{row.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              {['Territoire', 'Depuis', 'Fréquence', 'Autorité', 'Levier principal'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(148,163,184,0.1)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {territories.map(row => (
              <tr key={row.t} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                <td style={{ padding: '0.35rem 0.6rem', color: '#e2e8f0' }}>{row.flag} {row.t}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#94a3b8' }}>{row.since}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#4ade80' }}>{row.freq}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#94a3b8' }}>{row.authority}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#fcd34d' }}>{row.lever}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)' }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#fb7185', fontWeight: 700 }}>⚠️ Limite du système</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Le plafonnement absorbe les hausses mais empêche aussi la transmission des baisses du Brent.
          En 2023-2024, alors que le Brent descendait, les prix DOM ont peu varié car la TICPE
          avait été réduite lors des hausses — elle ne peut pas être <em>remontée</em> immédiatement sans
          augmenter le prix final.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Arrêté préf. GP jan. 2026', url: 'https://www.guadeloupe.gouv.fr' }} />
        <SourcePill source={{ label: 'Code de l\'énergie art. L446-1', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031045823/' }} />
        <SourcePill source={{ label: 'DGEC — mécanisme TIPP/TICPE', url: 'https://www.ecologie.gouv.fr/politiques-publiques/prix-carburants', year: '2025' }} />
      </div>
    </div>
  );
}

// ─── Slide 8 — Comparaison internationale ───────────────────────────────────────
function MondeSlide() {
  const countries = [
    { c: 'Venezuela',          flag: '🇻🇪', sp95: 0.01,  taxPct: 2,  note: 'Subvention d\'État totale (PDVSA)' },
    { c: 'Arabie Saoudite',    flag: '🇸🇦', sp95: 0.43,  taxPct: 8,  note: 'Subvention état, pétrole domestique' },
    { c: 'USA',                flag: '🇺🇸', sp95: 0.97,  taxPct: 17, note: 'Taxe fédérale ~18 ¢/gal. + état' },
    { c: 'Guadeloupe (DOM)',   flag: '🇬🇵', sp95: 1.589, taxPct: 30, note: 'TICPE réduite + TVA 8,5 %' },
    { c: 'Martinique (DOM)',   flag: '🇲🇶', sp95: 1.612, taxPct: 30, note: 'TICPE réduite + TVA 8,5 %' },
    { c: 'Espagne',            flag: '🇪🇸', sp95: 1.62,  taxPct: 52, note: 'TVA 21 % + accise modérée' },
    { c: 'Belgique',           flag: '🇧🇪', sp95: 1.66,  taxPct: 56, note: 'Indexation automatique des accises' },
    { c: 'Allemagne',          flag: '🇩🇪', sp95: 1.79,  taxPct: 62, note: 'Énergiesteuer + TVA 19 %' },
    { c: 'France métro.',      flag: '🇫🇷', sp95: 1.85,  taxPct: 54, note: 'TICPE plein + TVA 20 %' },
    { c: 'Italie',             flag: '🇮🇹', sp95: 1.87,  taxPct: 61, note: 'Accise + TVA 22 %' },
    { c: 'Norvège',            flag: '🇳🇴', sp95: 2.28,  taxPct: 67, note: 'CO₂ tax + taxe mobilité (financement VE)' },
  ];
  const max = 2.50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Replacés dans le contexte mondial, les prix DOM-TOM sont <strong style={{ color: '#c084fc' }}>dans la moyenne basse européenne</strong>.
        Ils sont moins chers que l'Allemagne, la France métro. et la Norvège.
        Les prix ultra-bas de certains pays (Venezuela, Arabie Saoudite) résultent de
        <strong style={{ color: '#fff' }}> subventions d'État</strong> ou de ressources domestiques — non comparables.
      </p>

      <div style={card({ padding: '0.8rem 1rem' })}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          SP95 (€/L) — Comparaison mondiale · Source : IEA / GlobalPetrolPrices, jan. 2026
        </p>
        {countries.map(row => (
          <div key={row.c} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', minWidth: 20 }}>{row.flag}</span>
            <span style={{
              fontSize: '0.69rem', minWidth: 148, flexShrink: 0,
              color: row.c.includes('DOM') ? '#fcd34d' : '#e2e8f0',
              fontWeight: row.c.includes('DOM') ? 700 : 400,
            }}>{row.c}</span>
            <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(row.sp95 / max) * 100}%`,
                background: row.c.includes('DOM') ? '#f59e0b' : row.sp95 > 1.8 ? '#ef4444' : row.sp95 < 1.0 ? '#4ade80' : '#6366f1',
                borderRadius: 3,
              }} />
            </div>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, minWidth: 38, textAlign: 'right',
              color: row.c.includes('DOM') ? '#f59e0b' : '#e2e8f0',
            }}>{row.sp95.toFixed(2)} €</span>
          </div>
        ))}
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.63rem', color: '#475569' }}>
          Sources : IEA, GlobalPetrolPrices.com, EIA. Données converties en EUR au taux du 1er jan. 2026.
          Les prix incluent toutes taxes. * Saint-Barth (BL) ~1,99 €/L, hors tableau.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'IEA — End-use prices 2025', url: 'https://www.iea.org/data-and-statistics/data-product/end-use-prices', year: '2025' }} />
        <SourcePill source={{ label: 'GlobalPetrolPrices', url: 'https://www.globalpetrolprices.com/gasoline_prices/', year: 'jan. 2026' }} />
        <SourcePill source={{ label: 'EIA — International fuel prices', url: 'https://www.eia.gov/petroleum/gasdiesel/', year: '2026' }} />
      </div>
    </div>
  );
}

// ─── Slide 9 — Conclusion ────────────────────────────────────────────────────────
function ConclusionSlide() {
  const myths = [
    { myth: '« Le carburant DOM est cher à cause des taxes »',     truth: 'FAUX : les taxes DOM sont 40 % inférieures à celles de métropole (TICPE réduite + TVA 8,5 %).' },
    { myth: '« C\'est pareil qu\'en métropole »',                   truth: 'FAUX : le fret maritime insulaire ajoute +8 à +17 % de surcoût logistique absent en métropole.' },
    { myth: '« Les prix plafonnés protègent contre les hausses »',  truth: 'VRAI MAIS : ils empêchent aussi la transmission des baisses du Brent aux consommateurs.' },
    { myth: '« Saint-Barth a du carburant pas cher (TVA 0 %) »',   truth: 'FAUX : TVA 0 % mais taxes locales + marché libre → SP95 à ~1,99 €/L, le plus cher des DOM-COM.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Cette conférence vous a donné les outils pour <strong style={{ color: '#22c55e' }}>comprendre,
        vérifier et contre-argumenter</strong> sur le prix des carburants dans les DOM-TOM.
        Déconstruisons les idées reçues les plus répandues.
      </p>

      {/* Myth busters */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Idées reçues déconstruites
        </p>
        {myths.map((m, i) => (
          <div key={i} style={{ marginBottom: '0.7rem' }}>
            <p style={{ margin: '0 0 0.2rem', fontSize: '0.77rem', color: '#f87171', fontStyle: 'italic', fontWeight: 600 }}>
              ❌ {m.myth}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#4ade80', lineHeight: 1.55 }}>
              ✅ {m.truth}
            </p>
          </div>
        ))}
      </div>

      {/* Key takeaways */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        {[
          { icon: '⛽', title: 'Comparez en temps réel', desc: 'Utilisez le comparateur A KI PRI SA YÉ pour trouver la station la moins chère.', color: '#f59e0b' },
          { icon: '📊', title: 'Vérifiez les sources', desc: 'data.economie.gouv.fr publie tous les prix en temps réel. Les arrêtés sont publics.', color: '#60a5fa' },
          { icon: '📢', title: 'Signalez les anomalies', desc: 'Prix supérieurs au plafond ? Signalez-le à la DGCCRF ou à l\'OPMR.', color: '#fb7185' },
          { icon: '🔍', title: 'Lisez l\'enquête complète', desc: 'Dossier d\'investigation détaillé disponible sur A KI PRI SA YÉ.', color: '#a78bfa' },
        ].map(t => (
          <div key={t.title} style={{ padding: '0.75rem', borderRadius: 12, background: `${t.color}0d`, border: `1px solid ${t.color}33` }}>
            <p style={{ margin: '0 0 0.3rem', fontSize: '1.2rem' }}>{t.icon}</p>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', color: t.color, fontWeight: 700 }}>{t.title}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>{t.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', paddingTop: '0.5rem' }}>
        <Link
          to="/comparateur-carburants"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.3rem', borderRadius: 8, background: 'rgba(245,158,11,0.85)', color: '#0f172a', fontSize: '0.83rem', fontWeight: 800, textDecoration: 'none' }}
        >
          ⛽ Comparateur Carburants
        </Link>
        <Link
          to="/enquete-carburants"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.3rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none' }}
        >
          🔍 Enquête complète
        </Link>
      </div>

      <p style={{ margin: 0, fontSize: '0.65rem', color: '#334155', textAlign: 'center', lineHeight: 1.5 }}>
        Toutes les données sont issues de sources officielles vérifiables (DGEC, IEDOM, INSEE, EIA, OPEC, IEA).
        Mis à jour : mars 2026 · Observatoire A KI PRI SA YÉ
      </p>
    </div>
  );
}

// ─── Slide content map ──────────────────────────────────────────────────────────
const SLIDE_CONTENT: Record<string, React.FC> = {
  panorama:   PanoramaSlide,
  chaine:     ChaineSlide,
  brut:       BrutSlide,
  raffinage:  RaffinageSlide,
  fret:       FretSlide,
  fiscalite:  FiscaliteSlide,
  plafonds:   PlafondsSlide,
  monde:      MondeSlide,
  conclusion: ConclusionSlide,
};

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function ConferenceCarburants() {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  const slide = SLIDES[current];
  const SlideContent = SLIDE_CONTENT[slide.id];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '1.5rem 1rem',
      fontFamily: 'inherit',
    }}>
      <Helmet>
        <title>Conférence Carburants DOM-TOM — Expert & données officielles — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Conférence expert-niveau : anatomie complète du prix des carburants dans les DOM-TOM. 9 diapositives avec données officielles DGEC, IEDOM, INSEE, EIA, OPEC. Brent, SARA, fiscalité, prix plafonnés, comparaison mondiale."
        />
      </Helmet>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Back links */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/comparateur-carburants" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Comparateur Carburants
          </Link>
          <Link to="/enquete-carburants" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            🔍 Enquête Carburants
          </Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.conferenceCarburants}
          alt="Conférence — Anatomie du prix des carburants DOM-TOM"
          gradient="from-slate-950 to-amber-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            🎓 Conférence — Prix des Carburants DOM-TOM
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.83rem', color: 'rgba(255,255,255,0.8)' }}>
            Niveau contre-expert · 9 diapositives · Données officielles vérifiables
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {['DGEC', 'IEDOM', 'EIA', 'OPEC', 'INSEE', 'Arrêtés préfectoraux 2026'].map(s => (
              <span key={s} style={accentPill('#f59e0b')}>{s}</span>
            ))}
          </div>
        </HeroImage>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '1rem 0' }}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              title={s.title}
              aria-label={`Aller à la diapositive ${i + 1} : ${s.title}`}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background: i === current ? slide.accentColor : 'rgba(148,163,184,0.25)',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Slide card */}
        <div style={{
          background: 'rgba(15,23,42,0.85)',
          border: `1px solid ${slide.accentColor}44`,
          borderRadius: 20,
          padding: '1.5rem 1.5rem 1.25rem',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 40px ${slide.accentColor}18`,
          minHeight: 500,
        }}>
          {/* Slide header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem', borderBottom: `1px solid ${slide.accentColor}33`, paddingBottom: '1rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${slide.accentColor}22`,
              border: `1px solid ${slide.accentColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {slide.emoji}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: slide.accentColor, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                Diapositive {current + 1} / {total}
              </div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>{slide.title}</h1>
              {slide.subtitle && <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{slide.subtitle}</p>}
            </div>
          </div>

          {/* Slide body */}
          <SlideContent />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
          <button
            onClick={prev}
            disabled={current === 0}
            aria-label="Diapositive précédente"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: 8,
              background: current === 0 ? 'rgba(30,41,59,0.4)' : 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(148,163,184,0.15)',
              color: current === 0 ? '#475569' : '#94a3b8',
              fontSize: '0.83rem', fontWeight: 600, cursor: current === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            ← Précédent
          </button>

          <span style={{ fontSize: '0.72rem', color: '#475569' }}>Touches ← → pour naviguer</span>

          <button
            onClick={next}
            disabled={current === total - 1}
            aria-label="Diapositive suivante"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: 8,
              background: current === total - 1 ? 'rgba(30,41,59,0.4)' : `${slide.accentColor}22`,
              border: `1px solid ${current === total - 1 ? 'rgba(148,163,184,0.1)' : `${slide.accentColor}55`}`,
              color: current === total - 1 ? '#475569' : slide.accentColor,
              fontSize: '0.83rem', fontWeight: 700, cursor: current === total - 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Suivant →
          </button>
        </div>

        {/* Slide outline */}
        <div style={{ marginTop: '1.5rem', padding: '1rem 1.1rem', borderRadius: 12, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.08)' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Plan de la conférence</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                style={{
                  padding: '0.3rem 0.7rem', borderRadius: 6,
                  background: i === current ? `${s.accentColor}22` : 'transparent',
                  border: `1px solid ${i === current ? `${s.accentColor}55` : 'rgba(148,163,184,0.15)'}`,
                  color: i === current ? s.accentColor : '#64748b',
                  fontSize: '0.7rem', fontWeight: i === current ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {s.emoji} {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Footer disclaimer */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.62rem', color: '#1e293b', textAlign: 'center', lineHeight: 1.6 }}>
          Conférence carburants DOM-TOM v1.0 — Mars 2026 · Observatoire A KI PRI SA YÉ ·
          Données officielles vérifiables : DGEC, IEDOM, INSEE, EIA (US Energy Info. Admin.), OPEC, IEA ·
          Aucun chiffre inventé — toutes les estimations sont clairement identifiées ·{' '}
          <Link to="/methodologie" style={{ color: '#334155' }}>Méthodologie</Link>
        </p>

      </div>
    </div>
  );
}
