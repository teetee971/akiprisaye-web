/**
 * SimulateurBudgetFamilial — Simulateur budgétaire pour les ménages DOM/COM
 *
 * Calcule le "reste pour vivre" selon la composition familiale, le territoire
 * et le niveau de revenus. Basé sur les données INSEE / IEDOM / CAF 2023.
 *
 * Sources :
 *   INSEE — Revenus Disponibles Localisés 2021
 *   IEDOM — Coûts de la vie en DOM 2023
 *   CAF — Barèmes des prestations sociales 2024
 *   DGCCRF — Bouclier Qualité Prix 2024
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

import { SEOHead } from '../components/ui/SEOHead';

// ─── PDF export helper ───────────────────────────────────────────────────────────

async function exportBudgetPDF(params: {
  terr: { flag: string; label: string; code: string };
  adultes: number;
  enfants: number;
  revenuNet: number;
  budget: {
    loyer: number;
    alimentation: number;
    carburant: number;
    assurances: number;
    telecom: number;
    energieFact: number;
    scolarite: number;
    allocs: number;
    totalCharges: number;
    revenuTotal: number;
    resteVivre: number;
    tauxContrainte: number;
    resteFR: number;
  };
  chargeItems: { label: string; value: number; src: string }[];
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const now = new Date();
  const { terr, adultes, enfants, revenuNet, budget, chargeItems } = params;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Simulateur Budget Familial — A KI PRI SA YÉ', 14, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    14,
    22
  );
  doc.text(
    `${terr.flag} ${terr.label} · ${adultes} adulte${adultes > 1 ? 's' : ''} · ${enfants} enfant${enfants !== 1 ? 's' : ''} · Revenu net : ${revenuNet.toLocaleString('fr-FR')} €/mois`,
    14,
    29
  );

  // Summary cards
  let y = 42;
  const cardW = 85;
  const resteColor: [number, number, number] =
    budget.resteVivre < 0
      ? [239, 68, 68]
      : budget.resteVivre < 300
        ? [249, 115, 22]
        : [34, 197, 94];
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, cardW, 28, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('Reste pour vivre / mois', 18, y + 8);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...resteColor);
  doc.text(
    `${budget.resteVivre < 0 ? '−' : ''}${Math.abs(budget.resteVivre).toLocaleString('fr-FR')} €`,
    18,
    y + 20
  );

  doc.setFillColor(30, 41, 59);
  doc.rect(111, y, cardW, 28, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Revenus totaux / mois', 115, y + 8);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(`${budget.revenuTotal.toLocaleString('fr-FR')} €`, 115, y + 20);
  y += 36;

  // Charges table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(241, 245, 249);
  doc.text('Dépenses contraintes mensuelles', 14, y);
  y += 6;

  chargeItems
    .filter((c) => c.value > 0)
    .forEach((item, i) => {
      doc.setFillColor(i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 33 : 41, i % 2 === 0 ? 54 : 59);
      doc.rect(14, y - 4, 182, 8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 210, 220);
      doc.text(item.label.slice(0, 45), 18, y + 1);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.value.toLocaleString('fr-FR')} €`, 183, y + 1, { align: 'right' });
      y += 8;
    });

  // Total
  doc.setFillColor(59, 130, 246);
  doc.rect(14, y - 4, 182, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Total charges mensuelles', 18, y + 2);
  doc.text(`${budget.totalCharges.toLocaleString('fr-FR')} €`, 183, y + 2, { align: 'right' });
  y += 14;

  // DOM vs Métropole comparison
  if (terr.code !== 'fr') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(241, 245, 249);
    doc.text('Comparaison DOM vs Métropole (France)', 14, y);
    y += 7;
    doc.setFillColor(22, 33, 54);
    doc.rect(14, y - 4, 182, 28, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Reste pour vivre — ${terr.flag} ${terr.label}`, 18, y + 2);
    doc.setTextColor(...resteColor);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${budget.resteVivre < 0 ? '−' : ''}${Math.abs(budget.resteVivre).toLocaleString('fr-FR')} €/mois`,
      183,
      y + 2,
      { align: 'right' }
    );
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Reste pour vivre — 🇫🇷 France métropolitaine', 18, y + 12);
    const frColor: [number, number, number] = budget.resteFR < 0 ? [239, 68, 68] : [34, 197, 94];
    doc.setTextColor(...frColor);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${budget.resteFR < 0 ? '−' : ''}${Math.abs(budget.resteFR).toLocaleString('fr-FR')} €/mois`,
      183,
      y + 12,
      { align: 'right' }
    );
    const diff = budget.resteVivre - budget.resteFR;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Écart DOM vs Métropole', 18, y + 22);
    doc.setTextColor(diff >= 0 ? 34 : 239, diff >= 0 ? 197 : 68, diff >= 0 ? 94 : 68);
    doc.setFont('helvetica', 'bold');
    doc.text(`${diff >= 0 ? '+' : ''}${diff.toLocaleString('fr-FR')} €/mois`, 183, y + 22, {
      align: 'right',
    });
    y += 36;
  }

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Sources : INSEE RDL 2021 · IEDOM 2023 · CAF 2024 · DGCCRF BQP 2024 · Estimations indicatives',
    14,
    286
  );
  doc.text('A KI PRI SA YÉ — Service Public Numérique', 14, 291);

  doc.save(`budget-familial-${terr.code}-${now.toISOString().slice(0, 10)}.pdf`);
}

// ─── Territory data ─────────────────────────────────────────────────────────────

interface TerritoryData {
  code: string;
  label: string;
  flag: string;
  loyerMoyen: number; // loyer médian 2p (€/mois) — source ADIL/IEDOM
  alimentationSurcoût: number; // surcoût alimentaire vs France (%)
  smic: number; // SMIC mensuel net (€) — identique mais retenu après charges
  revenuMedian: number; // revenu médian annuel (€/an) — INSEE RDL 2021
  chomage: number; // taux de chômage (%) — INSEE 2023
  allocFamilialeCoeff: number; // coefficient allocations familiales CAF
}

const TERRITORIES: TerritoryData[] = [
  {
    code: 'gp',
    label: 'Guadeloupe',
    flag: '🇬🇵',
    loyerMoyen: 680,
    alimentationSurcoût: 13,
    smic: 1383,
    revenuMedian: 14800,
    chomage: 18.4,
    allocFamilialeCoeff: 1.0,
  },
  {
    code: 'mq',
    label: 'Martinique',
    flag: '🇲🇶',
    loyerMoyen: 650,
    alimentationSurcoût: 11,
    smic: 1383,
    revenuMedian: 15000,
    chomage: 13.7,
    allocFamilialeCoeff: 1.0,
  },
  {
    code: 'gf',
    label: 'Guyane',
    flag: '🇬🇫',
    loyerMoyen: 590,
    alimentationSurcoût: 17,
    smic: 1383,
    revenuMedian: 11200,
    chomage: 22.4,
    allocFamilialeCoeff: 1.05,
  },
  {
    code: 're',
    label: 'La Réunion',
    flag: '🇷🇪',
    loyerMoyen: 610,
    alimentationSurcoût: 12,
    smic: 1383,
    revenuMedian: 13600,
    chomage: 18.8,
    allocFamilialeCoeff: 1.0,
  },
  {
    code: 'yt',
    label: 'Mayotte',
    flag: '🇾🇹',
    loyerMoyen: 420,
    alimentationSurcoût: 14,
    smic: 1383,
    revenuMedian: 5600,
    chomage: 32.0,
    allocFamilialeCoeff: 0.9,
  },
  {
    code: 'fr',
    label: 'France métro.',
    flag: '🇫🇷',
    loyerMoyen: 750,
    alimentationSurcoût: 0,
    smic: 1383,
    revenuMedian: 23300,
    chomage: 7.1,
    allocFamilialeCoeff: 1.0,
  },
];

// ─── Budget items (monthly) ──────────────────────────────────────────────────────

// Base alimentaire mensuelle par unité de consommation (€) — panier BQP type
const ALIM_BASE_PAR_UC = 320;
// Base carburant mensuelle (1 véhicule, 1 000 km/mois)
const CARBURANT_BASE = 120;
// Assurances auto + habitation (estimation)
const ASSURANCES_BASE = 90;
// Téléphonie + internet
const TELECOM_BASE = 60;
// Électricité + eau (DOM : +15 % vs métro environ)
const ENERGIE_BASE_DOM = 115;
const ENERGIE_BASE_FR = 100;
// Scolarité / cantine (par enfant)
const SCOLARITE_PAR_ENFANT = 80;

// Unités de consommation OCDE
function uc(adultes: number, enfants: number): number {
  return 1 + (adultes - 1) * 0.5 + enfants * 0.3;
}

// Allocation familiale CAF (estimation, enfants ≥ 2)
function allocFam(enfants: number, coeff: number): number {
  if (enfants < 2) return 0;
  const base = enfants === 2 ? 140 : enfants === 3 ? 320 : 500;
  return Math.round(base * coeff);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SimulateurBudgetFamilial() {
  const [terrCode, setTerrCode] = useState('gp');
  const [adultes, setAdultes] = useState(2);
  const [enfants, setEnfants] = useState(1);
  const [revenuNet, setRevenuNet] = useState(2200);
  const [exporting, setExporting] = useState(false);

  const terr = TERRITORIES.find((t) => t.code === terrCode)!;

  const budget = useMemo(() => {
    const nb_uc = uc(adultes, enfants);
    const surcoef = 1 + terr.alimentationSurcoût / 100;
    const energie = terr.code === 'fr' ? ENERGIE_BASE_FR : ENERGIE_BASE_DOM;

    const loyer = terr.loyerMoyen;
    const alimentation = Math.round(ALIM_BASE_PAR_UC * nb_uc * surcoef);
    const carburant = adultes > 0 ? CARBURANT_BASE : 0;
    const assurances = ASSURANCES_BASE;
    const telecom = TELECOM_BASE;
    const energieFact = Math.round(energie * (0.7 + adultes * 0.15 + enfants * 0.1));
    const scolarite = enfants * SCOLARITE_PAR_ENFANT;
    const allocs = allocFam(enfants, terr.allocFamilialeCoeff);

    const totalCharges =
      loyer + alimentation + carburant + assurances + telecom + energieFact + scolarite;
    const revenuTotal = revenuNet + allocs;
    const resteVivre = revenuTotal - totalCharges;
    const tauxContrainte = Math.min(100, Math.round((totalCharges / revenuTotal) * 100));

    const terrFR = TERRITORIES.find((t) => t.code === 'fr')!;
    const nb_uc_fr = nb_uc;
    const alimFR = Math.round(ALIM_BASE_PAR_UC * nb_uc_fr);
    const totalFR =
      terrFR.loyerMoyen +
      alimFR +
      CARBURANT_BASE +
      ASSURANCES_BASE +
      TELECOM_BASE +
      ENERGIE_BASE_FR +
      scolarite;
    const resteFR = revenuNet + allocFam(enfants, 1.0) - totalFR;

    return {
      loyer,
      alimentation,
      carburant,
      assurances,
      telecom,
      energieFact,
      scolarite,
      allocs,
      totalCharges,
      revenuTotal,
      resteVivre,
      tauxContrainte,
      resteFR,
    };
  }, [terrCode, adultes, enfants, revenuNet, terr]);

  const resteColor =
    budget.resteVivre < 0
      ? '#ef4444'
      : budget.resteVivre < 300
        ? '#f97316'
        : budget.resteVivre < 600
          ? '#fbbf24'
          : '#22c55e';

  const chargeItems = [
    {
      label: 'Loyer (logement médian)',
      value: budget.loyer,
      color: '#6366f1',
      icon: '🏠',
      src: 'ADIL/IEDOM 2023',
      url: 'https://www.iedom.fr/',
    },
    {
      label: 'Alimentation (panier type BQP)',
      value: budget.alimentation,
      color: '#f97316',
      icon: '🛒',
      src: 'DGCCRF — BQP 2024',
      url: 'https://www.economie.gouv.fr/outre-mer/bouclier-qualite-prix',
    },
    {
      label: 'Carburant (1 véhicule)',
      value: budget.carburant,
      color: '#fbbf24',
      icon: '⛽',
      src: 'Prix-carburants.gouv',
      url: 'https://www.prix-carburants.gouv.fr/',
    },
    {
      label: 'Assurances (auto + habitation)',
      value: budget.assurances,
      color: '#a855f7',
      icon: '🛡️',
      src: 'Estimation IEDOM',
      url: 'https://www.iedom.fr/',
    },
    {
      label: 'Téléphonie & Internet',
      value: budget.telecom,
      color: '#0ea5e9',
      icon: '📱',
      src: 'ARCEP 2023',
      url: 'https://www.arcep.fr/',
    },
    {
      label: 'Énergie (électricité + eau)',
      value: budget.energieFact,
      color: '#10b981',
      icon: '💡',
      src: 'EDF / IEDOM',
      url: 'https://www.iedom.fr/',
    },
    {
      label: `Scolarité / cantine (${enfants} enfant${enfants > 1 ? 's' : ''})`,
      value: budget.scolarite,
      color: '#f43f5e',
      icon: '🎒',
      src: 'Estimation CAF',
      url: 'https://www.caf.fr/',
    },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportBudgetPDF({ terr, adultes, enfants, revenuNet, budget, chargeItems });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Simulateur de budget familial — Estimez votre budget DOM-TOM"
        description="Simulez votre budget familial dans les territoires ultramarins. Comparez le coût de la vie selon votre composition familiale."
        canonical="https://teetee971.github.io/akiprisaye-web/simulateur-budget"
      />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '1.5rem 1rem 3rem',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Link
              to="/innovation-lab"
              style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}
            >
              ← Innovation Lab
            </Link>
          </div>

          <HeroImage
            src={PAGE_HERO_IMAGES.simulateurBudget}
            alt="Simulateur budget familial DOM"
            gradient="from-slate-950 to-emerald-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              🧮 Simulateur budget familial DOM
            </h1>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Estimez votre budget alimentation selon votre territoire et composition familiale
            </p>
          </HeroImage>

          {/* Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            {/* Territoire */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <label
                htmlFor="budget-territoire"
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.45rem',
                }}
              >
                🗺️ Territoire
              </label>
              <select
                id="budget-territoire"
                value={terrCode}
                onChange={(e) => setTerrCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  borderRadius: 7,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#f1f5f9',
                  fontSize: '0.82rem',
                  boxSizing: 'border-box',
                }}
              >
                {TERRITORIES.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.flag} {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Adultes */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.45rem',
                }}
              >
                👤 Adultes
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setAdultes(Math.max(1, adultes - 1))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    minWidth: 24,
                    textAlign: 'center',
                  }}
                >
                  {adultes}
                </span>
                <button
                  onClick={() => setAdultes(Math.min(4, adultes + 1))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Enfants */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.45rem',
                }}
              >
                👶 Enfants
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setEnfants(Math.max(0, enfants - 1))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  −
                </button>
                <span
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    minWidth: 24,
                    textAlign: 'center',
                  }}
                >
                  {enfants}
                </span>
                <button
                  onClick={() => setEnfants(Math.min(5, enfants + 1))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(99,102,241,0.2)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#a5b4fc',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Revenu */}
            <div
              style={{
                padding: '0.9rem 1rem',
                borderRadius: 12,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <label
                htmlFor="budget-revenu"
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.45rem',
                }}
              >
                💰 Revenu net mensuel (€)
              </label>
              <input
                id="budget-revenu"
                type="number"
                min={500}
                max={8000}
                step={50}
                value={revenuNet}
                onChange={(e) => setRevenuNet(Math.max(500, parseInt(e.target.value) || 500))}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.6rem',
                  borderRadius: 7,
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#f1f5f9',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.6rem', color: '#475569' }}>
                SMIC net 2024 : 1 383 €/mois
              </p>
            </div>
          </div>

          {/* Result hero */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                padding: '1.2rem 1.3rem',
                borderRadius: 14,
                background: 'rgba(15,23,42,0.75)',
                border: `2px solid ${resteColor}55`,
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                Reste pour vivre / mois
              </div>
              <div
                style={{ fontSize: '2.2rem', fontWeight: 900, color: resteColor, lineHeight: 1 }}
              >
                {budget.resteVivre < 0 ? '−' : ''}
                {Math.abs(budget.resteVivre).toLocaleString('fr-FR')} €
              </div>
              {budget.resteVivre < 0 && (
                <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem' }}>
                  ⚠️ Dépenses supérieures aux revenus
                </div>
              )}
              {terr.code !== 'fr' && (
                <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.3rem' }}>
                  vs {budget.resteFR < 0 ? '−' : ''}
                  {Math.abs(budget.resteFR).toLocaleString('fr-FR')} € en métropole
                </div>
              )}
            </div>
            <div
              style={{
                padding: '1.2rem 1.3rem',
                borderRadius: 14,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                Revenus totaux / mois
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e', lineHeight: 1 }}>
                {budget.revenuTotal.toLocaleString('fr-FR')} €
              </div>
              {budget.allocs > 0 && (
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  dont {budget.allocs} € CAF
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.2rem' }}>
                  Taux de dépenses contraintes
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${budget.tauxContrainte}%`,
                      background:
                        budget.tauxContrainte > 85
                          ? '#ef4444'
                          : budget.tauxContrainte > 70
                            ? '#f97316'
                            : '#fbbf24',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: budget.tauxContrainte > 85 ? '#f87171' : '#94a3b8',
                    marginTop: '0.15rem',
                    fontWeight: 700,
                  }}
                >
                  {budget.tauxContrainte} %
                </div>
              </div>
            </div>
          </div>

          {/* Charges breakdown */}
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
              style={{
                margin: '0 0 0.9rem',
                fontSize: '0.78rem',
                color: '#94a3b8',
                fontWeight: 600,
              }}
            >
              Dépenses contraintes mensuelles — {terr.flag} {terr.label}
            </p>
            {chargeItems
              .filter((c) => c.value > 0)
              .map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    marginBottom: '0.6rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', minWidth: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0', flex: 1, minWidth: 140 }}>
                    {item.label}
                  </span>
                  <div
                    style={{
                      width: 120,
                      height: 5,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (item.value / budget.totalCharges) * 100 * 2.5)}%`,
                        background: item.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.6rem',
                      color: '#475569',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔗 {item.src}
                  </a>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: item.color,
                      minWidth: 62,
                      textAlign: 'right',
                    }}
                  >
                    {item.value.toLocaleString('fr-FR')} €
                  </span>
                </div>
              ))}
            <div
              style={{
                borderTop: '1px solid rgba(148,163,184,0.12)',
                paddingTop: '0.6rem',
                marginTop: '0.3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>
                Total charges
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#f1f5f9' }}>
                {budget.totalCharges.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>

          {/* DOM vs Métropole detailed comparison */}
          {terr.code !== 'fr' &&
            (() => {
              const terrFR = TERRITORIES.find((t) => t.code === 'fr')!;
              const diff = budget.resteVivre - budget.resteFR;
              const diffSign = diff >= 0 ? '+' : '';
              return (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 14,
                    background: 'rgba(15,23,42,0.75)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 0.8rem',
                      fontSize: '0.78rem',
                      color: '#93c5fd',
                      fontWeight: 600,
                    }}
                  >
                    📊 Panier type DOM vs Métropole — Comparaison mensuelle
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.6rem',
                      marginBottom: '0.8rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: 9,
                        background: 'rgba(30,41,59,0.8)',
                        border: '1px solid rgba(99,102,241,0.3)',
                      }}
                    >
                      <div
                        style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.2rem' }}
                      >
                        {terr.flag} {terr.label}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>
                        {budget.totalCharges.toLocaleString('fr-FR')} €/mois
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        surcoût alim. +{terr.alimentationSurcoût}%
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '0.65rem 0.8rem',
                        borderRadius: 9,
                        background: 'rgba(30,41,59,0.8)',
                        border: '1px solid rgba(148,163,184,0.15)',
                      }}
                    >
                      <div
                        style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.2rem' }}
                      >
                        🇫🇷 {terrFR.label}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>
                        {(
                          budget.totalCharges -
                          (budget.alimentation -
                            Math.round(320 * (1 + (adultes - 1) * 0.5 + enfants * 0.3)))
                        ).toLocaleString('fr-FR')}{' '}
                        €/mois
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                        surcoût alim. +0%
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 8,
                      background: diff >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${diff >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Reste pour vivre en {terr.label} vs Métropole
                    </span>
                    <span
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: diff >= 0 ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {diffSign}
                      {diff.toLocaleString('fr-FR')} €/mois
                    </span>
                  </div>
                </div>
              );
            })()}

          {/* Disclaimer */}
          <div
            style={{
              padding: '0.8rem 1rem',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#92400e', lineHeight: 1.6 }}>
              ⚠️ <strong style={{ color: '#fbbf24' }}>Avertissement :</strong> Ces estimations sont
              indicatives et basées sur des moyennes statistiques (INSEE RDL 2021, IEDOM 2023).
              Votre situation réelle peut varier selon votre commune, votre logement, vos habitudes.
              Pour une analyse personnalisée, consultez votre{' '}
              <a
                href="https://www.caf.fr/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#fbbf24' }}
              >
                CAF
              </a>{' '}
              ou un{' '}
              <a
                href="https://www.adil.org/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#fbbf24' }}
              >
                ADIL local
              </a>
              .
            </p>
          </div>

          <div
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 8,
                background: exporting ? 'rgba(71,85,105,0.8)' : 'rgba(220,38,38,0.8)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: exporting ? 'not-allowed' : 'pointer',
              }}
            >
              {exporting ? '⏳ Génération...' : '📄 Exporter PDF'}
            </button>
            <Link
              to="/calculateur-octroi"
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
              🧮 Calculateur octroi de mer
            </Link>
            <Link
              to="/comparaison-territoires"
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
              📊 Tableau économique
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
