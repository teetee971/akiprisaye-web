/**
 * RapportCitoyen — Rapport PDF exportable sur les prix par territoire
 *
 * Génère un rapport imprimable (browser print → PDF) sur les prix,
 * les écarts constatés et les sources officielles.
 *
 * Pas de dépendance externe — utilise window.print() + CSS @media print.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { SEOHead } from '../components/ui/SEOHead';

// ─── Data ──────────────────────────────────────────────────────────────────────

const TERRITORIES_DATA = [
  {
    code: 'gp',
    flag: '🇬🇵',
    label: 'Guadeloupe',
    pop: 377000,
    pib: 21800,
    revMedian: 14800,
    surcoût: 13,
    chomage: 18.4,
    octroi: '8–25 %',
    fret: '+7 %',
    marge: '+12 pts',
  },
  {
    code: 'mq',
    flag: '🇲🇶',
    label: 'Martinique',
    pop: 349000,
    pib: 22200,
    revMedian: 15000,
    surcoût: 11,
    chomage: 13.7,
    octroi: '8–25 %',
    fret: '+7 %',
    marge: '+10 pts',
  },
  {
    code: 'gf',
    flag: '🇬🇫',
    label: 'Guyane',
    pop: 294000,
    pib: 16800,
    revMedian: 11200,
    surcoût: 17,
    chomage: 22.4,
    octroi: '8–25 %',
    fret: '+10 %',
    marge: '+13 pts',
  },
  {
    code: 're',
    flag: '🇷🇪',
    label: 'La Réunion',
    pop: 876000,
    pib: 21400,
    revMedian: 13600,
    surcoût: 12,
    chomage: 18.8,
    octroi: '8–25 %',
    fret: '+13 %',
    marge: '+12 pts',
  },
  {
    code: 'yt',
    flag: '🇾🇹',
    label: 'Mayotte',
    pop: 321000,
    pib: 9200,
    revMedian: 5600,
    surcoût: 14,
    chomage: 32.0,
    octroi: '8–25 %',
    fret: '+11 %',
    marge: '+14 pts',
  },
  {
    code: 'fr',
    flag: '🇫🇷',
    label: 'France métro.',
    pop: 68000000,
    pib: 36200,
    revMedian: 23300,
    surcoût: 0,
    chomage: 7.1,
    octroi: '–',
    fret: '–',
    marge: 'référence',
  },
];

const SOURCES = [
  {
    label: 'INSEE — Budget de Famille DOM 2017/18',
    url: 'https://www.insee.fr/fr/statistiques/2586930',
  },
  {
    label: 'INSEE — Revenus Disponibles Localisés 2021',
    url: 'https://www.insee.fr/fr/statistiques/6436428',
  },
  {
    label: 'IEDOM — Rapports annuels 2023',
    url: 'https://www.iedom.fr/iedom/publications/rapports-annuels.html',
  },
  {
    label: 'Autorité de la concurrence — Avis 09-A-45',
    url: 'https://www.autoritedelaconcurrence.fr/fr/decision/relatif-au-fonctionnement-de-la-grande-distribution-dans-les-departements-doutre-mer',
  },
  {
    label: 'EUR-Lex — Règlement UE 2022/2 (octroi de mer)',
    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002',
  },
  { label: 'DGDDI — Douane française, statistiques 2022', url: 'https://www.douane.gouv.fr/' },
  {
    label: 'DGCCRF — Bouclier Qualité Prix 2024',
    url: 'https://www.economie.gouv.fr/outre-mer/bouclier-qualite-prix',
  },
];

const PRINT_STYLES = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; color: black !important; }
  .report-container { padding: 0 !important; background: white !important; }
  .print-card { border: 1px solid #ddd !important; background: white !important; box-shadow: none !important; break-inside: avoid; }
  a { color: #1a56db !important; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; }
}`;

// ─── Component ─────────────────────────────────────────────────────────────────

export default function RapportCitoyen() {
  const [selectedTerrs, setSelectedTerrs] = useState<string[]>(['gp', 'mq', 're', 'fr']);
  const [includeTable, setIncludeTable] = useState(true);
  const [includeSources, setIncludeSources] = useState(true);

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const data = TERRITORIES_DATA.filter((t) => selectedTerrs.includes(t.code));

  function handlePrint() {
    window.print();
  }

  function toggleTerr(code: string) {
    setSelectedTerrs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  return (
    <>
      <SEOHead
        title="Rapport citoyen — Signalez une anomalie de prix"
        description="Signalez une anomalie de prix, une pratique commerciale abusive ou une erreur dans nos données. Votre signalement compte pour la transparence des prix en Outre-mer."
        canonical="https://teetee971.github.io/akiprisaye-web/rapport-citoyen"
      />
      <style>{PRINT_STYLES}</style>
      <div
        className="report-container"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '1.5rem 1rem 3rem',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {/* Controls (hidden on print) */}
          <div className="no-print">
            <div style={{ marginBottom: '1rem' }}>
              <Link
                to="/innovation-lab"
                style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'none' }}
              >
                ← Innovation Lab
              </Link>
            </div>

            <HeroImage
              src={PAGE_HERO_IMAGES.rapportCitoyen}
              alt="Rapport citoyen"
              gradient="from-slate-950 to-cyan-900"
              height="h-40 sm:h-52"
            >
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
                📊 Rapport citoyen
              </h1>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                Générez un rapport des prix de votre territoire, prêt à imprimer
              </p>
            </HeroImage>

            {/* Config */}
            <div
              style={{
                padding: '1rem 1.2rem',
                borderRadius: 14,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(148,163,184,0.12)',
                marginBottom: '1.5rem',
              }}
            >
              <p
                style={{
                  margin: '0 0 0.7rem',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                }}
              >
                Territoires à inclure
              </p>
              <div
                style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}
              >
                {TERRITORIES_DATA.map((t) => (
                  <button
                    key={t.code}
                    onClick={() => toggleTerr(t.code)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 20,
                      border: `1px solid ${selectedTerrs.includes(t.code) ? 'rgba(99,102,241,0.6)' : 'rgba(148,163,184,0.2)'}`,
                      background: selectedTerrs.includes(t.code)
                        ? 'rgba(99,102,241,0.15)'
                        : 'transparent',
                      color: selectedTerrs.includes(t.code) ? '#a5b4fc' : '#64748b',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t.flag} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  {
                    key: 'includeTable',
                    label: 'Inclure tableau comparatif',
                    state: includeTable,
                    set: setIncludeTable,
                  },
                  {
                    key: 'includeSources',
                    label: 'Inclure sources officielles',
                    state: includeSources,
                    set: setIncludeSources,
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.78rem',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={opt.state}
                      onChange={(e) => opt.set(e.target.checked)}
                      style={{ accentColor: '#6366f1' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div
              style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}
            >
              <button
                onClick={handlePrint}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: 8,
                  background: 'rgba(243,63,94,0.8)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                🖨️ Imprimer / Exporter en PDF
              </button>
              <Link
                to="/conference-prix"
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.35)',
                  color: '#a5b4fc',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                🎙️ Voir la conférence
              </Link>
            </div>
          </div>

          {/* ─── REPORT CONTENT (printed) ─── */}
          <div
            className="print-card"
            style={{
              padding: '2rem',
              borderRadius: 16,
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            {/* Report header */}
            <div
              style={{
                borderBottom: '2px solid rgba(99,102,241,0.4)',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#6366f1',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Observatoire citoyen des prix — A KI PRI SA YÉ
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: '#f1f5f9',
                      lineHeight: 1.2,
                    }}
                  >
                    Rapport sur les écarts de prix DOM / COM
                  </h1>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Édition du {today} · Données : INSEE, IEDOM, CEROM 2023
                  </p>
                </div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#ef4444',
                    lineHeight: 1,
                    textAlign: 'right',
                  }}
                >
                  +11–17 %<br />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>
                    surcoût alimentaire
                  </span>
                </div>
              </div>
            </div>

            {/* Executive summary */}
            <div
              style={{
                padding: '1rem 1.2rem',
                borderRadius: 12,
                background: 'rgba(99,102,241,0.07)',
                border: '1px solid rgba(99,102,241,0.2)',
                marginBottom: '1.5rem',
              }}
            >
              <h2
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '0.9rem',
                  color: '#a5b4fc',
                  fontWeight: 800,
                }}
              >
                Résumé exécutif
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.7 }}>
                Les territoires ultramarins français (DROM) affichent des prix alimentaires
                systématiquement supérieurs à ceux de la France métropolitaine. Cet écart
                structurel, documenté depuis des décennies par l'INSEE et l'IEDOM, s'explique par
                quatre mécanismes cumulatifs : le coût du fret maritime (+7 à +16 %), l'octroi de
                mer (taxe locale de 0 à 30 %), la concentration oligopolistique de la grande
                distribution (+10 à +25 % de marge en plus) et un niveau de revenus médians 35 à 76
                % inférieurs à la métropole.
              </p>
            </div>

            {/* Data table */}
            {includeTable && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h2
                  style={{
                    margin: '0 0 0.75rem',
                    fontSize: '0.9rem',
                    color: '#e2e8f0',
                    fontWeight: 800,
                  }}
                >
                  Comparaison économique par territoire
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        {[
                          'Territoire',
                          'Population',
                          'PIB/hab. (€)',
                          'Rev. médian (€/an)',
                          'Surcoût alim.',
                          'Chômage',
                          'Fret',
                          'Marge distrib.',
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '0.45rem 0.6rem',
                              textAlign: 'left',
                              color: '#64748b',
                              fontWeight: 600,
                              borderBottom: '1px solid rgba(148,163,184,0.2)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((t, i) => (
                        <tr
                          key={t.code}
                          style={{
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                          }}
                        >
                          <td
                            style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: '#e2e8f0' }}
                          >
                            {t.flag} {t.label}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }}>
                            {(t.pop / 1000).toFixed(0)}k
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }}>
                            {t.pib.toLocaleString('fr-FR')}
                          </td>
                          <td
                            style={{
                              padding: '0.45rem 0.6rem',
                              color: t.code === 'fr' ? '#22c55e' : '#94a3b8',
                              fontWeight: t.code === 'fr' ? 700 : 400,
                            }}
                          >
                            {t.revMedian.toLocaleString('fr-FR')}
                          </td>
                          <td
                            style={{
                              padding: '0.45rem 0.6rem',
                              fontWeight: 700,
                              color:
                                t.surcoût === 0
                                  ? '#22c55e'
                                  : t.surcoût >= 15
                                    ? '#ef4444'
                                    : '#fbbf24',
                            }}
                          >
                            {t.surcoût === 0 ? 'réf.' : `+${t.surcoût} %`}
                          </td>
                          <td
                            style={{
                              padding: '0.45rem 0.6rem',
                              color:
                                t.chomage > 20 ? '#ef4444' : t.chomage > 14 ? '#f97316' : '#94a3b8',
                            }}
                          >
                            {t.chomage} %
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }}>{t.fret}</td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#94a3b8' }}>{t.marge}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.62rem', color: '#475569' }}>
                  Sources : INSEE RDL 2021 · IEDOM 2023 · Autorité de la concurrence avis 09-A-45 ·
                  Armateurs de France 2023
                </p>
              </div>
            )}

            {/* 4 Factors */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2
                style={{
                  margin: '0 0 0.75rem',
                  fontSize: '0.9rem',
                  color: '#e2e8f0',
                  fontWeight: 800,
                }}
              >
                Les 4 facteurs structurels des écarts de prix
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.65rem',
                }}
              >
                {[
                  {
                    e: '🚢',
                    t: 'Fret maritime',
                    v: '+7 à +16 %',
                    d: "Toute marchandise doit traverser l'océan (10 à 22 jours). Ce coût se répercute sur le prix final.",
                    c: '#0ea5e9',
                    src: 'Armateurs de France 2023',
                    url: 'https://www.armateursdefrance.org/',
                  },
                  {
                    e: '🏛️',
                    t: 'Octroi de mer',
                    v: '0 à 30 %',
                    d: "Taxe locale perçue à l'importation dans les DROM depuis 1670. Finance 35–40 % des collectivités.",
                    c: '#a855f7',
                    src: 'EUR-Lex 2022/2',
                    url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022R0002',
                  },
                  {
                    e: '🏪',
                    t: 'Oligopole distrib.',
                    v: '+10 à +25 %',
                    d: '2 à 4 groupes contrôlent 70 % de la grande distribution. Moins de concurrence = marges 2× plus élevées.',
                    c: '#f59e0b',
                    src: 'Auto. concurrence 09-A-45',
                    url: 'https://www.autoritedelaconcurrence.fr/',
                  },
                  {
                    e: '💸',
                    t: 'Revenus inférieurs',
                    v: '−35 à −76 %',
                    d: 'Revenus médians 35 à 76 % inférieurs à la métropole. Double impact : plus cher + moins de moyens.',
                    c: '#ef4444',
                    src: 'INSEE RDL 2021',
                    url: 'https://www.insee.fr/fr/statistiques/6436428',
                  },
                ].map((f) => (
                  <div
                    key={f.t}
                    style={{
                      padding: '0.8rem 0.9rem',
                      borderRadius: 10,
                      background: `${f.c}0d`,
                      border: `1px solid ${f.c}33`,
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
                      <span style={{ fontSize: '1rem' }}>{f.e}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e2e8f0' }}>
                        {f.t}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 900,
                        color: f.c,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {f.v}
                    </div>
                    <p
                      style={{
                        margin: '0 0 0.3rem',
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        lineHeight: 1.5,
                      }}
                    >
                      {f.d}
                    </p>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.6rem', color: f.c, textDecoration: 'none' }}
                    >
                      🔗 {f.src}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources */}
            {includeSources && (
              <div style={{ borderTop: '1px solid rgba(148,163,184,0.15)', paddingTop: '1rem' }}>
                <h2
                  style={{
                    margin: '0 0 0.6rem',
                    fontSize: '0.8rem',
                    color: '#64748b',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  Sources officielles
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {SOURCES.map((s) => (
                    <div
                      key={s.label}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span style={{ fontSize: '0.62rem', color: '#334155' }}>→</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.68rem', color: '#60a5fa', textDecoration: 'none' }}
                      >
                        {s.label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                borderTop: '1px solid rgba(148,163,184,0.1)',
                paddingTop: '0.75rem',
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.4rem',
                fontSize: '0.65rem',
                color: '#334155',
              }}
            >
              <span>A KI PRI SA YÉ — Observatoire citoyen des prix dans les DOM/COM</span>
              <span>Rapport généré le {today}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
