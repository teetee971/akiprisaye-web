/**
 * ConferenceEau.tsx
 *
 * Conférence institutionnelle ultra-expert : L'Eau dans les DOM — Service public en crise
 * 8 diapositives — Niveau experts institutionnels, élus, chercheurs, haut fonctionnaires
 *
 * Sources des données :
 *  Cour des Comptes — Services d'eau et d'assainissement dans les DOM (2020)
 *  DGALN / SISPEA — Données eau et assainissement (2022-2023)
 *  Directive UE 2020/2184 du 16 décembre 2020 — EUR-Lex
 *  Loi LEMA n° 2006-1772 du 30 déc. 2006 — Légifrance
 *  Code de l'environnement — art. L210-1 (Légifrance)
 *  Plan Eau 2023 — 53 mesures — Ministère de la Transition écologique
 *  ARS Guadeloupe, Martinique, La Réunion, Guyane, Mayotte — Rapports 2022-2024
 *  UFC-Que Choisir — Comparatif tarifs eau 2023
 *  BRGM — Ressources en eaux souterraines DOM (2023)
 *  Plan chlordécone IV (2021-2027) — Ministères Santé & Agriculture
 *  Contrats de Convergence et de Transformation (CCT) 2023-2027
 *  INSEE — Enquête niveaux de vie DOM 2022-2023
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { UpgradeGate } from '../components/billing/UpgradeGate';

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

// ─── Slides ─────────────────────────────────────────────────────────────────────
const SLIDES: Slide[] = [
  {
    id: 'cover',
    emoji: '💧',
    title: "L'Eau dans les DOM — Service public en crise",
    subtitle: 'Conférence institutionnelle · Experts, élus & haut fonctionnaires',
    accentColor: '#0891b2',
  },
  {
    id: 'cartographie',
    emoji: '🗺️',
    title: "Cartographie de l'accès à l'eau potable",
    subtitle: 'Taux de raccordement, zones à risque, écarts territoriaux',
    accentColor: '#2563eb',
  },
  {
    id: 'qualite',
    emoji: '🔬',
    title: "Qualité de l'eau : conformité et contaminations",
    subtitle: 'Chlordécone, turbidité, normes EU 2020/2184',
    accentColor: '#059669',
  },
  {
    id: 'tarifs',
    emoji: '💰',
    title: 'Analyse des tarifs : un écart structurel',
    subtitle: 'Comparaison DOM/métropole, mécanismes de formation des prix',
    accentColor: '#d97706',
  },
  {
    id: 'infrastructure',
    emoji: '🔧',
    title: 'État des réseaux : sous-investissement chronique',
    subtitle: 'Taux de fuite, vétusté, besoins de renouvellement',
    accentColor: '#dc2626',
  },
  {
    id: 'financement',
    emoji: '📈',
    title: "Financement & gouvernance des services d'eau",
    subtitle: 'FEDER, CCT, DSP, Plan Eau 2023 — acteurs et circuits',
    accentColor: '#7c3aed',
  },
  {
    id: 'mayotte_guyane',
    emoji: '🚨',
    title: 'Focus urgence : Mayotte et Guyane',
    subtitle: 'Les situations les plus critiques de la République',
    accentColor: '#c026d3',
  },
  {
    id: 'recommandations',
    emoji: '📋',
    title: 'Recommandations institutionnelles',
    subtitle: 'Ce que les données imposent aux décideurs',
    accentColor: '#16a34a',
  },
];

// ─── Shared style helpers ────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(15,23,42,0.75)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 14,
  padding: '1rem 1.2rem',
  ...extra,
});

// ─── Source pill ──────────────────────────────────────────────────────────────────
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
        background: 'rgba(8,145,178,0.08)',
        border: '1px solid rgba(8,145,178,0.3)',
        color: '#67e8f9',
        fontSize: '0.68rem',
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(8,145,178,0.2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(8,145,178,0.08)';
      }}
    >
      🔗 {source.label}
      {source.year ? ` (${source.year})` : ''}
    </a>
  );
}

// ─── Slide 1 — Cover ─────────────────────────────────────────────────────────────
function CoverSlide() {
  const keyFigures = [
    { v: '+81%', l: 'Surcoût moyen\ntarif eau DOM/Métropole', c: '#0891b2' },
    { v: '~60%', l: 'Taux de fuite\nréseau Guadeloupe', c: '#dc2626' },
    { v: '~18%', l: 'Pop. Mayotte\nsans eau potable réseau', c: '#d97706' },
    { v: '~800 M€', l: 'FEDER eau DOM\nProg. 2021-2027', c: '#7c3aed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7 }}>
        L'accès à l'eau potable est un{' '}
        <strong style={{ color: '#fff' }}>droit humain fondamental</strong> reconnu par l'ONU en
        2010. Dans les territoires d'outre-mer français, ce droit reste fragile : infrastructures
        vieillissantes, contaminations historiques, tarifs inéquitables et crises
        d'approvisionnement récurrentes. Cette conférence analyse les données disponibles avec la
        rigueur que les enjeux de santé publique imposent.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.65rem' }}>
        {keyFigures.map((f) => (
          <div
            key={f.l}
            style={{
              padding: '0.85rem',
              borderRadius: 12,
              background: `${f.c}15`,
              border: `1px solid ${f.c}44`,
            }}
          >
            <p
              style={{
                margin: '0 0 0.3rem',
                fontSize: '1.3rem',
                fontWeight: 900,
                color: f.c,
                lineHeight: 1,
              }}
            >
              {f.v}
            </p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {f.l.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      {/* DOM bars access to water */}
      <div style={card()}>
        <p
          style={{
            margin: '0 0 0.6rem',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Taux de raccordement réseau eau potable (%)
        </p>
        {[
          { t: 'La Réunion 🇷🇪', v: 98, c: '#4ade80' },
          { t: 'Martinique 🇲🇶', v: 97, c: '#22d3ee' },
          { t: 'Guadeloupe 🇬🇵', v: 95, c: '#60a5fa' },
          { t: 'Guyane 🇬🇫', v: 82, c: '#f59e0b' },
          { t: 'Mayotte 🇾🇹', v: 82, c: '#ef4444' },
        ].map((row) => (
          <div
            key={row.t}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.45rem',
            }}
          >
            <span style={{ fontSize: '0.69rem', color: '#e2e8f0', minWidth: 128 }}>{row.t}</span>
            <div
              style={{
                flex: 1,
                height: 7,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{ height: '100%', width: `${row.v}%`, background: row.c, borderRadius: 3 }}
              />
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: row.c,
                minWidth: 36,
                textAlign: 'right',
              }}
            >
              {row.v}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'ARS DOM — Rapports qualité eau 2023',
            url: 'https://www.guadeloupe.ars.sante.fr/qualite-de-leau-du-robinet',
            year: '2023',
          }}
        />
        <SourcePill
          source={{
            label: 'SISPEA / DGALN',
            url: 'https://www.services.eaufrance.fr/',
            year: '2023',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 2 — Cartographie ──────────────────────────────────────────────────────
function CartographieSlide() {
  const territoires = [
    {
      name: 'Guadeloupe 🇬🇵',
      raccordement: 95,
      fuite: 60,
      conformite: 90,
      prix: 4.85,
      note: 'Réseau raccordé mais coupures fréquentes. Plan urgence déclenché 2022.',
      c: '#60a5fa',
    },
    {
      name: 'Martinique 🇲🇶',
      raccordement: 97,
      fuite: 35,
      conformite: 93,
      prix: 3.95,
      note: 'Gestion intercommunale ODYSSI + CAP Nord. Traces chlordécone.',
      c: '#818cf8',
    },
    {
      name: 'La Réunion 🇷🇪',
      raccordement: 98,
      fuite: 22,
      conformite: 97,
      prix: 2.8,
      note: 'Réseau le mieux entretenu. SPL + Suez. Arsenic naturel géré.',
      c: '#4ade80',
    },
    {
      name: 'Guyane 🇬🇫',
      raccordement: 82,
      fuite: 45,
      conformite: 87,
      prix: 3.5,
      note: 'Zones isolées non raccordées. Mercure orpaillage illégal.',
      c: '#f59e0b',
    },
    {
      name: 'Mayotte 🇾🇹',
      raccordement: 82,
      fuite: 42,
      conformite: 81,
      prix: 5.2,
      note: 'Crise structurelle. Restrictions jour sur 2 en 2024. Le plus cher.',
      c: '#ef4444',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Les cinq DROM présentent des situations{' '}
        <strong style={{ color: '#fff' }}>très hétérogènes</strong> en matière d'accès à l'eau. La
        Réunion est proche des standards métropolitains, tandis que Mayotte et la Guyane intérieure
        connaissent des situations de sous-raccordement chronique.
      </p>

      {territoires.map((t) => (
        <div key={t.name} style={card({ borderLeft: `3px solid ${t.c}`, padding: '0.85rem 1rem' })}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: t.c }}>
            {t.name}
          </p>
          <p
            style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}
          >
            {t.note}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.4rem' }}>
            {[
              {
                label: 'Raccordement',
                val: `${t.raccordement}%`,
                c2: t.raccordement > 95 ? '#4ade80' : t.raccordement > 88 ? '#f59e0b' : '#ef4444',
              },
              {
                label: 'Taux fuite',
                val: `${t.fuite}%`,
                c2: t.fuite < 25 ? '#4ade80' : t.fuite < 40 ? '#f59e0b' : '#ef4444',
              },
              {
                label: 'Conformité',
                val: `${t.conformite}%`,
                c2: t.conformite > 96 ? '#4ade80' : t.conformite > 90 ? '#f59e0b' : '#ef4444',
              },
              {
                label: 'Prix m³ EP',
                val: `${t.prix} €`,
                c2: t.prix < 3.0 ? '#4ade80' : t.prix < 4.5 ? '#f59e0b' : '#ef4444',
              },
            ].map((m) => (
              <div
                key={m.label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  padding: '0.45rem 0.5rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: m.c2 }}>
                  {m.val}
                </p>
                <p style={{ margin: 0, fontSize: '0.58rem', color: '#64748b', lineHeight: 1.3 }}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'SISPEA — Données eau DOM 2022',
            url: 'https://www.services.eaufrance.fr/',
            year: '2022',
          }}
        />
        <SourcePill
          source={{
            label: 'ARS Réunion 2023',
            url: 'https://www.lareunion.ars.sante.fr/qualite-de-leau',
            year: '2023',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 3 — Qualité ───────────────────────────────────────────────────────────
function QualiteSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        La qualité de l'eau potable dans les DOM est soumise aux mêmes normes européennes qu'en
        métropole (Directive 2020/2184). Néanmoins, plusieurs risques spécifiques persistent et
        représentent des enjeux de santé publique majeurs.
      </p>

      {/* Chlordecone warning */}
      <div
        style={{
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 12,
          padding: '0.85rem',
        }}
      >
        <p style={{ margin: '0 0 0.4rem', fontWeight: 700, color: '#fca5a5', fontSize: '0.85rem' }}>
          🧪 Chlordécone : contamination persistante aux Antilles
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#fecaca', lineHeight: 1.6 }}>
          Pesticide organochloré utilisé de 1972 à 1993 dans les bananeraies. Classé cancérigène
          possible (CIRC 2B). Contamination des sols estimée à <strong>plusieurs décennies</strong>.
          Zones impactées : Nord Basse-Terre, Nord Grande-Terre (GP), Nord-Atlantique, Nord-Caraïbe
          (MQ). Plan chlordécone IV (2021-2027) : 92 M€ de mesures.
        </p>
      </div>

      {/* Conformity table */}
      <div style={card({ padding: '0.75rem' })}>
        <p
          style={{
            margin: '0 0 0.6rem',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Conformité des eaux distribuées — ARS 2023
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
            gap: '0.3rem',
            fontSize: '0.68rem',
          }}
        >
          <div style={{ color: '#64748b', fontWeight: 600 }}>Territoire</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>Bactério.</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>Physico-ch.</div>
          <div style={{ color: '#64748b', fontWeight: 600 }}>Risques</div>
          {[
            {
              t: 'Guadeloupe',
              b: '92%',
              pc: '88%',
              r: 'Chlordécone, turbidité',
              bc: '#f59e0b',
              pcc: '#ef4444',
            },
            {
              t: 'Martinique',
              b: '96%',
              pc: '91%',
              r: 'Chlordécone traces',
              bc: '#22d3ee',
              pcc: '#f59e0b',
            },
            {
              t: 'La Réunion',
              b: '98%',
              pc: '97%',
              r: 'Arsenic (volc.)',
              bc: '#4ade80',
              pcc: '#4ade80',
            },
            {
              t: 'Guyane',
              b: '89%',
              pc: '85%',
              r: 'Turbidité, microbiologie',
              bc: '#f59e0b',
              pcc: '#ef4444',
            },
            {
              t: 'Mayotte',
              b: '84%',
              pc: '79%',
              r: 'Turbidité, nitrates',
              bc: '#ef4444',
              pcc: '#ef4444',
            },
          ].map((row) => (
            <>
              <div key={row.t + 't'} style={{ color: '#e2e8f0', padding: '0.2rem 0' }}>
                {row.t}
              </div>
              <div
                key={row.t + 'b'}
                style={{ color: row.bc, fontWeight: 700, padding: '0.2rem 0' }}
              >
                {row.b}
              </div>
              <div
                key={row.t + 'pc'}
                style={{ color: row.pcc, fontWeight: 700, padding: '0.2rem 0' }}
              >
                {row.pc}
              </div>
              <div
                key={row.t + 'r'}
                style={{ color: '#94a3b8', padding: '0.2rem 0', fontSize: '0.62rem' }}
              >
                {row.r}
              </div>
            </>
          ))}
        </div>
      </div>

      {/* Directive EU */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: '#60a5fa', fontSize: '0.78rem' }}>
          ⚖️ Directive UE 2020/2184 — Nouvelles obligations
        </p>
        {[
          "Abaissement du seuil plomb : 10 µg/L → 5 µg/L d'ici 2036",
          'Publication obligatoire des données de qualité en ligne',
          "Accès à l'eau pour les populations vulnérables",
          "Évaluation des risques sur l'ensemble du cycle (captage → robinet)",
        ].map((item) => (
          <p
            key={item}
            style={{ margin: '0.25rem 0', fontSize: '0.72rem', color: '#bfdbfe', lineHeight: 1.5 }}
          >
            ✓ {item}
          </p>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'Directive UE 2020/2184 — EUR-Lex',
            url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32020L2184',
            year: '2020',
          }}
        />
        <SourcePill
          source={{
            label: 'Plan chlordécone IV 2021-2027',
            url: 'https://www.gouvernement.fr/plan-chlordecone-iv-2021-2027',
            year: '2021',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 4 — Tarifs ────────────────────────────────────────────────────────────
function TarifsSlide() {
  const tarifs = [
    { organisme: 'GDEG — Guadeloupe', ep: 4.85, as: 2.45, ab: 9.75, c: '#60a5fa' },
    { organisme: 'Régie Basse-Terre — GP', ep: 4.6, as: 1.9, ab: 9.2, c: '#60a5fa' },
    { organisme: 'ODYSSI — Martinique', ep: 3.95, as: 2.2, ab: 8.5, c: '#818cf8' },
    { organisme: 'CAP Nord — Martinique', ep: 4.1, as: 2.35, ab: 8.9, c: '#818cf8' },
    { organisme: 'SPL Eau Réunion — Nord', ep: 2.8, as: 1.65, ab: 7.2, c: '#4ade80' },
    { organisme: 'CISE Réunion — Ouest', ep: 3.1, as: 1.8, ab: 7.8, c: '#4ade80' },
    { organisme: 'EEG — Cayenne (Guyane)', ep: 3.5, as: 1.95, ab: 8.1, c: '#f59e0b' },
    { organisme: 'SMEG — Mayotte', ep: 5.2, as: 0, ab: 12.4, c: '#ef4444' },
    { organisme: 'Métropole (médiane)', ep: 2.1, as: 1.55, ab: 6.5, c: '#94a3b8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        La tarification de l'eau est une compétence{' '}
        <strong style={{ color: '#fff' }}>communale ou intercommunale</strong>. Dans les DOM, la
        combinaison de réseaux dégradés, de faibles économies d'échelle et de coûts de traitement
        élevés engendre des tarifs systématiquement supérieurs à la médiane nationale.
      </p>

      {/* Key figures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
        {[
          { v: '+81%', l: 'Surcoût moyen\nDOM / Métropole', c: '#d97706' },
          { v: '5,20 €', l: 'Prix m³ le plus élevé\n(SMEG Mayotte)', c: '#ef4444' },
          { v: 'x3', l: 'Variation max.\nintra-territoire', c: '#818cf8' },
        ].map((f) => (
          <div
            key={f.l}
            style={{
              padding: '0.7rem',
              borderRadius: 10,
              background: `${f.c}15`,
              border: `1px solid ${f.c}44`,
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 900, color: f.c }}>
              {f.v}
            </p>
            <p style={{ margin: 0, fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {f.l.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart simulation */}
      <div style={card()}>
        <p
          style={{
            margin: '0 0 0.6rem',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Prix m³ eau potable par organisme — SISPEA 2023
        </p>
        {tarifs
          .filter((t) => t.ep > 0)
          .map((t) => (
            <div
              key={t.organisme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ fontSize: '0.62rem', color: '#e2e8f0', minWidth: 150, flexShrink: 0 }}>
                {t.organisme}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(t.ep / 5.5) * 100}%`,
                    background: t.c,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: t.c,
                  minWidth: 42,
                  textAlign: 'right',
                }}
              >
                {t.ep.toFixed(2)} €
              </span>
            </div>
          ))}
      </div>

      <div
        style={card({ background: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.25)' })}
      >
        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: '#fcd34d', fontSize: '0.78rem' }}>
          📌 Facteurs structurels de la vie chère de l'eau
        </p>
        <div style={{ fontSize: '0.72rem', color: '#fde68a', lineHeight: 1.7 }}>
          <span>① Taux de fuite élevé → coût de production réparti sur moins d'eau livrée</span>
          <br />
          <span>② Importation des matériaux (effet Octroi de Mer sur équipements)</span>
          <br />
          <span>③ Faibles économies d'échelle (bassins de 100k–500k hab.)</span>
          <br />
          <span>④ Coûts de traitement accrus (turbidité, contaminations)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'UFC-Que Choisir — Tarifs eau 2023',
            url: 'https://www.quechoisir.org/',
            year: '2023',
          }}
        />
        <SourcePill
          source={{
            label: 'SISPEA / DGALN',
            url: 'https://www.services.eaufrance.fr/',
            year: '2023',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 5 — Infrastructure ────────────────────────────────────────────────────
function InfrastructureSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        La Cour des Comptes (2020) a documenté des décennies de{' '}
        <strong style={{ color: '#fff' }}>sous-investissement</strong> dans les réseaux d'eau des
        DOM. Le résultat : des taux de fuite jusqu'à 3× supérieurs à la métropole et des
        canalisations datant des années 1960-1970 encore en service.
      </p>

      {/* Leakage rates */}
      <div style={card()}>
        <p
          style={{
            margin: '0 0 0.6rem',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Taux de perte sur réseau (eau non comptabilisée)
        </p>
        {[
          { t: 'Guadeloupe', v: 60, note: '⚠️ Crise — plan urgence État 2022', c: '#ef4444' },
          { t: 'Guyane', v: 45, note: 'Réseaux ruraux vétustes', c: '#f59e0b' },
          { t: 'Mayotte', v: 42, note: 'Réseau partiel, extensions en cours', c: '#f59e0b' },
          { t: 'Martinique', v: 35, note: 'Amélioration via ODYSSI', c: '#fbbf24' },
          { t: 'La Réunion', v: 22, note: 'Proche de la métropole', c: '#4ade80' },
          { t: 'Métropole', v: 20, note: 'Référence nationale — ONEMA', c: '#94a3b8' },
        ].map((row) => (
          <div
            key={row.t}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}
          >
            <span style={{ fontSize: '0.68rem', color: '#e2e8f0', minWidth: 90 }}>{row.t}</span>
            <div
              style={{
                flex: 1,
                height: 8,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{ height: '100%', width: `${row.v}%`, background: row.c, borderRadius: 3 }}
              />
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: row.c,
                minWidth: 36,
                textAlign: 'right',
              }}
            >
              {row.v}%
            </span>
            <span style={{ fontSize: '0.6rem', color: '#64748b', minWidth: 140 }}>{row.note}</span>
          </div>
        ))}
      </div>

      {/* Key data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
        {[
          {
            v: '35–50 ans',
            l: 'Âge moyen canalisations DOM\n(Cour des Comptes 2020)',
            c: '#dc2626',
          },
          { v: '~4 200 km', l: 'Réseau Guadeloupe\ndont ~40% à rénover', c: '#f59e0b' },
          { v: '~2,5 Md€', l: "Besoins d'invest. DOM\nhorizon 2030 (État)", c: '#818cf8' },
        ].map((f) => (
          <div
            key={f.l}
            style={{
              padding: '0.7rem',
              borderRadius: 10,
              background: `${f.c}15`,
              border: `1px solid ${f.c}44`,
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', fontWeight: 900, color: f.c }}>
              {f.v}
            </p>
            <p style={{ margin: 0, fontSize: '0.58rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {f.l.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 ? <br /> : null}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <div style={card()}>
        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: '#67e8f9', fontSize: '0.78rem' }}>
          🎯 Objectif Plan Eau 2023 pour les DOM
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#a5f3fc', lineHeight: 1.65 }}>
          Porter le taux de fuite sous <strong>30%</strong> dans tous les DOM d'ici 2030. Cela
          nécessite de <strong>tripler</strong> le rythme actuel de renouvellement des canalisations
          (de 0,3 % à ~1 % du réseau par an). Financement prévu : FEDER 2021-2027 (~800 M€ eau DOM)
          + crédits CCT 2023-2027 + Plan Eau 50 M€ urgence DOM.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'Cour des Comptes — Services eau DOM (2020)',
            url: 'https://www.ccomptes.fr/fr/publications/les-services-deau-et-dassainissement-dans-les-departements-doutre-mer',
            year: '2020',
          }}
        />
        <SourcePill
          source={{
            label: 'Plan Eau 2023 — 53 mesures',
            url: 'https://www.ecologie.gouv.fr/plan-eau',
            year: '2023',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 6 — Financement & Gouvernance ─────────────────────────────────────────
function FinancementSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        La gestion de l'eau est <strong style={{ color: '#fff' }}>une compétence communale</strong>{' '}
        en France. Les communes peuvent déléguer à un opérateur privé (DSP) ou gérer en régie
        directe. Dans les DOM, cette gouvernance fragmentée a historiquement nui aux investissements
        de long terme.
      </p>

      {/* Funding sources */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontWeight: 600, color: '#c4b5fd', fontSize: '0.8rem' }}>
          💶 Sources de financement des investissements eau DOM
        </p>
        {[
          {
            label: 'FEDER eau (Prog. 2021-2027)',
            montant: '~800 M€',
            note: 'Fonds européens développement régional',
            c: '#4ade80',
          },
          {
            label: 'CCT 2023-2027 (État + collectivités)',
            montant: '~350 M€',
            note: 'Contrats de Convergence et de Transformation',
            c: '#22d3ee',
          },
          {
            label: 'Plan Eau 2023 — volet outre-mer',
            montant: '~50 M€',
            note: 'Enveloppe urgence réseaux DOM (mars 2023)',
            c: '#60a5fa',
          },
          {
            label: 'Plan urgence Guadeloupe 2022',
            montant: '40 M€',
            note: "Débloqué d'urgence par l'État",
            c: '#f59e0b',
          },
          {
            label: 'Plan urgence Mayotte 2024',
            montant: '400 M€',
            note: 'Investissement décennal annoncé 2024-2027',
            c: '#ef4444',
          },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: f.c, minWidth: 56 }}>
              {f.montant}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#e2e8f0', fontWeight: 600 }}>
                {f.label}
              </p>
              <p style={{ margin: 0, fontSize: '0.62rem', color: '#94a3b8' }}>{f.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Governance modes */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontWeight: 600, color: '#c4b5fd', fontSize: '0.8rem' }}>
          🏛️ Modes de gestion des services d'eau dans les DOM
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {[
            {
              title: 'Délégation de Service Public (DSP)',
              corps:
                'Un opérateur privé (Veolia/GDEG, Suez/CISE, Veolia/SMEG) gère le réseau pour une durée déterminée (10-25 ans). Retour des actifs en fin de contrat.',
              avantage: 'Expertise technique, investissements privés',
              limite: 'Rente de situation, faible contrôle public des coûts',
              c: '#818cf8',
            },
            {
              title: 'Régie directe / SPL',
              corps:
                'La collectivité gère directement (régie) ou via une Société Publique Locale (SPL). Ex : SPL Eau de La Réunion, Régie de Basse-Terre.',
              avantage: 'Contrôle public, transparence tarifaire',
              limite: 'Capacité technique et financière variable',
              c: '#22d3ee',
            },
          ].map((m) => (
            <div
              key={m.title}
              style={{
                background: `${m.c}10`,
                border: `1px solid ${m.c}30`,
                borderRadius: 10,
                padding: '0.65rem',
              }}
            >
              <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: m.c, fontSize: '0.72rem' }}>
                {m.title}
              </p>
              <p
                style={{
                  margin: '0 0 0.3rem',
                  fontSize: '0.67rem',
                  color: '#cbd5e1',
                  lineHeight: 1.5,
                }}
              >
                {m.corps}
              </p>
              <p style={{ margin: '0 0 0.15rem', fontSize: '0.62rem', color: '#4ade80' }}>
                ✓ {m.avantage}
              </p>
              <p style={{ margin: 0, fontSize: '0.62rem', color: '#f87171' }}>✗ {m.limite}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'CCT 2023-2027 — CGET',
            url: 'https://www.cohesion-territoires.gouv.fr/',
            year: '2023',
          }}
        />
        <SourcePill
          source={{
            label: 'Loi LEMA 2006-1772 — Légifrance',
            url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000649171/',
            year: '2006',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 7 — Mayotte & Guyane ──────────────────────────────────────────────────
function MayotteGuyaneSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Mayotte et la Guyane présentent les situations les plus critiques de l'ensemble du
        territoire national en matière d'accès à l'eau potable. Ces deux territoires nécessitent une
        approche d'<strong style={{ color: '#fff' }}>urgence humanitaire nationale</strong>.
      </p>

      {/* Mayotte */}
      <div
        style={{
          background: 'rgba(220,38,38,0.07)',
          border: '1px solid rgba(220,38,38,0.25)',
          borderRadius: 14,
          padding: '0.9rem',
        }}
      >
        <p style={{ margin: '0 0 0.6rem', fontWeight: 700, color: '#fca5a5', fontSize: '0.9rem' }}>
          🚨 Mayotte : état d'urgence hydrique structurel
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '0.4rem',
            marginBottom: '0.6rem',
          }}
        >
          {[
            { v: '~18%', l: 'Pop. sans réseau\neau potable' },
            { v: '~42%', l: 'Taux de fuite\nréseau SMEG' },
            { v: '5,20 €', l: 'Prix m³\nle plus élevé DOM' },
          ].map((f) => (
            <div
              key={f.l}
              style={{
                background: 'rgba(220,38,38,0.12)',
                borderRadius: 8,
                padding: '0.5rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.1rem',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: '#fca5a5',
                }}
              >
                {f.v}
              </p>
              <p style={{ margin: 0, fontSize: '0.58rem', color: '#fecaca', lineHeight: 1.3 }}>
                {f.l.split('\n').map((l, i) => (
                  <span key={i}>
                    {l}
                    {i === 0 ? <br /> : null}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#fecaca', lineHeight: 1.65 }}>
          En 2024, des restrictions sévères (alimentation <strong>1 jour sur 2</strong> dans
          certaines zones) ont été maintenues pendant plusieurs semaines. Causes : sécheresse
          exceptionnelle (-40% précipitations), retards de la retenue de Dzoumogné, réseau dégradé.{' '}
          <strong>Plan urgence 400 M€ annoncé pour 2024-2027.</strong>
        </p>
      </div>

      {/* Guyane */}
      <div
        style={{
          background: 'rgba(217,119,6,0.07)',
          border: '1px solid rgba(217,119,6,0.25)',
          borderRadius: 14,
          padding: '0.9rem',
        }}
      >
        <p style={{ margin: '0 0 0.6rem', fontWeight: 700, color: '#fcd34d', fontSize: '0.9rem' }}>
          🌿 Guyane : l'enjeu des zones isolées (84 000 km²)
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '0.4rem',
            marginBottom: '0.6rem',
          }}
        >
          {[
            { v: '~15 000', l: 'Hab. zones fleuve\nsans réseau public' },
            { v: '~8', l: 'Communes\nnon raccordées' },
            { v: '~45%', l: 'Taux fuite\nréseau Cayenne' },
          ].map((f) => (
            <div
              key={f.l}
              style={{
                background: 'rgba(217,119,6,0.12)',
                borderRadius: 8,
                padding: '0.5rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.1rem',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: '#fcd34d',
                }}
              >
                {f.v}
              </p>
              <p style={{ margin: 0, fontSize: '0.58rem', color: '#fde68a', lineHeight: 1.3 }}>
                {f.l.split('\n').map((l, i) => (
                  <span key={i}>
                    {l}
                    {i === 0 ? <br /> : null}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#fde68a', lineHeight: 1.65 }}>
          Les communautés amérindiennes et bushinengué de l'intérieur dépendent de l'eau de pluie et
          des fleuves sans traitement standardisé. La pollution au{' '}
          <strong>mercure par l'orpaillage illégal</strong> aggrave la situation dans les zones
          minières.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'ARS Mayotte — Rapport eau 2023',
            url: 'https://www.mayotte.ars.sante.fr/',
            year: '2023',
          }}
        />
        <SourcePill
          source={{
            label: 'ARS Guyane — Eau et santé',
            url: 'https://www.guyane.ars.sante.fr/',
            year: '2023',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide 8 — Recommandations ───────────────────────────────────────────────────
function RecommandationsSlide() {
  const recs = [
    {
      n: '1',
      title: 'Plan décennal de renouvellement des réseaux',
      detail:
        "Porter le taux annuel de renouvellement de 0,3 % à 1,5 % dans les DOM les plus déficitaires. Objectif : taux de fuite < 30 % dans tous les DROM d'ici 2030.",
      c: '#22d3ee',
      impact: 'Élevé',
      faisabilité: 'Moyen',
    },
    {
      n: '2',
      title: 'Gouvernance territoriale unifiée eau-assainissement',
      detail:
        'Consolider la gouvernance au niveau intercommunal dans les DOM encore fragmentés. Modèle : ODYSSI Martinique ou SPL Eau de La Réunion comme références.',
      c: '#60a5fa',
      impact: 'Élevé',
      faisabilité: 'Moyen',
    },
    {
      n: '3',
      title: 'Transparence tarifaire et benchmarking public',
      detail:
        'Obligation annuelle de publication des données SISPEA + rapport comparatif DOM édité par la DGALN. Outil citoyen en accès libre (cf. comparateur A KI PRI SA YÉ).',
      c: '#4ade80',
      impact: 'Moyen',
      faisabilité: 'Élevé',
    },
    {
      n: '4',
      title: "Allocation d'eau vitale gratuite (premiers m³)",
      detail:
        "Expérimentation d'une franchise eau (10 m³/mois/foyer) dans les territoires les plus pauvres. Financement par solidarité nationale (taxe progressive au-delà du seuil).",
      c: '#a78bfa',
      impact: 'Élevé',
      faisabilité: 'Moyen',
    },
    {
      n: '5',
      title: "Plan d'urgence Mayotte : gouvernance directe État",
      detail:
        "Nommer un Délégué interministériel à l'eau de Mayotte. Plan décennal 400 M€ avec jalons annuels, gouvernance mixte État-Département-SMEG.",
      c: '#ef4444',
      impact: 'Critique',
      faisabilité: 'Moyen',
    },
    {
      n: '6',
      title: 'Stations autonomes pour les zones isolées de Guyane',
      detail:
        "Déploiement de ~30 stations de traitement solaires autonomes pour les communes de l'intérieur. Partenariat État-BID-collectivités. 50 M€ sur 5 ans.",
      c: '#f59e0b',
      impact: 'Élevé',
      faisabilité: 'Moyen',
    },
    {
      n: '7',
      title: 'Réseau interDOM expertise eau (Offices + BRGM + ARS)',
      detail:
        "Créer une cellule nationale de coordination technique DOM pour partager bonnes pratiques, mutualiser les achats d'équipements et optimiser les investissements.",
      c: '#16a34a',
      impact: 'Moyen',
      faisabilité: 'Élevé',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Les données disponibles convergent vers un impératif : l'eau dans les DOM ne peut plus être
        traitée comme un enjeu de gestion ordinaire. Il s'agit d'un{' '}
        <strong style={{ color: '#fff' }}>
          enjeu de cohésion nationale et de droits fondamentaux
        </strong>
        .
      </p>

      {recs.map((r) => (
        <div key={r.n} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              flexShrink: 0,
              marginTop: 2,
              background: `${r.c}22`,
              border: `1.5px solid ${r.c}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: r.c,
            }}
          >
            {r.n}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>
                {r.title}
              </p>
              <span
                style={{
                  fontSize: '0.6rem',
                  padding: '1px 6px',
                  borderRadius: 6,
                  background: `${r.c}22`,
                  color: r.c,
                  border: `1px solid ${r.c}44`,
                }}
              >
                Impact : {r.impact}
              </span>
            </div>
            <p
              style={{
                margin: '0.2rem 0 0',
                fontSize: '0.7rem',
                color: '#94a3b8',
                lineHeight: 1.55,
              }}
            >
              {r.detail}
            </p>
          </div>
        </div>
      ))}

      <div
        style={card({ background: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.25)' })}
      >
        <p style={{ margin: '0 0 0.3rem', fontWeight: 600, color: '#86efac', fontSize: '0.78rem' }}>
          💡 Conclusion : l'eau DOM comme test de la cohésion républicaine
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#bbf7d0', lineHeight: 1.65 }}>
          La Cour des Comptes a conclu que l'État « n'a pas exercé pleinement son rôle de tutelle »
          dans les services d'eau des DOM. La correction de ces inégalités nécessite une volonté
          politique nationale soutenue, des financements pluriannuels stables et une gouvernance
          territoriale renforcée.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill
          source={{
            label: 'Cour des Comptes — Services eau DOM (2020)',
            url: 'https://www.ccomptes.fr/fr/publications/les-services-deau-et-dassainissement-dans-les-departements-doutre-mer',
            year: '2020',
          }}
        />
        <SourcePill
          source={{
            label: 'Plan Eau 2023 — Gouvernement',
            url: 'https://www.ecologie.gouv.fr/plan-eau',
            year: '2023',
          }}
        />
      </div>
    </div>
  );
}

// ─── Slide renderer ──────────────────────────────────────────────────────────────
function SlideContent({ id }: { id: string }) {
  switch (id) {
    case 'cover':
      return <CoverSlide />;
    case 'cartographie':
      return <CartographieSlide />;
    case 'qualite':
      return <QualiteSlide />;
    case 'tarifs':
      return <TarifsSlide />;
    case 'infrastructure':
      return <InfrastructureSlide />;
    case 'financement':
      return <FinancementSlide />;
    case 'mayotte_guyane':
      return <MayotteGuyaneSlide />;
    case 'recommandations':
      return <RecommandationsSlide />;
    default:
      return null;
  }
}

// ─── Main component ──────────────────────────────────────────────────────────────
const ConferenceEau: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[currentSlide];

  const prev = useCallback(() => setCurrentSlide((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => setCurrentSlide((s) => Math.min(total - 1, s + 1)), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Helmet>
        <title>
          Conférence expert : L'Eau dans les DOM — Service public en crise — A KI PRI SA YÉ
        </title>
        <meta
          name="description"
          content="Conférence institutionnelle sur l'eau dans les territoires ultramarins : tarifs, qualité, infrastructures, gouvernance, recommandations pour décideurs et élus."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/conference-eau" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/conference-eau"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/conference-eau"
        />
      </Helmet>

      {/* Hero */}
      <HeroImage
        src={PAGE_HERO_IMAGES.conferenceEau}
        alt="Conférence institutionnelle eau dans les DOM-TOM"
        gradient="from-slate-950 to-cyan-950"
        height="h-44 sm:h-56"
      >
        {/* Back nav */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/enquete-eau"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: '#94a3b8',
              textDecoration: 'none',
            }}
          >
            ← Enquête eau
          </Link>
          <Link
            to="/recherche-prix/eau"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: '#94a3b8',
              textDecoration: 'none',
            }}
          >
            💧 Comparateur prix
          </Link>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.4rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#67e8f9',
          }}
        >
          🎓 Conférence institutionnelle · Expert
        </div>
        <h1
          style={{
            margin: '0 0 0.35rem',
            fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            color: '#fff',
          }}
        >
          💧 L'Eau dans les DOM
          <br />
          Service public en crise
        </h1>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#a5f3fc' }}>
          8 diapositives · Niveau décideurs, élus, haut fonctionnaires, chercheurs
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 20,
              background: 'rgba(8,145,178,0.2)',
              border: '1px solid rgba(8,145,178,0.4)',
              fontSize: '0.65rem',
              color: '#67e8f9',
            }}
          >
            📊 ARS · SISPEA · Cour des Comptes · DGALN · Plan Eau 2023
          </span>
        </div>
      </HeroImage>

      {/* Main presentation */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        <UpgradeGate feature="PRICE_HISTORY_ADVANCED">
          {/* Progress bar */}
          <div
            style={{
              display: 'flex',
              gap: '0.3rem',
              marginBottom: '1.25rem',
              alignItems: 'center',
            }}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                title={s.title}
                aria-label={`Diapositive ${i + 1} : ${s.title}`}
                style={{
                  flex: 1,
                  height: i === currentSlide ? 6 : 4,
                  borderRadius: 3,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    i === currentSlide
                      ? slide.accentColor
                      : i < currentSlide
                        ? `${slide.accentColor}55`
                        : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {/* Slide header */}
          <div style={{ marginBottom: '1.2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.3rem',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{slide.emoji}</span>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.65rem',
                    color: slide.accentColor,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {currentSlide + 1} / {total}
                </p>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'clamp(1rem, 2.5vw, 1.35rem)',
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.2,
                  }}
                >
                  {slide.title}
                </h2>
              </div>
            </div>
            {slide.subtitle && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                {slide.subtitle}
              </p>
            )}
          </div>

          {/* Slide content */}
          <div
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: `1px solid ${slide.accentColor}30`,
              borderRadius: 18,
              padding: '1.25rem',
              marginBottom: '1.25rem',
              boxShadow: `0 0 30px ${slide.accentColor}10`,
            }}
          >
            <SlideContent id={slide.id} />
          </div>

          {/* Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <button
              onClick={prev}
              disabled={currentSlide === 0}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 10,
                border: '1px solid rgba(148,163,184,0.2)',
                background: currentSlide === 0 ? 'transparent' : 'rgba(255,255,255,0.05)',
                color: currentSlide === 0 ? '#334155' : '#e2e8f0',
                cursor: currentSlide === 0 ? 'default' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              ← Précédent
            </button>

            {/* Slide selector dots */}
            <div
              style={{
                display: 'flex',
                gap: '0.35rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(i)}
                  title={s.title}
                  aria-label={`Aller à la diapositive ${i + 1}`}
                  style={{
                    width: i === currentSlide ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: i === currentSlide ? slide.accentColor : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={currentSlide === total - 1}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 10,
                border: 'none',
                background:
                  currentSlide === total - 1 ? 'rgba(255,255,255,0.04)' : slide.accentColor,
                color: currentSlide === total - 1 ? '#334155' : '#fff',
                cursor: currentSlide === total - 1 ? 'default' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              Suivant →
            </button>
          </div>

          {/* Keyboard hint */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '0.75rem',
              fontSize: '0.65rem',
              color: '#334155',
            }}
          >
            ← → Touches clavier pour naviguer
          </p>

          {/* Bottom CTA */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
              gap: '0.65rem',
              marginTop: '2rem',
            }}
          >
            {[
              { to: '/enquete-eau', label: '📋 Dossier complet', bg: '#0891b2' },
              { to: '/recherche-prix/eau', label: '💧 Comparateur', bg: '#1e3a5f' },
              { to: '/observatoire', label: '📊 Observatoire', bg: '#1e293b' },
            ].map((btn) => (
              <Link
                key={btn.to}
                to={btn.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  borderRadius: 10,
                  background: btn.bg,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = '1';
                }}
              >
                {btn.label}
              </Link>
            ))}
          </div>
        </UpgradeGate>
      </div>
    </div>
  );
};

export default ConferenceEau;
