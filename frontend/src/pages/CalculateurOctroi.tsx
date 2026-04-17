/**
 * CalculateurOctroi — Calculateur pédagogique de l'octroi de mer
 *
 * Décompose le prix d'un produit importé dans les DOM en ses composantes :
 *   Prix départ usine → + Fret maritime → + Octroi de mer → + Marge distributeur → + TVA = Prix rayon
 *
 * Taux officiels :
 *   Fret : Armateurs de France — Rapport 2023
 *   Octroi de mer : DGDDI / EUR-Lex Règlement UE 2022/2
 *   TVA DOM : 8,5 % (taux réduit spécifique DROM, CGI art. 296)
 *   Marges : Autorité de la concurrence — Avis 09-A-45 et 19-A-12
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';
// ─── Data ──────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  emoji: string;
  octroi: number; // taux octroi de mer moyen (%)
  margeDOM: number; // marge distributeur typique DOM (%)
  margeFR: number; // marge distributeur typique métropole (%)
}

const CATEGORIES: Category[] = [
  { id: 'riz', label: 'Riz, pâtes, farine', emoji: '🌾', octroi: 1, margeDOM: 28, margeFR: 18 },
  { id: 'laitier', label: 'Produits laitiers', emoji: '🥛', octroi: 7, margeDOM: 32, margeFR: 22 },
  {
    id: 'boissons',
    label: 'Boissons non alcoolisées',
    emoji: '🧃',
    octroi: 8,
    margeDOM: 35,
    margeFR: 24,
  },
  {
    id: 'viande',
    label: 'Viandes, charcuterie',
    emoji: '🥩',
    octroi: 10,
    margeDOM: 38,
    margeFR: 28,
  },
  {
    id: 'hygiene',
    label: 'Hygiène, cosmétiques',
    emoji: '🧴',
    octroi: 15,
    margeDOM: 42,
    margeFR: 30,
  },
  { id: 'electrohm', label: 'Électroménager', emoji: '🏠', octroi: 20, margeDOM: 35, margeFR: 25 },
  { id: 'electro', label: 'Électronique', emoji: '📱', octroi: 25, margeDOM: 32, margeFR: 22 },
  {
    id: 'vetement',
    label: 'Vêtements, textiles',
    emoji: '👕',
    octroi: 18,
    margeDOM: 45,
    margeFR: 35,
  },
];

interface Territory {
  code: string;
  label: string;
  flag: string;
  fretPct: number; // surcoût fret (%)
  tvaPct: number; // TVA applicable (%)
}

const TERRITORIES: Territory[] = [
  { code: 'gp', label: 'Guadeloupe', flag: '🇬🇵', fretPct: 7, tvaPct: 8.5 },
  { code: 'mq', label: 'Martinique', flag: '🇲🇶', fretPct: 7, tvaPct: 8.5 },
  { code: 'gf', label: 'Guyane', flag: '🇬🇫', fretPct: 10, tvaPct: 8.5 },
  { code: 're', label: 'La Réunion', flag: '🇷🇪', fretPct: 13, tvaPct: 8.5 },
  { code: 'yt', label: 'Mayotte', flag: '🇾🇹', fretPct: 11, tvaPct: 0 },
  { code: 'pm', label: 'St-Pierre-Miquelon', flag: '🐟', fretPct: 16, tvaPct: 0 },
  { code: 'fr', label: 'France métropolitaine', flag: '🇫🇷', fretPct: 0, tvaPct: 20 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(n: number): string {
  return n.toFixed(1) + ' %';
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CalculateurOctroi() {
  const [prixUsine, setPrixUsine] = useState(2.0);
  const [catId, setCatId] = useState('laitier');
  const [terrCode, setTerrCode] = useState('gp');

  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const terr = TERRITORIES.find((t) => t.code === terrCode)!;

  // Calculation chain
  const prixAvecFret = prixUsine * (1 + terr.fretPct / 100);
  const montantOctroi = terr.code === 'fr' ? 0 : prixAvecFret * (cat.octroi / 100);
  const prixAvecOctroi = prixAvecFret + montantOctroi;
  const margeUsed = terr.code === 'fr' ? cat.margeFR : cat.margeDOM;
  const montantMarge = prixAvecOctroi * (margeUsed / 100);
  const prixAvantTVA = prixAvecOctroi + montantMarge;
  const montantTVA = prixAvantTVA * (terr.tvaPct / 100);
  const prixFinal = prixAvantTVA + montantTVA;

  // VS France reference
  const terrFR = TERRITORIES.find((t) => t.code === 'fr')!;
  const prixFinalFR = prixUsine * (1 + cat.margeFR / 100) * (1 + terrFR.tvaPct / 100);
  const ecart = terr.code === 'fr' ? 0 : ((prixFinal - prixFinalFR) / prixFinalFR) * 100;

  const steps = [
    {
      label: 'Prix départ usine (France)',
      value: prixUsine,
      add: 0,
      color: '#6366f1',
      source: null,
      note: 'Prix de revient du fabricant, hors toute taxe et transport.',
    },
    {
      label: `Fret maritime (${terr.code === 'fr' ? '–' : pct(terr.fretPct)})`,
      value: prixAvecFret,
      add: prixAvecFret - prixUsine,
      color: '#0ea5e9',
      source: { label: 'Armateurs de France 2023', url: 'https://www.armateursdefrance.org/' },
      note:
        terr.code === 'fr'
          ? 'Pas de fret longue distance en métropole.'
          : `Transport maritime depuis le Havre jusqu'en ${terr.label}. Durée : 10–22 jours selon la destination.`,
    },
    {
      label: `Octroi de mer (${terr.code === 'fr' ? '–' : pct(cat.octroi)})`,
      value: prixAvecOctroi,
      add: montantOctroi,
      color: '#a855f7',
      source: {
        label: 'EUR-Lex — Règlement UE 2022/2',
        url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002',
      },
      note:
        terr.code === 'fr'
          ? "L'octroi de mer ne s'applique qu'aux DROM."
          : `Taxe douanière perçue à l'entrée des marchandises dans les DROM. Catégorie : ${cat.label}.`,
    },
    {
      label: `Marge distributeur (${pct(margeUsed)})`,
      value: prixAvantTVA,
      add: montantMarge,
      color: '#f59e0b',
      source: {
        label: 'Autorité de la concurrence — Avis 09-A-45',
        url: 'https://www.autoritedelaconcurrence.fr/fr/decision/relatif-au-fonctionnement-de-la-grande-distribution-dans-les-departements-doutre-mer',
      },
      note:
        terr.code === 'fr'
          ? `Marge moyenne en métropole : ${pct(cat.margeFR)}.`
          : `Marge moyenne en DOM : ${pct(cat.margeDOM)} (vs ${pct(cat.margeFR)} en métropole). Oligopole de distribution.`,
    },
    {
      label: `TVA (${pct(terr.tvaPct)})`,
      value: prixFinal,
      add: montantTVA,
      color: '#22c55e',
      source: {
        label: 'CGI art. 296 — TVA DOM 8,5 %',
        url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006309725',
      },
      note:
        terr.code === 'fr'
          ? 'TVA normale 20 % en métropole.'
          : 'Taux réduit TVA DOM : 8,5 % (vs 20 % en métropole).',
    },
  ];

  const maxValue = prixFinal * 1.05;

  return (
    <>
      <SEOHead
        title="Calculateur d'octroi de mer — Estimez les taxes à l'import"
        description="Calculez les taxes d'octroi de mer applicables aux produits importés dans les DOM-TOM. Outil de simulation en ligne."
        canonical="https://teetee971.github.io/akiprisaye-web/calculateur-octroi"
      />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '1.5rem 1rem 3rem',
        }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link
              to="/innovation-lab"
              style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}
            >
              ← Innovation Lab
            </Link>
          </div>

          <HeroImage
            src={PAGE_HERO_IMAGES.calculateurOctroi}
            alt="Calculateur octroi de mer"
            gradient="from-slate-950 to-blue-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              🧮 Calculateur de l'octroi de mer
            </h1>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Décomposez le vrai prix de vos produits — fret, taxes, marges
            </p>
          </HeroImage>

          {/* Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Prix usine */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <label
                htmlFor="octroi-prix-usine"
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                💰 Prix départ usine (€)
              </label>
              <input
                id="octroi-prix-usine"
                type="number"
                min={0.1}
                max={500}
                step={0.1}
                value={prixUsine}
                onChange={(e) => setPrixUsine(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#f1f5f9',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.65rem', color: '#475569' }}>
                Prix de revient fabricant hors taxes
              </p>
            </div>

            {/* Catégorie */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <label
                htmlFor="octroi-categorie"
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                📦 Catégorie de produit
              </label>
              <select
                id="octroi-categorie"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#f1f5f9',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.65rem', color: '#475569' }}>
                Détermine le taux d'octroi de mer
              </p>
            </div>

            {/* Territoire */}
            <div
              style={{
                padding: '1rem 1.1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <label
                htmlFor="octroi-territoire"
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                🗺️ Territoire de destination
              </label>
              <select
                id="octroi-territoire"
                value={terrCode}
                onChange={(e) => setTerrCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#f1f5f9',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              >
                {TERRITORIES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.label}
                  </option>
                ))}
              </select>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.65rem', color: '#475569' }}>
                Détermine le fret et la TVA applicables
              </p>
            </div>
          </div>

          {/* Result hero */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 16,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.3)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#6366f1',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.25rem',
                }}
              >
                {terr.flag} Prix en rayon — {terr.label}
              </div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
                {fmt(prixFinal)} €
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                pour un produit à {fmt(prixUsine)} € départ usine
              </div>
            </div>
            {terr.code !== 'fr' && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  vs France métropolitaine
                </div>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    color: ecart > 20 ? '#ef4444' : ecart > 10 ? '#f97316' : '#fbbf24',
                    lineHeight: 1,
                  }}
                >
                  +{ecart.toFixed(1)} %
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  ({fmt(prixFinalFR)} € en métro)
                </div>
              </div>
            )}
          </div>

          {/* Waterfall chart */}
          <div
            style={{
              padding: '1.1rem 1.25rem',
              borderRadius: 14,
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(148,163,184,0.12)',
              marginBottom: '1.25rem',
            }}
          >
            <p
              style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}
            >
              Décomposition du prix — de l'usine au rayon
            </p>
            {steps.map((step, i) => (
              <div key={i} style={{ marginBottom: '0.85rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>
                      {step.label}
                    </span>
                    {step.source && (
                      <a
                        href={step.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.6rem',
                          color: '#6366f1',
                          textDecoration: 'none',
                          padding: '1px 6px',
                          borderRadius: 20,
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.25)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        🔗 {step.source.label}
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {step.add > 0 && (
                      <span style={{ fontSize: '0.72rem', color: step.color, fontWeight: 600 }}>
                        +{fmt(step.add)} €
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9' }}>
                      {fmt(step.value)} €
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div
                  style={{
                    height: 10,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(step.value / maxValue) * 100}%`,
                      background: `linear-gradient(90deg, ${step.color}88, ${step.color})`,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.65rem',
                    color: '#475569',
                    lineHeight: 1.4,
                  }}
                >
                  {step.note}
                </p>
              </div>
            ))}
          </div>

          {/* Rates info box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            {[
              {
                label: 'Fret maritime',
                value: terr.code === 'fr' ? '0 %' : `+${terr.fretPct} %`,
                color: '#0ea5e9',
                src: 'Armateurs de France',
                url: 'https://www.armateursdefrance.org/',
              },
              {
                label: 'Octroi de mer',
                value: terr.code === 'fr' ? 'N/A' : `${cat.octroi} %`,
                color: '#a855f7',
                src: 'EUR-Lex 2022/2',
                url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002',
              },
              {
                label: 'Marge distributeur',
                value: `${margeUsed} %`,
                color: '#f59e0b',
                src: 'Autorité de la conc.',
                url: 'https://www.autoritedelaconcurrence.fr/',
              },
              {
                label: 'TVA applicable',
                value: `${terr.tvaPct} %`,
                color: '#22c55e',
                src: 'CGI art. 296',
                url: 'https://www.legifrance.gouv.fr/',
              },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  padding: '0.8rem 0.9rem',
                  borderRadius: 10,
                  background: 'rgba(15,23,42,0.6)',
                  border: `1px solid ${r.color}33`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: r.color }}>{r.value}</div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#e2e8f0',
                    fontWeight: 600,
                    margin: '0.15rem 0',
                  }}
                >
                  {r.label}
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.6rem', color: '#475569', textDecoration: 'none' }}
                >
                  🔗 {r.src}
                </a>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <Link
              to="/conference-prix"
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.75)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              🎙️ Voir la conférence →
            </Link>
            <Link
              to="/enquete-octroi-mer"
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 8,
                background: 'rgba(124,58,237,0.25)',
                border: '1px solid rgba(124,58,237,0.45)',
                color: '#c4b5fd',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              📄 Enquête Octroi de Mer
            </Link>
            <Link
              to="/conference-octroi-mer"
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 8,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.2)',
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              🎓 Conférence institutionnelle
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
