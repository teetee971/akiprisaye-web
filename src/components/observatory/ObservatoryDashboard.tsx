/**
 * Observatory Dashboard Component
 * 
 * Tableau de bord public de l'observatoire des prix
 * Affiche les indicateurs prioritaires de manière transparente
 */

import React, { useState, useEffect, useCallback } from 'react';
import './ObservatoryDashboard.css';
import type {
  IndicatorSnapshot,
  ObservatoryGlobalStats,
} from '../../types/observatoryIndicators';
import type { TerritoireName } from '../../types/canonicalPriceObservation';
import { loadSnapshotLocally, isSnapshotStale } from '../../services/snapshotGenerationService';

type PriceSnapshot = {
  territoire: string;
  date: string;
  source: string;
  produits: Array<{
    ean: string;
    nom: string;
    prix: number;
    enseigne: string;
  }>;
};

type ObservatoireDataset = {
  date: string;
  source: string;
  perimetre: string;
  indice_panier: number;
  variation_mensuelle: number;
  comparatif: Array<{ enseigne: string; produits: number; prix_moyen: number }>;
  serie: Array<{ mois: string; indice: number }>;
};

const DEFAULT_SNAPSHOT: IndicatorSnapshot = {
  version: '3.0.0',
  date_snapshot: '',
  indicateurs: {
    prix_moyens: [],
    ecarts_dom_hexagone: [],
    indices_vie_chere: [],
    evolutions_temporelles: [],
    dispersions_enseignes: [],
  },
  metadata: {
    nombre_observations_total: 0,
    periode_couverte: { debut: '', fin: '' },
    sources: [],
    qualite_moyenne: 0,
  },
};

const DEFAULT_OBSERVATOIRE_FALLBACK = '/data/observatoire_2026-01.json';

interface ObservatoryDashboardProps {
  territoire?: TerritoireName;
}

export const ObservatoryDashboard: React.FC<ObservatoryDashboardProps> = ({ territoire }) => {
  const [snapshot, setSnapshot] = useState<IndicatorSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoireName | undefined>(territoire);
  const [priceSnapshot, setPriceSnapshot] = useState<PriceSnapshot | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [observatoireDataset, setObservatoireDataset] = useState<ObservatoireDataset | null>(null);
  const [observatoireError, setObservatoireError] = useState<string | null>(null);

  const normalizeSnapshot = useCallback((loaded: IndicatorSnapshot): IndicatorSnapshot => {
    return {
      ...loaded,
      indicateurs: {
        prix_moyens: loaded.indicateurs?.prix_moyens ?? [],
        ecarts_dom_hexagone: loaded.indicateurs?.ecarts_dom_hexagone ?? [],
        indices_vie_chere: loaded.indicateurs?.indices_vie_chere ?? [],
        evolutions_temporelles: loaded.indicateurs?.evolutions_temporelles ?? [],
        dispersions_enseignes: loaded.indicateurs?.dispersions_enseignes ?? [],
      },
      metadata: {
        nombre_observations_total: loaded.metadata?.nombre_observations_total ?? 0,
        periode_couverte: loaded.metadata?.periode_couverte ?? { debut: '', fin: '' },
        sources: loaded.metadata?.sources ?? [],
        qualite_moyenne: loaded.metadata?.qualite_moyenne ?? 0,
      }
    };
  }, []);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let loaded = loadSnapshotLocally('observatory_snapshot');
      
      // Fallback to bundled snapshot if local storage is empty or broken
      if (!loaded) {
        const res = await fetch('/data/observatory_snapshot.json', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Impossible de charger les données (${res.status})`);
        }
        loaded = await res.json() as IndicatorSnapshot;
      }
      
      const safeSnapshot = normalizeSnapshot(loaded);
      
      if (!safeSnapshot) {
        setError('Aucune donnée disponible. Veuillez générer un snapshot.');
        setLoading(false);
        return;
      }

      if (isSnapshotStale(safeSnapshot, 24)) {
        setError('Les données sont obsolètes (plus de 24h). Un rafraîchissement est recommandé.');
      }

      setSnapshot(safeSnapshot);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(message);
      console.error('Observatoire load error:', err);
    } finally {
      setLoading(false);
    }
  }, [normalizeSnapshot]);

  useEffect(() => {
    loadSnapshot();
  }, [selectedTerritory, loadSnapshot]);

  useEffect(() => {
    const loadRealPriceSnapshot = async () => {
      try {
        const res = await fetch('/data/prix_snapshot.json');
        if (!res.ok) {
          throw new Error(`Flux prix indisponible (${res.status})`);
        }
        const data = (await res.json()) as PriceSnapshot;
        setPriceSnapshot(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Flux prix indisponible';
        setPriceError(message);
      }
    };

    const loadObservatoireDataset = async () => {
      try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const fallbackDataset = import.meta.env.VITE_OBSERVATOIRE_FALLBACK ?? DEFAULT_OBSERVATOIRE_FALLBACK;
        const urlCandidates = [`/data/observatoire_${month}.json`, fallbackDataset];

        let data: ObservatoireDataset | null = null;
        for (const url of urlCandidates) {
          const res = await fetch(url);
          if (res.ok) {
            data = (await res.json()) as ObservatoireDataset;
            break;
          }
        }
        if (!data) {
          throw new Error('Jeu de données observatoire indisponible');
        }
        setObservatoireDataset(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Dataset observatoire indisponible';
        setObservatoireError(message);
      }
    };

    loadRealPriceSnapshot();
    loadObservatoireDataset();
  }, []);

  const renderDeploymentState = (message?: string) => (
    <div className="observatory-dashboard empty">
      <div className="error-message">
        <h3>Observatoire public en cours de déploiement</h3>
        <p>Les premières données seront publiées prochainement.</p>
        {message && <p className="mt-2">{message}</p>}
        <button onClick={() => (window.location.href = '/observatoire/methodologie')}>
          Comprendre le projet
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="observatory-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des indicateurs...</p>
        </div>
      </div>
    );
  }

  const hasAnyData = Boolean(snapshot || priceSnapshot || observatoireDataset);

  if (!hasAnyData) {
    return renderDeploymentState(error ?? undefined);
  }

  const { indicateurs, metadata } = snapshot || DEFAULT_SNAPSHOT;
  const hasData =
    indicateurs.prix_moyens.length > 0 ||
    indicateurs.ecarts_dom_hexagone.length > 0 ||
    indicateurs.indices_vie_chere.length > 0 ||
    indicateurs.evolutions_temporelles.length > 0 ||
    indicateurs.dispersions_enseignes.length > 0;
  const lastUpdate = snapshot?.date_snapshot ?? observatoireDataset?.date ?? null;

  return (
    <div className="observatory-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>📊 Observatoire des Prix</h1>
        <p className="subtitle">
          Données publiques - {metadata.nombre_observations_total} observations
        </p>
        <p className="coverage-note">Périmètre couvert : Guadeloupe, Martinique (phase pilote)</p>
        {error && (
          <div className="warning-banner">
            <span>⚠️</span> {error}
          </div>
        )}
      </header>

      {/* Real price snapshot */}
      <section className="real-data-card">
        <div className="real-data-header">
          <span className="real-data-badge">Donnée réelle – relevé mensuel</span>
          <div className="real-data-meta">
            <span>{priceSnapshot?.territoire ?? 'Territoire pilote : Guadeloupe'}</span>
            <span>Campagne : {priceSnapshot?.date ?? '2026-01'}</span>
            <span>Source : {priceSnapshot?.source ?? 'Relevé terrain / tickets'}</span>
          </div>
        </div>
        {priceSnapshot ? (
          <div className="real-data-table">
            <div className="real-data-row real-data-row-head">
              <span>Produit</span>
              <span>Enseigne</span>
              <span>Prix relevé</span>
            </div>
            {priceSnapshot.produits.slice(0, 4).map((produit) => (
              <div key={produit.ean} className="real-data-row">
                <span className="truncate">{produit.nom}</span>
                <span className="truncate">{produit.enseigne}</span>
                <span className="price-cell">{produit.prix.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="fallback-text">
            {priceError
              ? `${priceError} — affichage en mode pédagogique`
              : 'Chargement du flux prix réel...'}
          </p>
        )}
      </section>

      {/* Observatoire minimal */}
      <section className="indicator-section">
        <h2>Observatoire mensuel (donnée publiée)</h2>
        <p className="section-description">
          Date : {observatoireDataset?.date ?? '2026-01'} · Source :{' '}
          {observatoireDataset?.source ?? 'Relevé terrain'} · Périmètre :{' '}
          {observatoireDataset?.perimetre ?? 'Guadeloupe (phase pilote)'}
        </p>
        {observatoireDataset ? (
          <div className="observatoire-simple">
            <div className="card">
              <p className="label">Indice panier</p>
              <p className="value">{observatoireDataset.indice_panier.toFixed(1)}</p>
              <p className="muted">Variation mensuelle : {observatoireDataset.variation_mensuelle.toFixed(1)}%</p>
            </div>
            <div className="card">
              <p className="label">Comparatif enseignes</p>
              <div className="comparatif-list">
                {observatoireDataset.comparatif.map((row) => (
                  <div key={row.enseigne} className="comparatif-row">
                    <span>{row.enseigne}</span>
                    <span>{row.produits} produits</span>
                    <span className="price-cell">{row.prix_moyen.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <p className="label">Évolution récente</p>
              <div className="mini-chart" aria-label="Évolution de l'indice panier">
                {renderMiniChart(observatoireDataset.serie)}
              </div>
            </div>
          </div>
        ) : (
          <p className="fallback-text">
            {observatoireError
              ? `${observatoireError} — données affichées en mode dégradé`
              : 'Chargement des données observatoire...'}
          </p>
        )}
      </section>

      {/* Metadata */}
      <section className="metadata-section">
        <div className="metadata-card">
          <h3>Période couverte</h3>
          <p>
            Du {formatDateSafe(metadata?.periode_couverte?.debut)} au{' '}
            {formatDateSafe(metadata?.periode_couverte?.fin)}
          </p>
        </div>
        <div className="metadata-card">
          <h3>Sources de données</h3>
          <ul>
            {metadata.sources.map((source) => (
              <li key={source}>{formatSource(source)}</li>
            ))}
          </ul>
        </div>
        <div className="metadata-card">
          <h3>Qualité moyenne</h3>
          <div className="quality-score">
            <span className="score">{Math.round(metadata.qualite_moyenne * 100)}%</span>
            <div className="quality-bar">
              <div
                className="quality-fill"
                style={{ width: `${metadata.qualite_moyenne * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Indices Vie Chère */}
      {indicateurs.indices_vie_chere.length > 0 && (
        <section className="indicator-section">
          <h2>Indice de Vie Chère (IVC)</h2>
          <p className="section-description">
            Base 100 = Hexagone. Un indice de 110 signifie +10% par rapport à l'Hexagone.
          </p>
          <div className="ivc-grid">
            {indicateurs.indices_vie_chere.map((ivc) => (
              <div key={ivc.territoire} className="ivc-card">
                <h3>{ivc.territoire}</h3>
                <div className="ivc-value">
                  <span className="indice">{ivc.indice_global}</span>
                  <span className="ecart">
                    {ivc.indice_global > 100
                      ? `+${(ivc.indice_global - 100).toFixed(1)}%`
                      : ivc.indice_global < 100
                      ? `${(ivc.indice_global - 100).toFixed(1)}%`
                      : 'Équivalent'}
                  </span>
                </div>
                <div className="categories-mini">
                  {ivc.par_categorie.slice(0, 3).map((cat) => (
                    <div key={cat.categorie} className="category-mini">
                      <span className="category-name">{cat.categorie}</span>
                      <span className="category-value">{cat.indice}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prix Moyens */}
      {indicateurs.prix_moyens.length > 0 && (
        <section className="indicator-section">
          <h2>Prix Moyens par Produit</h2>
          <p className="section-description">
            Calculés à partir de {indicateurs.prix_moyens.reduce((sum, p) => sum + p.nombre_observations, 0)} observations
          </p>
          <div className="table-container">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Territoire</th>
                  <th>Prix Moyen</th>
                  <th>Observations</th>
                </tr>
              </thead>
              <tbody>
                {indicateurs.prix_moyens.slice(0, 20).map((price, idx) => (
                  <tr key={idx}>
                    <td>{price.produit}</td>
                    <td>{price.categorie}</td>
                    <td>{price.territoire}</td>
                    <td className="price-cell">{price.prix_moyen.toFixed(2)} €</td>
                    <td className="obs-count">{price.nombre_observations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Écarts DOM/Hexagone */}
      {indicateurs.ecarts_dom_hexagone.length > 0 && (
        <section className="indicator-section">
          <h2>Écarts DOM vs Hexagone</h2>
          <p className="section-description">
            Comparaison factuelle des prix observés (non ajustés)
          </p>
          <div className="table-container">
            <table className="gap-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Territoire DOM</th>
                  <th>Prix DOM</th>
                  <th>Prix Hexagone</th>
                  <th>Écart</th>
                </tr>
              </thead>
              <tbody>
                {indicateurs.ecarts_dom_hexagone.slice(0, 20).map((gap, idx) => (
                  <tr key={idx}>
                    <td>{gap.produit}</td>
                    <td>{gap.territoire_dom}</td>
                    <td className="price-cell">{gap.prix_dom.toFixed(2)} €</td>
                    <td className="price-cell">{gap.prix_hexagone.toFixed(2)} €</td>
                    <td className={`gap-cell ${gap.signification}`}>
                      {gap.ecart_pourcentage > 0 ? '+' : ''}
                      {gap.ecart_pourcentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Évolutions Temporelles */}
      {indicateurs.evolutions_temporelles.length > 0 && (
        <section className="indicator-section">
          <h2>Évolutions Temporelles</h2>
          <p className="section-description">
            Variation des prix sur différentes périodes
          </p>
          <div className="evolution-grid">
            {indicateurs.evolutions_temporelles.slice(0, 10).map((evolution, idx) => (
              <div key={idx} className="evolution-card">
                <h4>{evolution.produit}</h4>
                <div className="current-price">
                  Prix actuel: <strong>{evolution.prix_actuel.toFixed(2)} €</strong>
                </div>
                <div className="evolutions-list">
                  {evolution.evolutions.map((ev) => (
                    <div key={ev.periode} className="evolution-item">
                      <span className="period">{ev.periode}</span>
                      <span className={`variation ${ev.variation_pourcentage >= 0 ? 'up' : 'down'}`}>
                        {ev.variation_pourcentage > 0 ? '+' : ''}
                        {ev.variation_pourcentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className={`trend trend-${evolution.tendance}`}>
                  Tendance: {formatTendance(evolution.tendance)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dispersions Enseignes */}
      {indicateurs.dispersions_enseignes.length > 0 && (
        <section className="indicator-section">
          <h2>Dispersion par Enseigne</h2>
          <p className="section-description">
            Comparaison factuelle sans classement punitif
          </p>
          <div className="dispersion-grid">
            {indicateurs.dispersions_enseignes.slice(0, 6).map((dispersion, idx) => (
              <div key={idx} className="dispersion-card">
                <h4>{dispersion.produit}</h4>
                <div className="stats">
                  <div className="stat">
                    <span className="label">Min</span>
                    <span className="value">{dispersion.statistiques.prix_min.toFixed(2)} €</span>
                  </div>
                  <div className="stat">
                    <span className="label">Médiane</span>
                    <span className="value">{dispersion.statistiques.prix_median.toFixed(2)} €</span>
                  </div>
                  <div className="stat">
                    <span className="label">Max</span>
                    <span className="value">{dispersion.statistiques.prix_max.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="store-count">
                  {dispersion.nombre_enseignes} enseignes comparées
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasData && (
        <div className="warning-banner" style={{ marginTop: '2rem' }}>
          <span>ℹ️</span> Données en mode dégradé. Les listes ci-dessous peuvent être limitées.
        </div>
      )}

      {/* Footer with Transparency */}
      <footer className="dashboard-footer">
        <div className="transparency-section">
          <h3>🔐 Transparence et Méthodologie</h3>
          <ul>
            <li>✅ Données observées, pas déclaratives</li>
            <li>✅ Aucune donnée commerciale interne</li>
            <li>✅ Anonymisation stricte</li>
            <li>✅ Pas de classement punitif - comparaison factuelle uniquement</li>
            <li>✅ Sources citées: {metadata.sources.map(formatSource).join(', ')}</li>
          </ul>
          <p className="update-info">
            Dernière mise à jour: {lastUpdate ? new Date(lastUpdate).toLocaleString('fr-FR') : 'à publier'}
          </p>
        </div>
      </footer>
    </div>
  );
};

// Helper functions
function formatSource(source: string): string {
  const sourceLabels: Record<string, string> = {
    releve_citoyen: 'Relevés citoyens',
    ticket_scan: 'Scan de tickets',
    donnee_ouverte: 'Données ouvertes',
    releve_terrain: 'Relevés terrain',
    api_publique: 'APIs publiques',
  };
  return sourceLabels[source] || source;
}

function formatTendance(tendance: 'hausse' | 'baisse' | 'stable'): string {
  const labels = {
    hausse: '📈 Hausse',
    baisse: '📉 Baisse',
    stable: '➡️ Stable',
  };
  return labels[tendance];
}

function formatDateSafe(value?: string): string {
  if (!value) {
    return 'à publier';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return 'à publier';
  }
  return date.toLocaleDateString('fr-FR');
}

function renderMiniChart(points: ObservatoireDataset['serie']) {
  if (!points?.length) return <span className="fallback-text">Aucune donnée temporelle</span>;
  const maxValue = points.reduce((max, p) => (p.indice > max ? p.indice : max), 1);

  return (
    <div className="mini-chart-bars" role="img" aria-label="Évolution de l'indice panier publié">
      {points.map((point) => (
        <div
          key={point.mois}
          className="mini-bar"
          title={`${point.mois} : ${point.indice}`}
          style={{ height: `${(point.indice / maxValue) * 100}%` }}
          >
          <span className="mini-label">{point.mois.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default ObservatoryDashboard;
