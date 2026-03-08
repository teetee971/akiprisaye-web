/**
 * ConferencePrix — Présentation conférence sur la vie chère en Outre-Mer
 *
 * 7 diapositives interactives avec :
 *  - Diagrammes SVG inline (route maritime, flux octroi de mer,
 *    concentration des marchés, comparaison revenus)
 *  - Photos réelles (Wikimedia Commons, licences libres)
 *  - Liens vers les sources officielles (INSEE, IEDOM, CEROM,
 *    Autorité de la concurrence, EUR-Lex, DGDDI, Armateurs de France)
 *  - Navigation clavier (← →) + boutons prev/next
 *
 * Sources des données :
 *  INSEE — Enquête Budget de Famille DOM 2017/2018 ; Revenus Disponibles Localisés 2021
 *  IEDOM — Rapports annuels 2023 (GP, MQ, GF, RE, YT)
 *  CEROM — Comptes Économiques Rapides pour l'Outre-Mer 2022
 *  Autorité de la concurrence — Avis 09-A-45 ; Avis 19-A-12
 *  EUR-Lex — Règlement UE 2022/2 (octroi de mer jusqu'en 2030)
 *  Armateurs de France — Rapport d'activité 2023
 *  DGDDI — Douane française, statistiques 2022
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Constants ─────────────────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  { id: 'cover',       emoji: '🎙️', title: 'Vie chère en Outre-Mer',               subtitle: 'Comprendre les écarts de prix',                  accentColor: '#6366f1' },
  { id: 'constat',     emoji: '📊', title: 'Le constat chiffré',                   subtitle: 'Des écarts allant jusqu\'à +40 %',               accentColor: '#3b82f6' },
  { id: 'fret',        emoji: '🚢', title: 'Facteur 1 — Le fret maritime',          subtitle: '+6 % à +18 % selon le territoire',              accentColor: '#0ea5e9' },
  { id: 'octroi',      emoji: '🏛️', title: 'Facteur 2 — L\'Octroi de mer',          subtitle: 'Une taxe vieille de 350 ans',                   accentColor: '#a855f7' },
  { id: 'marche',      emoji: '🏪', title: 'Facteur 3 — Concentration du marché',   subtitle: 'Oligopole et faible concurrence',               accentColor: '#f59e0b' },
  { id: 'pouvoir',     emoji: '💸', title: 'Facteur 4 — Pouvoir d\'achat',          subtitle: 'Le double impact sur les ménages',              accentColor: '#ef4444' },
  { id: 'solutions',   emoji: '💡', title: 'Ce que vous pouvez faire',              subtitle: 'Outils, droits et dispositifs officiels',       accentColor: '#22c55e' },
];

// ─── Shared style helpers ───────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(15,23,42,0.75)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 14,
  padding: '1.1rem 1.3rem',
  ...extra,
});

const accent = (color: string): React.CSSProperties => ({
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
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '3px 9px',
        borderRadius: 20,
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.3)',
        color: '#a5b4fc',
        fontSize: '0.68rem',
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.2)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
    >
      🔗 {source.label}{source.year ? ` (${source.year})` : ''}
    </a>
  );
}

// ─── Image with lazy load + error fallback ──────────────────────────────────────
function WikiImg({
  src, alt, caption, credit, creditUrl, height = 180,
}: {
  src: string; alt: string; caption: string; credit: string; creditUrl: string; height?: number;
}) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    <figure style={{ margin: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.12)' }}>
      <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)}
        style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
      <figcaption style={{ fontSize: '0.62rem', color: '#64748b', padding: '0.3rem 0.7rem', background: 'rgba(0,0,0,0.45)', lineHeight: 1.4 }}>
        {caption}{' '}
        <a href={creditUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>{credit}</a>
      </figcaption>
    </figure>
  );
}

// ─── Slide 1 — Cover ────────────────────────────────────────────────────────────
function CoverSlide() {
  const overcosts = [
    { t: 'France métro.', flag: '🇫🇷', pct: 0,  color: '#22c55e' },
    { t: 'Martinique',    flag: '🇲🇶', pct: 11, color: '#fbbf24' },
    { t: 'Guadeloupe',    flag: '🇬🇵', pct: 13, color: '#fbbf24' },
    { t: 'La Réunion',    flag: '🇷🇪', pct: 12, color: '#fbbf24' },
    { t: 'Mayotte',       flag: '🇾🇹', pct: 14, color: '#f97316' },
    { t: 'Guyane',        flag: '🇬🇫', pct: 17, color: '#ef4444' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero stat */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: '#ef4444', lineHeight: 1, marginBottom: '0.3rem' }}>+11 à +40 %</div>
        <div style={{ fontSize: '1rem', color: '#94a3b8' }}>de surcoût alimentaire dans les DOM / COM vs France métropolitaine</div>
      </div>

      {/* Mini bar chart */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
          Surcoût alimentaire moyen — source INSEE / IEDOM 2023
        </p>
        {overcosts.map(row => (
          <div key={row.t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.9rem', minWidth: 22 }}>{row.flag}</span>
            <span style={{ fontSize: '0.75rem', color: '#e2e8f0', minWidth: 108 }}>{row.t}</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${row.pct === 0 ? 2 : (row.pct / 20) * 100}%`, background: row.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ minWidth: 42, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: row.color }}>
              {row.pct === 0 ? 'réf.' : `+${row.pct} %`}
            </span>
          </div>
        ))}
      </div>

      {/* 4 factors preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.6rem' }}>
        {[
          { e: '🚢', l: 'Fret maritime',         c: '#60a5fa' },
          { e: '🏛️', l: "Octroi de mer",          c: '#c084fc' },
          { e: '🏪', l: 'Peu de concurrence',     c: '#fbbf24' },
          { e: '💸', l: "Revenus plus faibles",   c: '#f87171' },
        ].map(f => (
          <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${f.c}33` }}>
            <span style={{ fontSize: '1.1rem' }}>{f.e}</span>
            <span style={{ fontSize: '0.78rem', color: f.c, fontWeight: 600 }}>{f.l}</span>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'INSEE — Niveaux de vie DOM', url: 'https://www.insee.fr/fr/statistiques/2586930', year: '2023' }} />
        <SourcePill source={{ label: 'IEDOM Rapports annuels', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
        <SourcePill source={{ label: 'CEROM', url: 'https://www.cerom-outremer.fr/', year: '2022' }} />
      </div>
    </div>
  );
}

// ─── Slide 2 — Le constat chiffré ───────────────────────────────────────────────
function ConstatSlide() {
  const data = [
    { t: 'Guadeloupe',   flag: '🇬🇵', pct: 13, chomage: 18.4, pib: 21800,  salaire: 14800 },
    { t: 'Martinique',   flag: '🇲🇶', pct: 11, chomage: 13.7, pib: 22200,  salaire: 15000 },
    { t: 'Guyane',       flag: '🇬🇫', pct: 17, chomage: 22.4, pib: 16800,  salaire: 11200 },
    { t: 'La Réunion',   flag: '🇷🇪', pct: 12, chomage: 18.8, pib: 21400,  salaire: 13600 },
    { t: 'Mayotte',      flag: '🇾🇹', pct: 14, chomage: 32.0, pib:  9200,  salaire:  5600 },
    { t: 'France métro.',flag: '🇫🇷', pct:  0, chomage:  7.1, pib: 36200,  salaire: 23300 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Les enquêtes officielles mesurent précisément les écarts. Ces chiffres
        sont issus des publications <strong style={{ color: '#e2e8f0' }}>INSEE</strong> et{' '}
        <strong style={{ color: '#e2e8f0' }}>IEDOM</strong> — des organismes publics indépendants.
      </p>

      {/* Comparison table */}
      <div style={card({ overflowX: 'auto' })}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Territoire', 'Surcoût alim.', 'Chômage', 'PIB/hab.', 'Rev. médian'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(148,163,184,0.15)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isRef = row.t === 'France métro.';
              return (
                <tr key={row.t} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#e2e8f0', fontWeight: 600 }}>{row.flag} {row.t}</td>
                  <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: isRef ? '#22c55e' : row.pct >= 15 ? '#ef4444' : '#fbbf24' }}>
                    {isRef ? 'réf.' : `+${row.pct} %`}
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', color: row.chomage > 15 ? '#f97316' : '#94a3b8' }}>{row.chomage} %</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }}>{row.pib.toLocaleString('fr-FR')} €</td>
                  <td style={{ padding: '0.45rem 0.6rem', color: isRef ? '#22c55e' : '#94a3b8', fontWeight: isRef ? 700 : 400 }}>{row.salaire.toLocaleString('fr-FR')} €/an</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SVG bar chart — surcoût */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Surcoût alimentaire (%) par rapport à la métropole</p>
        <svg viewBox="0 0 420 90" style={{ width: '100%', height: 90 }} aria-label="Graphique surcoût alimentaire par territoire">
          {[
            { x: 10,  w: 0,    l: 'FR', color: '#22c55e', pct: '0 %' },
            { x: 80,  w: 66,   l: 'MQ', color: '#fbbf24', pct: '+11 %' },
            { x: 150, w: 72,   l: 'RE', color: '#fbbf24', pct: '+12 %' },
            { x: 220, w: 78,   l: 'GP', color: '#f97316', pct: '+13 %' },
            { x: 290, w: 84,   l: 'YT', color: '#f97316', pct: '+14 %' },
            { x: 360, w: 102,  l: 'GF', color: '#ef4444', pct: '+17 %' },
          ].map(b => (
            <g key={b.l}>
              <rect x={b.x} y={70 - (b.w === 0 ? 2 : b.w * 0.65)} width={42} height={b.w === 0 ? 2 : b.w * 0.65} fill={b.color} rx={3} />
              <text x={b.x + 21} y={84} textAnchor="middle" fill="#94a3b8" fontSize="9">{b.l}</text>
              <text x={b.x + 21} y={65 - (b.w === 0 ? 2 : b.w * 0.65)} textAnchor="middle" fill={b.color} fontSize="8" fontWeight="bold">{b.pct}</text>
            </g>
          ))}
          <line x1={8} y1={70} x2={415} y2={70} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'INSEE — Budget de Famille DOM', url: 'https://www.insee.fr/fr/statistiques/2586930', year: '2017/18' }} />
        <SourcePill source={{ label: 'IEDOM Rapports annuels', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
        <SourcePill source={{ label: 'CEROM', url: 'https://www.cerom-outremer.fr/', year: '2022' }} />
        <SourcePill source={{ label: 'INSEE — RDL 2021', url: 'https://www.insee.fr/fr/statistiques/6436428', year: '2021' }} />
      </div>
    </div>
  );
}

// ─── Slide 3 — Fret maritime ────────────────────────────────────────────────────
function FretSlide() {
  const routes = [
    { from: 'Le Havre', to: 'Guadeloupe / Martinique', km: 7050, days: '10–11 j.', surcoût: '+6–8 %',  color: '#fbbf24' },
    { from: 'Le Havre', to: 'Guyane',                   km: 7200, days: '12 j.',    surcoût: '+9–11 %', color: '#f97316' },
    { from: 'Le Havre', to: 'La Réunion',                km: 12200,days: '22 j.',   surcoût: '+11–14 %',color: '#ef4444' },
    { from: 'Le Havre', to: 'Mayotte',                   km: 11800,days: '20 j.',   surcoût: '+10–12 %',color: '#ef4444' },
    { from: 'Brest',    to: 'St-Pierre-et-Miquelon',    km: 4900, days: '14 j.',   surcoût: '+15–18 %',color: '#dc2626' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Pratiquement <strong style={{ color: '#e2e8f0' }}>90 % des produits de grande consommation</strong> vendus
        dans les DOM sont importés par voie maritime depuis la métropole ou d'autres continents.
        Le coût du fret se répercute directement sur le prix en rayon.
      </p>

      {/* SVG Route map (stylized) */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Distances maritimes depuis Le Havre (en km)</p>
        <svg viewBox="0 0 420 130" style={{ width: '100%', height: 130 }} aria-label="Carte des routes maritimes vers les DOM">
          {/* Ocean background */}
          <rect width={420} height={130} fill="rgba(14,165,233,0.06)" rx={8} />
          {/* France */}
          <ellipse cx={90} cy={45} rx={28} ry={20} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={1.5} />
          <text x={90} y={49} textAnchor="middle" fill="#a5b4fc" fontSize="9" fontWeight="bold">🇫🇷 France</text>
          {/* Routes + destinations */}
          {[
            { cx: 195, cy: 30, label: 'Antilles', km: '~7 000 km', color: '#fbbf24', pct: '+6–8 %' },
            { cx: 210, cy: 65, label: 'Guyane',   km: '~7 200 km', color: '#f97316', pct: '+9–11 %' },
            { cx: 350, cy: 35, label: 'Réunion',  km: '~12 200 km',color: '#ef4444', pct: '+11–14 %' },
            { cx: 340, cy: 75, label: 'Mayotte',  km: '~11 800 km',color: '#ef4444', pct: '+10–12 %' },
          ].map(d => (
            <g key={d.label}>
              <line x1={118} y1={45} x2={d.cx - 15} y2={d.cy} stroke={d.color} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.7} />
              <circle cx={d.cx} cy={d.cy} r={12} fill={`${d.color}22`} stroke={d.color} strokeWidth={1.5} />
              <text x={d.cx} y={d.cy + 3} textAnchor="middle" fill={d.color} fontSize="7.5" fontWeight="bold">{d.label}</text>
              <text x={d.cx} y={d.cy + 18} textAnchor="middle" fill="#64748b" fontSize="6.5">{d.km}</text>
              <text x={d.cx} y={d.cy + 27} textAnchor="middle" fill={d.color} fontSize="7" fontWeight="bold">{d.pct}</text>
            </g>
          ))}
          {/* Ship icon */}
          <text x={155} y={48} fontSize={14} style={{ pointerEvents: 'none' }}>🚢</text>
          <text x={270} y={55} fontSize={12} style={{ pointerEvents: 'none' }}>🚢</text>
        </svg>
      </div>

      {/* Transport table */}
      <div style={card({ overflowX: 'auto' })}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Destination', 'Distance', 'Durée trajet', 'Surcoût estimé'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(148,163,184,0.15)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((r, i) => (
              <tr key={r.to} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ padding: '0.4rem 0.6rem', color: '#e2e8f0' }}>{r.to}</td>
                <td style={{ padding: '0.4rem 0.6rem', color: '#94a3b8' }}>{r.km.toLocaleString('fr-FR')} km</td>
                <td style={{ padding: '0.4rem 0.6rem', color: '#94a3b8' }}>{r.days}</td>
                <td style={{ padding: '0.4rem 0.6rem', fontWeight: 700, color: r.color }}>{r.surcoût}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image */}
      <WikiImg
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/CMA_CGM_Benjamin_Franklin%2C_Port_2000%2C_Le_Havre%2C_22_November_2015_%2823042047853%29.jpg/800px-CMA_CGM_Benjamin_Franklin%2C_Port_2000%2C_Le_Havre%2C_22_November_2015_%2823042047853%29.jpg"
        alt="Porte-conteneurs CMA CGM Benjamin Franklin au port du Havre — les marchandises pour les DOM partent des ports métropolitains"
        caption="Porte-conteneurs CMA CGM Benjamin Franklin au port du Havre. CMA CGM est le principal armateur français assurant les lignes vers les Antilles."
        credit="Wikimedia Commons — CC BY 2.0"
        creditUrl="https://commons.wikimedia.org/wiki/File:CMA_CGM_Benjamin_Franklin,_Port_2000,_Le_Havre,_22_November_2015_(23042047853).jpg"
        height={170}
      />

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Armateurs de France — Rapport 2023', url: 'https://www.armateursdefrance.org/', year: '2023' }} />
        <SourcePill source={{ label: 'IEDOM — Tableau de bord transport', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
        <SourcePill source={{ label: 'Douane FR — Stats fret DOM', url: 'https://www.douane.gouv.fr/la-douane/politique-douaniere/statistiques-du-commerce-exterieur', year: '2022' }} />
      </div>
    </div>
  );
}

// ─── Slide 4 — Octroi de mer ────────────────────────────────────────────────────
function OctroimerSlide() {
  const taux = [
    { cat: 'Riz, pâtes, farine de blé',          rate: '0–2 %',   color: '#22c55e' },
    { cat: 'Produits laitiers, yaourts',          rate: '5–10 %',  color: '#84cc16' },
    { cat: 'Boissons non alcoolisées',            rate: '5–10 %',  color: '#fbbf24' },
    { cat: 'Viandes, charcuterie',                rate: '5–15 %',  color: '#f97316' },
    { cat: 'Produits d\'hygiène',                 rate: '10–20 %', color: '#fb923c' },
    { cat: 'Électroménager, électronique',        rate: '15–30 %', color: '#ef4444' },
    { cat: 'Vêtements, textiles',                 rate: '10–25 %', color: '#dc2626' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <div style={card()}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#c084fc', fontWeight: 700 }}>📜 Qu'est-ce que l'octroi de mer ?</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
            C'est une <strong style={{ color: '#e2e8f0' }}>taxe douanière locale</strong> perçue à l'entrée des marchandises dans les
            Départements et Régions d'Outre-Mer (DROM). Elle existe depuis <strong style={{ color: '#c084fc' }}>1670</strong> et finance
            en moyenne <strong style={{ color: '#e2e8f0' }}>35 à 40 %</strong> des budgets des collectivités locales.
          </p>
        </div>
        <div style={card()}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#c084fc', fontWeight: 700 }}>🇪🇺 Cadre légal actuel</p>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Le Règlement UE <strong style={{ color: '#e2e8f0' }}>2022/2</strong> proroge le dispositif jusqu'au{' '}
            <strong style={{ color: '#c084fc' }}>31 décembre 2030</strong>. Il permet aux DROM de maintenir
            des taux différenciés pour protéger la production locale face aux importations.
          </p>
        </div>
      </div>

      {/* SVG flow diagram */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Flux de l'octroi de mer — qui paie, qui perçoit ?</p>
        <svg viewBox="0 0 420 90" style={{ width: '100%', height: 90 }} aria-label="Diagramme du flux de l'octroi de mer">
          {/* Step boxes */}
          {[
            { x: 5,   label: '🏭 Fabricant',  sub: 'France',    fill: 'rgba(99,102,241,0.15)', border: '#6366f1' },
            { x: 115, label: '🚢 Port DOM',    sub: 'Arrivée',   fill: 'rgba(14,165,233,0.15)', border: '#0ea5e9' },
            { x: 225, label: '🏛️ Douane',      sub: 'Octroi',    fill: 'rgba(168,85,247,0.15)', border: '#a855f7' },
            { x: 335, label: '🏪 Magasin',     sub: 'Prix final',fill: 'rgba(239,68,68,0.15)',  border: '#ef4444' },
          ].map((b, i) => (
            <g key={b.label}>
              <rect x={b.x} y={15} width={76} height={46} rx={8} fill={b.fill} stroke={b.border} strokeWidth={1.2} />
              <text x={b.x + 38} y={34} textAnchor="middle" fontSize="11">{b.label.split(' ')[0]}</text>
              <text x={b.x + 38} y={46} textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="bold">{b.label.split(' ').slice(1).join(' ')}</text>
              <text x={b.x + 38} y={56} textAnchor="middle" fill="#64748b" fontSize="7">{b.sub}</text>
              {i < 3 && <polygon points={`${b.x + 83},38 ${b.x + 90},34 ${b.x + 90},42`} fill="#475569" />}
            </g>
          ))}
          {/* Collectivité arrow */}
          <line x1={263} y1={15} x2={263} y2={5} stroke="#a855f7" strokeWidth={1.5} strokeDasharray="3,2" />
          <polygon points="259,5 263,0 267,5" fill="#a855f7" />
          <text x={263} y={0} textAnchor="middle" fill="#a855f7" fontSize="7">Collectivité locale (35–40 % budget)</text>
        </svg>
      </div>

      {/* Tax rates */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Taux d'octroi de mer par catégorie de produit (fourchettes moyennes)</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {taux.map(t => (
            <div key={t.cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#e2e8f0', flex: 1 }}>{t.cat}</span>
              <div style={{ width: 140, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ height: '100%', width: `${(parseInt(t.rate) / 30) * 100}%`, background: t.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: t.color, minWidth: 60, textAlign: 'right' }}>{t.rate}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'EUR-Lex — Règlement UE 2022/2', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002', year: '2022' }} />
        <SourcePill source={{ label: 'DGDDI — Douane française', url: 'https://www.douane.gouv.fr/la-douane/politique-douaniere/loctroi-de-mer', year: '2023' }} />
        <SourcePill source={{ label: 'Vie-Publique — Octroi de mer', url: 'https://www.vie-publique.fr/eclairage/18680-loctroi-de-mer-une-taxe-specifique-aux-drom', year: '2023' }} />
      </div>
    </div>
  );
}

// ─── Slide 5 — Concentration du marché ──────────────────────────────────────────
function MarcheSlide() {
  const comparison = [
    { label: 'Guadeloupe',    pop: 377000,  stores: 42,  ratio: 8976,  color: '#ef4444' },
    { label: 'Martinique',    pop: 349000,  stores: 38,  ratio: 9184,  color: '#ef4444' },
    { label: 'La Réunion',    pop: 876000,  stores: 87,  ratio: 10069, color: '#f97316' },
    { label: 'France métro.', pop: 68000000,stores: 2200,ratio: 30909, color: '#22c55e' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={card()}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>⚖️ Qu'est-ce qu'un oligopole de distribution ?</p>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.65 }}>
          En métropole, des dizaines de chaînes se font concurrence. Dans les DOM, 2 à 4 groupes familiaux
          contrôlent <strong style={{ color: '#e2e8f0' }}>70 à 80 % de la grande distribution</strong>. Ce manque de
          concurrence leur permet de pratiquer des marges commerciales <strong style={{ color: '#fbbf24' }}>2 à 3 fois plus élevées</strong>{' '}
          qu'en métropole — sans pression du marché pour les réduire. L'Autorité de la concurrence a
          documenté ce phénomène dès 2009.
        </p>
      </div>

      {/* SVG market concentration */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Habitants par grande surface — plus le chiffre est élevé, moins il y a de concurrence</p>
        <svg viewBox="0 0 420 100" style={{ width: '100%', height: 100 }} aria-label="Concentration du marché par territoire">
          {comparison.map((c, i) => {
            const barW = (c.ratio / 35000) * 320;
            const y = i * 22 + 8;
            return (
              <g key={c.label}>
                <text x={0} y={y + 11} fill="#94a3b8" fontSize="8.5" dominantBaseline="middle">{c.label}</text>
                <rect x={105} y={y + 2} width={barW} height={14} rx={4} fill={`${c.color}22`} stroke={c.color} strokeWidth={1} />
                <rect x={105} y={y + 2} width={barW} height={14} rx={4} fill={`${c.color}44`} />
                <text x={108 + barW} y={y + 11} fill={c.color} fontSize="8.5" fontWeight="bold" dominantBaseline="middle" dx={4}>
                  {c.ratio.toLocaleString('fr-FR')} hab/magasin
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Margin comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        {[
          { label: 'Marge nette France métro.', value: '1–3 %',  color: '#22c55e', desc: 'Les grandes enseignes jouent sur les volumes' },
          { label: 'Marge nette DOM',            value: '6–12 %', color: '#ef4444', desc: "Oligopole = moins de pression tarifaire" },
        ].map(m => (
          <div key={m.label} style={card({ textAlign: 'center', borderColor: `${m.color}44` })}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600, margin: '0.2rem 0' }}>{m.label}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Image */}
      <WikiImg
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Fort-de-France_panorama.jpg/800px-Fort-de-France_panorama.jpg"
        alt="Vue panoramique de Fort-de-France, Martinique — zone urbaine commerciale"
        caption="Fort-de-France, Martinique — centre commercial et portuaire. Les grandes enseignes de distribution dominent le tissu commercial."
        credit="Wikimedia Commons — CC BY-SA 3.0"
        creditUrl="https://commons.wikimedia.org/wiki/File:Fort-de-France_panorama.jpg"
        height={150}
      />

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Autorité de la concurrence — Avis 09-A-45', url: 'https://www.autoritedelaconcurrence.fr/fr/decision/relatif-au-fonctionnement-de-la-grande-distribution-dans-les-departements-doutre-mer', year: '2009' }} />
        <SourcePill source={{ label: 'Autorité de la concurrence — Avis 19-A-12', url: 'https://www.autoritedelaconcurrence.fr/fr/decision/relatif-a-la-situation-concurrentielle-dans-le-secteur-de-la-grande-distribution-en', year: '2019' }} />
        <SourcePill source={{ label: 'INSEE — Commerce de détail DOM', url: 'https://www.insee.fr/fr/statistiques/zones/2586930', year: '2022' }} />
      </div>
    </div>
  );
}

// ─── Slide 6 — Pouvoir d'achat ──────────────────────────────────────────────────
function PouvoirSlide() {
  const incomes = [
    { t: 'France métro.', flag: '🇫🇷', rev: 23300, pauvrete: 15.6, color: '#22c55e' },
    { t: 'Martinique',    flag: '🇲🇶', rev: 15000, pauvrete: 32.0, color: '#fbbf24' },
    { t: 'Guadeloupe',    flag: '🇬🇵', rev: 14800, pauvrete: 34.5, color: '#fbbf24' },
    { t: 'La Réunion',    flag: '🇷🇪', rev: 13600, pauvrete: 38.3, color: '#f97316' },
    { t: 'Guyane',        flag: '🇬🇫', rev: 11200, pauvrete: 52.5, color: '#ef4444' },
    { t: 'Mayotte',       flag: '🇾🇹', rev:  5600, pauvrete: 77.0, color: '#dc2626' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={card({ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' })}>
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700 }}>⚠️ Le double impact sur les ménages</p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.65 }}>
          Les ménages des DOM subissent simultanément des <strong>prix plus élevés</strong>{' '}
          <em>et</em> des <strong>revenus plus faibles</strong>. À Mayotte, le revenu médian est
          de <strong>5 600 €/an</strong> — soit <strong>4 fois moins</strong> qu'en métropole —
          pour des prix alimentaires <strong>14 % plus élevés</strong>.
        </p>
      </div>

      {/* SVG comparison chart */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Revenu médian disponible (€/an) — source INSEE RDL 2021</p>
        <svg viewBox="0 0 420 120" style={{ width: '100%', height: 120 }} aria-label="Comparaison revenus médians par territoire">
          {incomes.map((d, i) => {
            const barH = (d.rev / 24000) * 80;
            const x = i * 68 + 14;
            const y = 95 - barH;
            return (
              <g key={d.t}>
                <rect x={x} y={y} width={48} height={barH} rx={4} fill={`${d.color}33`} stroke={d.color} strokeWidth={1.2} />
                <text x={x + 24} y={90} textAnchor="middle" fill={d.color} fontSize="9" fontWeight="bold">
                  {(d.rev / 1000).toFixed(1)}k€
                </text>
                <text x={x + 24} y={104} textAnchor="middle" fill="#64748b" fontSize="7.5">{d.flag} {d.t.split(' ')[0]}</text>
              </g>
            );
          })}
          <line x1={8} y1={95} x2={415} y2={95} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
        </svg>
      </div>

      {/* Poverty rates table */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Taux de pauvreté (seuil 60 % rev. médian) vs métropole</p>
        {incomes.map(d => {
          const relPauvrete = (d.pauvrete / 15.6);
          return (
            <div key={d.t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.85rem', minWidth: 20 }}>{d.flag}</span>
              <span style={{ fontSize: '0.75rem', color: '#e2e8f0', minWidth: 100 }}>{d.t}</span>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (d.pauvrete / 80) * 100)}%`, background: d.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: d.color, minWidth: 52, textAlign: 'right' }}>{d.pauvrete} %</span>
              {d.t !== 'France métro.' && (
                <span style={{ ...accent(d.color), fontSize: '0.62rem' }}>×{relPauvrete.toFixed(1)}</span>
              )}
            </div>
          );
        })}
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.65rem', color: '#475569' }}>
          ×N = multiplicateur par rapport au taux métropolitain (15,6 %). Source : INSEE — Pauvreté dans les DOM 2021.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'INSEE — Revenus Disponibles Localisés 2021', url: 'https://www.insee.fr/fr/statistiques/6436428', year: '2021' }} />
        <SourcePill source={{ label: 'INSEE — Taux de pauvreté DOM', url: 'https://www.insee.fr/fr/statistiques/6527766', year: '2021' }} />
        <SourcePill source={{ label: 'IEDOM — Rapport annuel Mayotte', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html', year: '2023' }} />
      </div>
    </div>
  );
}

// ─── Slide 7 — Solutions ────────────────────────────────────────────────────────
function SolutionsSlide() {
  const tools = [
    {
      emoji: '🛡️',
      title: 'Bouclier Qualité Prix (BQP)',
      desc: 'Accord annuel entre l\'État, les distributeurs et les industriels fixant une liste de produits à prix modérés. Renouvelé chaque année depuis 2013 dans chaque DROM.',
      source: { label: 'economie.gouv.fr — BQP', url: 'https://www.economie.gouv.fr/outre-mer/bouclier-qualite-prix' },
      color: '#22c55e',
    },
    {
      emoji: '🤝',
      title: 'EOPE — Accord-cadre prices',
      desc: "L'Engagement de Modération des Prix à l'importation (EOPE) est un protocole entre les importateurs, les distributeurs et les chambres de commerce pour limiter les marges sur un panier de produits.",
      source: { label: 'IEDOM — EOPE', url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html' },
      color: '#3b82f6',
    },
    {
      emoji: '📊',
      title: 'Observatoire des prix DOM',
      desc: "Chaque préfecture de DROM anime un Observatoire des Prix, des Marges et des Revenus (OPMR) qui surveille l'évolution des prix et publie des rapports trimestriels.",
      source: { label: 'OPMR Guadeloupe', url: 'https://www.guadeloupe.gouv.fr/Politiques-publiques/Economie-emploi-et-entreprises/Observatoire-des-Prix-des-Marges-et-des-Revenus' },
      color: '#a855f7',
    },
    {
      emoji: '📱',
      title: 'A KI PRI SA YÉ — Observatoire citoyen',
      desc: "Notre plateforme vous permet de comparer les prix en temps réel entre les territoires et les enseignes, de signaler des anomalies et de suivre l'évolution du coût de la vie.",
      source: { label: 'akiprisaye.pf', url: '/' },
      color: '#6366f1',
    },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Face à la vie chère, des mécanismes existent — mais leur efficacité dépend de la mobilisation
        collective. Voici les outils <strong style={{ color: '#e2e8f0' }}>officiels et citoyens</strong> à votre disposition.
      </p>

      {tools.map(t => (
        <div key={t.title} style={{ ...card(), borderLeft: `3px solid ${t.color}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>{t.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 0.35rem', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 700 }}>{t.title}</p>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>{t.desc}</p>
              <SourcePill source={t.source} />
            </div>
          </div>
        </div>
      ))}

      {/* CTA */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', paddingTop: '0.5rem' }}>
        <Link
          to="/comparateur"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.3rem', borderRadius: 8, background: 'rgba(99,102,241,0.8)', color: '#fff', fontSize: '0.83rem', fontWeight: 700, textDecoration: 'none' }}
        >
          🔍 Comparer les prix maintenant
        </Link>
        <Link
          to="/comprendre-prix"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.3rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none' }}
        >
          📖 Guide complet
        </Link>
      </div>
    </div>
  );
}

// ─── Slide content map ──────────────────────────────────────────────────────────
const SLIDE_CONTENT: Record<string, React.FC> = {
  cover:     CoverSlide,
  constat:   ConstatSlide,
  fret:      FretSlide,
  octroi:    OctroimerSlide,
  marche:    MarcheSlide,
  pouvoir:   PouvoirSlide,
  solutions: SolutionsSlide,
};

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function ConferencePrix() {
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
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Back link */}
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Retour à l'accueil
          </Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.conferencePrix}
          alt="Conférence — Comprendre les prix dans les DOM"
          gradient="from-slate-950 to-purple-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            🎓 Conférence — Comprendre les prix dans les DOM
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
            6 diapositives pour expliquer la vie chère aux Antilles et en Outre-Mer
          </p>
        </HeroImage>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
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
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>{slide.title}</h1>
              {slide.subtitle && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>{slide.subtitle}</p>}
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

          <span style={{ fontSize: '0.75rem', color: '#475569' }}>
            Touches ← → pour naviguer
          </span>

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
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Plan de la présentation</p>
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
                  fontSize: '0.72rem', fontWeight: i === current ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {s.emoji} {s.title}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
