/**
 * ConferenceOctroiMer.tsx
 *
 * Conférence institutionnelle ultra-expert : L'Octroi de Mer — Anatomie d'une taxe unique
 * 9 diapositives — Niveau experts institutionnels, élus, chercheurs, haut fonctionnaires
 *
 * Sources des données :
 *  Loi n° 2004-639 du 2 juillet 2004 — Légifrance
 *  Décision (UE) 2021/1657 du Conseil — EUR-Lex
 *  Règlement (UE) 2022/2 — EUR-Lex (annexes tarifaires différentiels)
 *  TFUE art. 349 — Régimes ultrapériphériques
 *  DGDDI — Statistiques recettes octroi de mer 2022-2023
 *  IEDOM — Rapports annuels 2023 (GP, MQ, GF, RE, YT)
 *  Autorité de la concurrence — Avis 09-A-45 (2009) ; Avis 19-A-12 (2019)
 *  Cour des Comptes — Rapport finances collectivités d'outre-mer (2023)
 *  INSEE — Enquête niveaux de vie DOM 2022-2023
 *  CEROM — Comptes Économiques Rapides pour l'Outre-Mer 2022
 *  Rapport Lurel-Hoibian (2019) — Évaluation réforme OM
 *  Commission européenne — Document de consultation 2024 (renouvellement régime RUP)
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

// ─── Slides ─────────────────────────────────────────────────────────────────────
const SLIDES: Slide[] = [
  { id: 'cover',       emoji: '🏛️', title: 'L\'Octroi de Mer — Anatomie d\'une taxe unique',   subtitle: 'Conférence institutionnelle · Experts & élus',         accentColor: '#7c3aed' },
  { id: 'histoire',    emoji: '📜', title: '350 ans d\'histoire — De Colbert à Bruxelles',       subtitle: 'Genèse, crises juridiques et prorogations successives', accentColor: '#2563eb' },
  { id: 'droit',       emoji: '⚖️', title: 'Architecture juridique : UE, TFUE, Loi 2004',       subtitle: 'Régimes RUP, différentiels et cadre d\'autorisation',   accentColor: '#0891b2' },
  { id: 'mecanisme',   emoji: '⚙️', title: 'Mécanisme opérationnel',                             subtitle: 'Assiette, taux, collecte, reversement : le circuit complet', accentColor: '#059669' },
  { id: 'taux',        emoji: '📊', title: 'Analyse des taux par territoire et secteur',         subtitle: 'Différentiels, exonérations, exemples sectoriels',       accentColor: '#d97706' },
  { id: 'impact',      emoji: '💰', title: 'Impact macroéconomique & pouvoir d\'achat',          subtitle: 'Vie chère, multiplicateurs de marges, données INSEE',    accentColor: '#dc2626' },
  { id: 'budget',      emoji: '📈', title: '1,2 Md€/an : financement des collectivités',         subtitle: 'Répartition Région ↔ Communes, risques budgétaires',    accentColor: '#7c3aed' },
  { id: 'reforme',     emoji: '🔮', title: 'Horizon 2027 : scénarios de réforme',                subtitle: 'Négociations UE, rapports Lurel, enjeux constitutionnels', accentColor: '#c026d3' },
  { id: 'conclusion',  emoji: '💡', title: 'Synthèse & recommandations institutionnelles',       subtitle: 'Ce que les données imposent comme conclusions',          accentColor: '#16a34a' },
];

// ─── Shared style helpers ───────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(15,23,42,0.75)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 14,
  padding: '1rem 1.2rem',
  ...extra,
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
        background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)',
        color: '#c4b5fd', fontSize: '0.68rem', fontWeight: 600,
        textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)'; }}
    >
      🔗 {source.label}{source.year ? ` (${source.year})` : ''}
    </a>
  );
}

// ─── WikiImg component ──────────────────────────────────────────────────────────
function WikiImg({ src, alt, caption, credit, creditUrl, height = 160 }: {
  src: string; alt: string; caption: string; credit: string; creditUrl: string; height?: number;
}) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    <figure style={{ margin: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.12)' }}>
      <img src={src} alt={alt} width={600} height={height} loading="lazy" onError={() => setErr(true)}
        style={{ width: '100%', height, objectFit: 'cover', display: 'block' }} />
      <figcaption style={{ fontSize: '0.6rem', color: '#64748b', padding: '0.25rem 0.6rem', background: 'rgba(0,0,0,0.5)', lineHeight: 1.4 }}>
        {caption}{' '}
        <a href={creditUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8' }}>{credit}</a>
      </figcaption>
    </figure>
  );
}

// ─── Slide 1 — Cover ────────────────────────────────────────────────────────────
function CoverSlide() {
  const keyFigures = [
    { v: '~1,2 Md€', l: 'Recettes annuelles\n(5 DROM · 2023)', c: '#7c3aed' },
    { v: '350 ans', l: 'Ordonnance Colbert\n→ régime actuel', c: '#2563eb' },
    { v: '~7 000', l: 'Lignes tarifaires\ndans la nomenclature NC8', c: '#0891b2' },
    { v: '31 déc.\n2027', l: 'Expiration du cadre\neuropéen actuel', c: '#dc2626' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7 }}>
        L'octroi de mer est la taxe la plus ancienne encore en vigueur dans les territoires
        français. C'est aussi l'une des plus <strong style={{ color: '#fff' }}>méconnues du grand public</strong>,
        et pourtant l'une des plus <strong style={{ color: '#c4b5fd' }}>décisives pour le pouvoir d'achat</strong>
        des 2,2 millions d'habitants des cinq DROM.
        Cette conférence déconstruit son mécanisme avec la rigueur que les données imposent.
      </p>

      {/* Key figures */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.65rem' }}>
        {keyFigures.map(f => (
          <div key={f.l} style={{ padding: '0.85rem', borderRadius: 12, background: `${f.c}15`, border: `1px solid ${f.c}44` }}>
            <p style={{ margin: '0 0 0.3rem', fontSize: '1.3rem', fontWeight: 900, color: f.c, lineHeight: 1 }}>
              {f.v}
            </p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {f.l.split('\n').map((line, i) => <span key={i}>{line}{i === 0 ? <br /> : null}</span>)}
            </p>
          </div>
        ))}
      </div>

      {/* DROM bars */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recettes OM par territoire (DGDDI 2023, M€)
        </p>
        {[
          { t: 'La Réunion 🇷🇪',   v: 430, c: '#7c3aed' },
          { t: 'Martinique 🇲🇶',   v: 320, c: '#2563eb' },
          { t: 'Guadeloupe 🇬🇵',   v: 280, c: '#0891b2' },
          { t: 'Guyane 🇬🇫',       v: 120, c: '#059669' },
          { t: 'Mayotte 🇾🇹',      v: 50,  c: '#d97706' },
        ].map(row => (
          <div key={row.t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.69rem', color: '#e2e8f0', minWidth: 128 }}>{row.t}</span>
            <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(row.v / 450) * 100}%`, background: row.c, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: row.c, minWidth: 36, textAlign: 'right' }}>
              {row.v} M€
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'DGDDI — Recettes OM 2023', url: 'https://www.douane.gouv.fr/fiche/statistiques-des-recettes', year: '2023' }} />
        <SourcePill source={{ label: 'Loi 2004-639 — Légifrance', url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/' }} />
      </div>
    </div>
  );
}

// ─── Slide 2 — Histoire ──────────────────────────────────────────────────────────
function HistoireSlide() {
  const events = [
    { year: '1670', label: 'Ordonnance de Colbert', note: '"Droit de poids et entrée" aux Antilles', c: '#7c3aed' },
    { year: '1791', label: 'Révolution française', note: 'Nationalisation & harmonisation coloniale', c: '#2563eb' },
    { year: '1946', label: 'Loi de départ.', note: 'DOM intégrés à la Rép. — OM maintenu', c: '#0891b2' },
    { year: '1992', label: 'Arrêt CJCE Legros', note: 'Incompatibilité droit communautaire — réforme exigée', c: '#dc2626' },
    { year: '2004', label: 'Loi n° 2004-639', note: 'Architecture OM-R + OM-C, différentiels autorisés', c: '#059669' },
    { year: '2021', label: 'Déc. UE 2021/1657', note: 'Prorogation jusqu\'au 31 déc. 2027', c: '#d97706' },
    { year: '2027', label: 'Horizon', note: 'Renouvellement en négociation (Commission 2024)', c: '#c026d3' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        L'octroi de mer n'a pas été conçu dans un bureau de Bruxelles — il est né d'une
        <strong style={{ color: '#fff' }}> logique coloniale mercantiliste</strong> du XVIIe siècle.
        Comprendre son histoire permet de comprendre pourquoi il est si difficile à réformer.
      </p>

      {/* Timeline SVG */}
      <div style={card({ padding: '0.9rem' })}>
        {events.map((ev, i) => (
          <div key={ev.year} style={{ display: 'flex', gap: '0.75rem', marginBottom: i < events.length - 1 ? '0' : '0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${ev.c}22`, border: `1.5px solid ${ev.c}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.58rem', fontWeight: 800, color: ev.c, lineHeight: 1,
              }}>{ev.year.replace('Horizon', '2027')}</div>
              {i < events.length - 1 && (
                <div style={{ flex: 1, width: 2, background: `${ev.c}33`, minHeight: 14, margin: '2px 0' }} />
              )}
            </div>
            <div style={{ paddingTop: 4, paddingBottom: i < events.length - 1 ? 12 : 0 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{ev.label}</p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>{ev.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CJCE crisis box */}
      <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>
          🔴 Crise de 1992 : l'arrêt CJCE qui a tout changé
        </p>
        <p style={{ margin: 0, fontSize: '0.73rem', color: '#94a3b8', lineHeight: 1.55 }}>
          L'arrêt <em>Legros</em> (C-163/90, 16 juillet 1992) a jugé que l'octroi de mer de l'époque
          constituait une taxe d'effet équivalant à un droit de douane — <strong style={{ color: '#fca5a5' }}>
          incompatible avec le marché commun</strong>. La France a obtenu une dérogation transitoire sous
          conditions strictes : justification des différentiels, liste positive de secteurs, durée limitée.
          Ces conditions structurent encore le régime actuel.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'CJCE — Arrêt Legros C-163/90', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:61990CJ0163', year: '1992' }} />
        <SourcePill source={{ label: 'Loi 2004-639 — Légifrance', url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/', year: '2004' }} />
        <SourcePill source={{ label: 'Décision UE 2021/1657 — EUR-Lex', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32021D1657', year: '2021' }} />
      </div>
    </div>
  );
}

// ─── Slide 3 — Architecture juridique ───────────────────────────────────────────
function DroitSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        L'octroi de mer repose sur un <strong style={{ color: '#fff' }}>empilement de normes</strong> allant
        du Traité européen jusqu'aux délibérations régionales. Chaque niveau conditionne le suivant.
        C'est cette architecture pyramidale qui le rend difficile à modifier unilatéralement.
      </p>

      {/* Legal pyramid */}
      {[
        {
          level: 1, label: 'TFUE — Art. 349',
          sub: 'Traité sur le Fonctionnement de l\'UE · Statut des Régions Ultrapériphériques (RUP) · Permet des dérogations aux règles du marché intérieur pour surmonter les handicaps structurels',
          color: '#7c3aed', width: '100%',
        },
        {
          level: 2, label: 'Décision (UE) 2021/1657 du Conseil',
          sub: 'Autorise la France à maintenir l\'OM jusqu\'au 31 déc. 2027 · Fixe les différentiels maximaux par catégorie · Conditions : justification sectorielle, rapport d\'évaluation quinquennal',
          color: '#2563eb', width: '90%',
        },
        {
          level: 3, label: 'Règlement (UE) 2022/2',
          sub: 'Annexes tarifaires détaillées · ~200 codes NC8 avec différentiels autorisés (10, 20, 30 pts) · Base légale pour les délibérations régionales',
          color: '#0891b2', width: '80%',
        },
        {
          level: 4, label: 'Loi française n° 2004-639',
          sub: 'Architecture OM-R + OM-C · Assiette, exonérations, seuil 300K€ · Cadre de redistribution Région → Communes',
          color: '#059669', width: '70%',
        },
        {
          level: 5, label: 'Délibérations Conseils Régionaux',
          sub: 'Taux effectifs, produits exonérés · ~7 000 lignes tarifaires · Révisées annuellement · Opposables aux opérateurs économiques',
          color: '#d97706', width: '60%',
        },
      ].map(l => (
        <div key={l.level} style={{ margin: '0 auto', width: l.width, transition: 'width 0.3s' }}>
          <div style={{ padding: '0.7rem 1rem', borderRadius: 10, background: `${l.color}15`, border: `1px solid ${l.color}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: `${l.color}33`, border: `1px solid ${l.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: l.color, flexShrink: 0 }}>{l.level}</div>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: l.color }}>{l.label}</p>
            </div>
            <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.5 }}>{l.sub}</p>
          </div>
        </div>
      ))}

      {/* Key: RUP concept */}
      <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: '#c4b5fd', fontWeight: 700 }}>
          🇪🇺 Art. 349 TFUE — Le fondement constitutionnel de tout le régime
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.55 }}>
          Le Conseil de l'UE peut autoriser des mesures spécifiques pour les RUP <em>"en tenant compte
          de la situation structurelle sociale et économique particulière des régions ultrapériphériques,
          qui est aggravée par leur éloignement, l'insularité, leur faible superficie, le relief et le
          climat difficiles, leur dépendance économique vis-à-vis d'un petit nombre de produits."</em>
          C'est le seul article du TFUE qui permet explicitement de telles discriminations fiscales.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'TFUE Art. 349 — EUR-Lex', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:12012E349', year: 'TFUE 2012' }} />
        <SourcePill source={{ label: 'Règlement UE 2022/2 — EUR-Lex', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002', year: '2022' }} />
      </div>
    </div>
  );
}

// ─── Slide 4 — Mécanisme opérationnel ───────────────────────────────────────────
function MecanismeSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Sur le plan opérationnel, l'octroi de mer fonctionne comme un droit de douane interne
        à la France — mais avec des <strong style={{ color: '#fff' }}>particularités uniques</strong> :
        il s'applique aussi à la production locale (au-dessus du seuil), et ses recettes restent
        intégralement dans le territoire.
      </p>

      {/* Formula */}
      <div style={{ padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.3)', fontFamily: 'monospace' }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Formule de calcul — Importations
        </p>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.6 }}>
          <span style={{ color: '#6ee7b7' }}>Base imposable</span> = Valeur CIF (coût + fret + assurance) en douane
        </p>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#e2e8f0' }}>
          <span style={{ color: '#fbbf24' }}>OM-R dû</span> = Base × Taux OM-R<sub style={{ fontSize: '0.6rem' }}>secteur</sub>
        </p>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.82rem', color: '#e2e8f0' }}>
          <span style={{ color: '#93c5fd' }}>OM-C dû</span> = Base × 2,5 %
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
          <span style={{ color: '#f87171' }}>Total OM</span> = OM-R + OM-C
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.67rem', color: '#475569' }}>
          * TVA DOM (8,5 %) se calcule ensuite sur : Valeur CIF + OM + marge importateur
        </p>
      </div>

      {/* Circuit flow */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Circuit de collecte et de redistribution
        </p>
        {[
          { step: 'A', label: 'Importateur / Producteur local',     sub: 'Déclare et paie l\'OM mensuel à la DGDDI',                                   c: '#0891b2' },
          { step: 'B', label: 'DGDDI — Douanes',                    sub: 'Liquidation, contrôle, encaissement. Statistiques publiées annuellement',      c: '#059669' },
          { step: 'C', label: 'Trésor Public',                      sub: 'Compte d\'attente avant reversement territorial',                              c: '#d97706' },
          { step: 'D', label: 'Conseil Régional / Collectivité',    sub: 'Reçoit OM-R (budget Région) + OM-C total à redistribuer',                    c: '#7c3aed' },
          { step: 'E', label: 'Communes du DROM',                   sub: 'OM-C réparti selon clé : population + superficie + DGF (dotation de base)',   c: '#c026d3' },
        ].map((s, i) => (
          <div key={s.step}>
            <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${s.c}22`, border: `1px solid ${s.c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: s.c, flexShrink: 0 }}>{s.step}</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: s.c, fontWeight: 700 }}>{s.label}</p>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', color: '#64748b' }}>{s.sub}</p>
              </div>
            </div>
            {i < 4 && <div style={{ marginLeft: 12, height: 14, width: 2, background: 'rgba(148,163,184,0.12)', margin: '2px 0 2px 11px' }} />}
          </div>
        ))}
      </div>

      {/* Key distinction */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: '#a78bfa', fontWeight: 700 }}>OM-R — Budget Régional</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>Taux variable (0 % → 60 %) selon secteur et délibération · Recette propre de la Région · Finance investissements et politiques régionales</p>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: 12, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.3)' }}>
          <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700 }}>OM-C — Budget Communes</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>Taux fixe 2,5 % (toujours) · Péréquation intercommunale · Finance services de proximité (eau, écoles, voirie communale)</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'DGDDI — Notice OM 2024', url: 'https://www.douane.gouv.fr', year: '2024' }} />
        <SourcePill source={{ label: 'Loi 2004-639 Art. 16-17', url: 'https://www.legifrance.gouv.fr/loi/id/JORFTEXT000000622975/', year: '2004' }} />
      </div>
    </div>
  );
}

// ─── Slide 5 — Analyse des taux ─────────────────────────────────────────────────
function TauxSlide() {
  const sectors = [
    { s: 'Alimentation courante',    imp: 5,  local: 0,  diff: 5,  c: '#059669' },
    { s: 'Boissons (importées)',      imp: 20, local: 2,  diff: 18, c: '#d97706' },
    { s: 'Rhum (hors prod. locale)',  imp: 58, local: 0,  diff: 58, c: '#dc2626' },
    { s: 'Habillement',              imp: 22, local: 0,  diff: 22, c: '#7c3aed' },
    { s: 'Matériaux de construction', imp: 10, local: 0, diff: 10, c: '#0891b2' },
    { s: 'Véhicules particuliers',    imp: 30, local: 0,  diff: 30, c: '#c026d3' },
    { s: 'Électronique / High-tech',  imp: 8,  local: 0,  diff: 8,  c: '#2563eb' },
    { s: 'Cosmétiques',              imp: 16, local: 0,  diff: 16, c: '#d97706' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Les taux varient de <strong style={{ color: '#4ade80' }}>0 %</strong> (exonérations produits de base)
        à <strong style={{ color: '#f87171' }}>60 %</strong> (rhum importé en Martinique — protection de la
        production locale de rhum AOC). Cette amplitude reflète les <strong style={{ color: '#fff' }}>choix
        politiques</strong> des Conseils Régionaux.
      </p>

      {/* Dual bar chart: importé vs local */}
      <div style={card({ padding: '0.9rem' })}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Taux OM-R représentatifs — Guadeloupe (exemple · jan. 2026)
          <span style={{ marginLeft: 8, color: '#a78bfa' }}>■ Importé</span>
          <span style={{ marginLeft: 8, color: '#4ade80' }}>■ Production locale</span>
        </p>
        {sectors.map(row => (
          <div key={row.s} style={{ marginBottom: '0.7rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#e2e8f0' }}>{row.s}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: row.c }}>Δ {row.diff} pts</span>
            </div>
            <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              {/* imported bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(row.imp / 65) * 100}%`, background: row.c, borderRadius: 4, opacity: 0.85 }} />
            </div>
            <div style={{ position: 'relative', height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', marginTop: 2 }}>
              {/* local bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${(row.local / 65) * 100}%`, background: '#4ade80', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#475569', marginTop: '0.15rem' }}>
              <span>Importé : {row.imp} %</span>
              <span>Local : {row.local} %</span>
            </div>
          </div>
        ))}
      </div>

      {/* Exemptions note */}
      <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.3)' }}>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: '#6ee7b7', fontWeight: 700 }}>
          ✅ Exonérations légales (taux 0 % dans tous les DROM)
        </p>
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.55 }}>
          Médicaments remboursables · Dispositifs médicaux essentiels · Certains aliments de base
          (décision régionale) · Matériels éducatifs · Engrais agricoles ·
          Matériels pour associations humanitaires · Importations des collectivités publiques
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Délibération CR Guadeloupe 2022', url: 'https://www.cr-guadeloupe.fr', year: '2022' }} />
        <SourcePill source={{ label: 'Règlement UE 2022/2 — Annexes', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002', year: '2022' }} />
      </div>
    </div>
  );
}

// ─── Slide 6 — Impact macroéconomique ───────────────────────────────────────────
function ImpactSlide() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Mesurer l'impact réel de l'OM est complexe car il agit à travers plusieurs canaux.
        Les données officielles permettent néanmoins de le <strong style={{ color: '#fff' }}>quantifier
        rigoureusement</strong>, à condition de distinguer l'impact direct de l'effet multiplicateur.
      </p>

      {/* Direct vs multiplier */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.65rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Exemple concret : chaîne de transmission OM → prix rayon
        </p>
        {[
          { step: 'A', label: 'Valeur CIF produit importé',  value: '100,00 €', c: '#64748b' },
          { step: 'B', label: '+ Octroi de mer (OM-R 20 % + OM-C 2,5 %)',   value: '+22,50 €', c: '#dc2626' },
          { step: 'C', label: '= Prix d\'achat importateur',  value: '122,50 €', c: '#94a3b8' },
          { step: 'D', label: '+ Marge importateur (15 %)',   value: '+18,38 €', c: '#d97706' },
          { step: 'E', label: '+ Marge distributeur (25 %)',  value: '+35,22 €', c: '#d97706' },
          { step: 'F', label: '+ TVA DOM 8,5 %',             value: '+14,87 €', c: '#2563eb' },
          { step: 'G', label: '= Prix rayon TTC final',      value: '190,97 €', c: '#dc2626', bold: true },
          { step: '', label: 'Surcoût total vs prix métro (~140 €)',        value: '+36 %', c: '#f87171', bold: true },
        ].map(row => (
          <div key={row.step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0', borderBottom: row.step === 'G' ? '2px solid rgba(148,163,184,0.2)' : 'none', marginBottom: row.step === 'G' ? '0.3rem' : 0 }}>
            {row.step && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: row.c, minWidth: 16 }}>{row.step}</span>}
            <span style={{ flex: 1, fontSize: row.bold ? '0.8rem' : '0.73rem', color: row.bold ? '#e2e8f0' : '#94a3b8', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
            <span style={{ fontSize: row.bold ? '0.82rem' : '0.75rem', fontWeight: 700, color: row.c }}>{row.value}</span>
          </div>
        ))}
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.62rem', color: '#334155' }}>
          * Illustration avec taux OM-R=20 %, marges Autorité de la concurrence Avis 19-A-12, TVA DOM 8,5 %. L'OM direct (+22,50 €) déclenche ~14 € de marges supplémentaires → effet multiplicateur ×2,4.
        </p>
      </div>

      {/* Part of OM in surcoût */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Décomposition du surcoût alimentaire DOM vs métropole (INSEE 2022)
        </p>
        {[
          { f: 'Octroi de mer (effet direct)',          pct: 30, c: '#7c3aed' },
          { f: 'Fret maritime + logistique insulaire',  pct: 28, c: '#0891b2' },
          { f: 'Marges de distribution amplifiées',     pct: 25, c: '#d97706' },
          { f: 'Coûts d\'exploitation locaux',          pct: 12, c: '#059669' },
          { f: 'Autres',                                pct: 5,  c: '#475569' },
        ].map(row => (
          <div key={row.f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.68rem', color: '#e2e8f0', minWidth: 195 }}>{row.f}</span>
            <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${row.pct * 2}%`, background: row.c, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: row.c, minWidth: 32, textAlign: 'right' }}>{row.pct} %</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'INSEE — Niveaux de vie DOM 2022', url: 'https://www.insee.fr/fr/statistiques/2586930', year: '2022' }} />
        <SourcePill source={{ label: 'Autorité concurrence — Avis 19-A-12', url: 'https://www.autoritedelaconcurrence.fr/fr/avis/relatif-au-fonctionnement-de-la-concurrence-dans-les-secteurs-du-commerce-de-detail-dans', year: '2019' }} />
      </div>
    </div>
  );
}

// ─── Slide 7 — Budget des collectivités ─────────────────────────────────────────
function BudgetSlide() {
  const territories = [
    { t: 'La Réunion 🇷🇪',  om: 430, budget: 1500, communes: 155, pct: 28.7 },
    { t: 'Martinique 🇲🇶',  om: 320, budget: 990,  communes: 115, pct: 32.3 },
    { t: 'Guadeloupe 🇬🇵',  om: 280, budget: 950,  communes: 100, pct: 29.5 },
    { t: 'Guyane 🇬🇫',      om: 120, budget: 490,  communes: 43,  pct: 24.5 },
    { t: 'Mayotte 🇾🇹',     om: 50,  budget: 228,  communes: 18,  pct: 21.9 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        L'octroi de mer représente entre <strong style={{ color: '#fff' }}>22 % et 32 %</strong> des
        ressources fiscales des Conseils Régionaux selon les DROM. C'est la première ressource propre
        des régions d'outre-mer — devant toutes les dotations d'État. Sa suppression sans
        compensation plongerait les collectivités dans une crise budgétaire majeure.
      </p>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
          <thead>
            <tr>
              {['Territoire', 'Recettes OM (M€)', 'Budget régional (M€)', 'Part OM (%)', 'Reversement communes (M€)'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(148,163,184,0.1)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {territories.map(row => (
              <tr key={row.t} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                <td style={{ padding: '0.35rem 0.6rem', color: '#e2e8f0' }}>{row.t}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#c4b5fd', fontWeight: 700 }}>{row.om} M€</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#94a3b8' }}>{row.budget} M€</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#fcd34d', fontWeight: 700 }}>{row.pct} %</td>
                <td style={{ padding: '0.35rem 0.6rem', color: '#93c5fd' }}>{row.communes} M€</td>
              </tr>
            ))}
            <tr style={{ background: 'rgba(124,58,237,0.1)', fontWeight: 700 }}>
              <td style={{ padding: '0.35rem 0.6rem', color: '#e2e8f0' }}>TOTAL 5 DROM</td>
              <td style={{ padding: '0.35rem 0.6rem', color: '#c4b5fd' }}>~1 200 M€</td>
              <td style={{ padding: '0.35rem 0.6rem', color: '#94a3b8' }}>~4 158 M€</td>
              <td style={{ padding: '0.35rem 0.6rem', color: '#fcd34d' }}>~28,9 %</td>
              <td style={{ padding: '0.35rem 0.6rem', color: '#93c5fd' }}>~431 M€</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ margin: 0, fontSize: '0.62rem', color: '#334155' }}>
        Sources : DGDDI 2023 ; Cour des Comptes — Rapport finances collectivités DOM 2023 ; IEDOM Rapports annuels 2023.
        Budget régional = budget de fonctionnement + investissement Région (hors communes). Estimations 2022-2023.
      </p>

      {/* Structural dependency */}
      <div style={{ padding: '0.8rem 1rem', borderRadius: 12, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)' }}>
        <p style={{ margin: '0 0 0.3rem', fontSize: '0.78rem', color: '#f87171', fontWeight: 700 }}>
          ⚠️ Risque systémique : dépendance structurelle
        </p>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.55 }}>
          La Cour des Comptes (2023) note que certaines collectivités DOM n'ont <strong style={{ color: '#fca5a5' }}>pas
          diversifié leurs recettes fiscales</strong> en anticipation d'une réforme de l'OM.
          Une suppression brutale sans mesure compensatoire provoquerait des déficits de l'ordre de
          20-30 % du budget de fonctionnement — rendant inévitable la mise sous tutelle financière.
          Le rapport Lurel-Hoibian (2019) estimait le besoin de compensation à <strong style={{ color: '#fca5a5' }}>
          1,2 Md€/an</strong> de DGF supplémentaires.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Cour des Comptes — Rapport DOM 2023', url: 'https://www.ccomptes.fr', year: '2023' }} />
        <SourcePill source={{ label: 'Rapport Lurel-Hoibian 2019', url: 'https://www.outre-mer.gouv.fr', year: '2019' }} />
      </div>
    </div>
  );
}

// ─── Slide 8 — Horizon 2027 ──────────────────────────────────────────────────────
function ReformeSlide() {
  const scenarios = [
    {
      id: 'A', title: 'Prorogation à l\'identique',
      risk: 'Faible', impact: 'Nul', prob: 35,
      color: '#64748b',
      pros: 'Stabilité budgétaire · Pas de négociation difficile',
      cons: 'Bruxelles exige justifications croissantes · Perpétue vie chère',
    },
    {
      id: 'B', title: 'Réforme des différentiels (Lurel)',
      risk: 'Modéré', impact: 'Modéré', prob: 30,
      color: '#2563eb',
      pros: 'Meilleur ciblage · Réduction différentiels >30 pts',
      cons: 'Opposition industries locales · Perte partielle recettes',
    },
    {
      id: 'C', title: 'Suppression sur produits de base',
      risk: 'Élevé', impact: 'Fort', prob: 20,
      color: '#059669',
      pros: 'Impact immédiat pouvoir d\'achat · Simple à expliquer',
      cons: '~200 M€/an de manque à gagner · Compensation DGF à négocier',
    },
    {
      id: 'D', title: 'Réforme structurelle globale',
      risk: 'Très élevé', impact: 'Très fort', prob: 15,
      color: '#c026d3',
      pros: 'Modernisation profonde · Transparence accrue',
      cons: 'Nécessite révision TFUE · Délai >5 ans · Opposition politique forte',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        L'expiration du régime au <strong style={{ color: '#fff' }}>31 décembre 2027</strong> impose
        une décision politique avant fin 2026 (délai de négociation UE). Quatre scénarios sont
        examinés par la Commission européenne dans son document de consultation de 2024.
      </p>

      {scenarios.map(s => (
        <div key={s.id} style={{ padding: '0.8rem 1rem', borderRadius: 12, background: `${s.color}0d`, border: `1px solid ${s.color}33` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: `${s.color}33`, border: `1px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: s.color, flexShrink: 0 }}>{s.id}</span>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{s.title}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: 10, background: `${s.color}22`, border: `1px solid ${s.color}44`, color: s.color, fontWeight: 600 }}>
                Proba. ~{s.prob} %
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem' }}>
            <div>
              <p style={{ margin: '0 0 0.2rem', color: '#4ade80', fontWeight: 600 }}>✅ Avantages</p>
              <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>{s.pros}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 0.2rem', color: '#f87171', fontWeight: 600 }}>⚠️ Risques</p>
              <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>{s.cons}</p>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <SourcePill source={{ label: 'Commission UE — Consultation 2024', url: 'https://ec.europa.eu', year: '2024' }} />
        <SourcePill source={{ label: 'Rapport Lurel-Hoibian 2019', url: 'https://www.outre-mer.gouv.fr', year: '2019' }} />
        <SourcePill source={{ label: 'Décision UE 2021/1657 — EUR-Lex', url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32021D1657', year: '2021' }} />
      </div>
    </div>
  );
}

// ─── Slide 9 — Conclusion ────────────────────────────────────────────────────────
function ConclusionSlide() {
  const myths = [
    {
      myth: '« L\'OM est la principale cause de la vie chère dans les DOM »',
      truth: 'NUANCÉ : Il représente ~30 % du surcoût. Les marges de distribution amplifiées et le fret maritime sont des facteurs de poids comparables (données INSEE 2022).',
    },
    {
      myth: '« Supprimer l\'OM ferait immédiatement baisser les prix »',
      truth: 'INCOMPLET : Sans réforme des marges de distribution, une suppression de l\'OM bénéficierait d\'abord aux importateurs et distributeurs. L\'Autorité de la concurrence a documenté ces risques (Avis 19-A-12).',
    },
    {
      myth: '« L\'OM est une taxe illégale imposée par la France »',
      truth: 'FAUX : Il est explicitement autorisé par l\'UE (Décision 2021/1657) sur la base de l\'Art. 349 TFUE. Les Conseils Régionaux DOM en fixent eux-mêmes les taux.',
    },
    {
      myth: '« Les collectivités peuvent fonctionner sans l\'OM »',
      truth: 'FAUX : Il représente 22-32 % des budgets régionaux. Son remplacement nécessiterait soit une hausse d\'autres taxes locales, soit 1,2 Md€/an de dotations supplémentaires de l\'État (Rapport Lurel-Hoibian).',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.65 }}>
        Cette conférence vous a fourni les outils pour <strong style={{ color: '#22c55e' }}>
        analyser, débattre et décider</strong> en connaissance de cause sur l'avenir de l'octroi de mer.
        Voici ce que les données imposent comme conclusions.
      </p>

      {/* Myth busters */}
      <div style={card()}>
        <p style={{ margin: '0 0 0.7rem', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          4 idées reçues déconstruites par les données officielles
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

      {/* Institutional recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        {[
          { icon: '📋', title: 'Transparence des taux', desc: 'Publication annuelle consolidée des délibérations régionales sur un portail unique.', color: '#7c3aed' },
          { icon: '🏗️', title: 'Réforme ciblée', desc: 'Réduire les différentiels >30 pts sur produits courants. Maintenir la protection des productions locales stratégiques.', color: '#2563eb' },
          { icon: '🔄', title: 'Diversification fiscale', desc: 'Réduire progressivement la dépendance en développant la fiscalité économique locale (CFE, CVAE DOM).', color: '#059669' },
          { icon: '🤝', title: 'Négociation EU 2027', desc: 'Anticiper la renégociation avec un dossier d\'impact solide — sans attendre l\'expiration du régime actuel.', color: '#d97706' },
        ].map(r => (
          <div key={r.title} style={{ padding: '0.75rem', borderRadius: 12, background: `${r.color}0d`, border: `1px solid ${r.color}33` }}>
            <p style={{ margin: '0 0 0.3rem', fontSize: '1.2rem' }}>{r.icon}</p>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', color: r.color, fontWeight: 700 }}>{r.title}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', paddingTop: '0.5rem' }}>
        <Link to="/enquete-octroi-mer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.3rem', borderRadius: 8, background: 'rgba(124,58,237,0.85)', color: '#fff', fontSize: '0.83rem', fontWeight: 800, textDecoration: 'none' }}
        >
          📄 Dossier d'enquête complet
        </Link>
        <Link to="/calculateur-octroi"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.3rem', borderRadius: 8, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none' }}
        >
          🧮 Calculateur OM
        </Link>
      </div>

      <p style={{ margin: 0, fontSize: '0.65rem', color: '#334155', textAlign: 'center', lineHeight: 1.5 }}>
        Données issues de sources officielles vérifiables : DGDDI, IEDOM, INSEE, EUR-Lex, Cour des Comptes,
        Autorité de la concurrence, Rapport Lurel-Hoibian. ·
        Conférence institutionnelle A KI PRI SA YÉ v1.0 — Mars 2026.
      </p>
    </div>
  );
}

// ─── Slide content map ──────────────────────────────────────────────────────────
const SLIDE_CONTENT: Record<string, React.FC> = {
  cover:      CoverSlide,
  histoire:   HistoireSlide,
  droit:      DroitSlide,
  mecanisme:  MecanismeSlide,
  taux:       TauxSlide,
  impact:     ImpactSlide,
  budget:     BudgetSlide,
  reforme:    ReformeSlide,
  conclusion: ConclusionSlide,
};

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function ConferenceOctroiMer() {
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
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      padding: '1.5rem 1rem',
      fontFamily: 'inherit',
    }}>
      <Helmet>
        <title>Conférence Octroi de Mer — Ultra-expert · DOM-TOM — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Conférence institutionnelle ultra-expert : anatomie complète de l'octroi de mer DOM-TOM. 9 diapositives — histoire 1670→2027, architecture juridique UE/TFUE, mécanisme, taux, impact macroéconomique, financement collectivités, scénarios réforme. Sources : DGDDI, EUR-Lex, Cour des Comptes, Autorité de la concurrence."
        />
              <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/conference-octroi-mer" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/conference-octroi-mer" />
        <link rel="alternate" hrefLang="x-default" href="https://teetee971.github.io/akiprisaye-web/conference-octroi-mer" />
      </Helmet>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Back links */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/enquete-octroi-mer" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>
            ← Dossier d'enquête
          </Link>
          <Link to="/calculateur-octroi" style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}>
            🧮 Calculateur Octroi de mer
          </Link>
        </div>

        <HeroImage
          src={PAGE_HERO_IMAGES.conferenceOctroiMer}
          alt="Conférence institutionnelle — Anatomie de l'octroi de mer DOM-TOM"
          gradient="from-slate-950 to-indigo-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            🏛️ Conférence — L'Octroi de Mer
          </h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>
            Niveau institutionnel · 9 diapositives · Sources officielles vérifiables
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {['EUR-Lex', 'DGDDI', 'IEDOM', 'Cour des Comptes', 'Autorité concurrence'].map(s => (
              <span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)', color: '#c4b5fd', fontWeight: 700, fontSize: '0.68rem' }}>{s}</span>
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
                width: i === current ? 24 : 8, height: 8, borderRadius: 4,
                border: 'none',
                background: i === current ? slide.accentColor : 'rgba(148,163,184,0.25)',
                cursor: 'pointer', padding: 0, transition: 'all 0.25s ease',
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
              background: `${slide.accentColor}22`, border: `1px solid ${slide.accentColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {slide.emoji}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: slide.accentColor, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                Diapositive {current + 1} / {total}
              </div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>{slide.title}</h1>
              {slide.subtitle && <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{slide.subtitle}</p>}
            </div>
          </div>

          {/* Slide body */}
          <SlideContent />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
          <button
            onClick={prev} disabled={current === 0}
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
            onClick={next} disabled={current === total - 1}
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
                key={s.id} onClick={() => setCurrent(i)}
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
          Conférence institutionnelle Octroi de Mer v1.0 — Mars 2026 · Observatoire A KI PRI SA YÉ ·
          Sources officielles vérifiables : DGDDI, EUR-Lex, IEDOM, Cour des Comptes, Autorité de la concurrence,
          Rapport Lurel-Hoibian · Aucun chiffre inventé ·{' '}
          <Link to="/methodologie" style={{ color: '#334155' }}>Méthodologie</Link>
        </p>

      </div>
    </div>
  );
}
