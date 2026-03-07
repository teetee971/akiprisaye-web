 
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
import type { TerritoryCode } from '../../types/PriceObservation';
import { loadSnapshotLocally, isSnapshotStale } from '../../services/snapshotGenerationService';

const TERRITORY_LABELS: Record<TerritoryCode, string> = {
  FR: 'Hexagone',
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
  RE: 'La Réunion',
  YT: 'Mayotte',
  PM: 'Saint-Pierre-et-Miquelon',
  BL: 'Saint-Barthélemy',
  MF: 'Saint-Martin',
  WF: 'Wallis-et-Futuna',
  PF: 'Polynésie française',
  NC: 'Nouvelle-Calédonie',
};

interface ObservatoryDashboardProps {
  territoire?: TerritoryCode;
}

export const ObservatoryDashboard: React.FC<ObservatoryDashboardProps> = ({ territoire }) => {
  const [snapshot, setSnapshot] = useState<IndicatorSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryCode | undefined>(territoire);

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

  const formatTerritory = useCallback((territory?: TerritoryCode) => {
    if (!territory) return 'Territoire';
    return TERRITORY_LABELS[territory] ?? territory;
  }, []);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let loaded = loadSnapshotLocally('observatory_snapshot');
      
      // Fallback to bundled snapshot if local storage is empty or broken
      if (!loaded) {
        const res = await fetch(`${import.meta.env.BASE_URL}data/observatory_snapshot.json`, { cache: 'no-store' });
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

  const renderDeploymentState = (message?: string) => (
    <div className="observatory-dashboard empty">
      <div className="error-message">
        <h3>Observatoire public en cours de déploiement</h3>
        <p>Les premières données seront publiées prochainement.</p>
        {message && <p className="mt-2">{message}</p>}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/observatoire/methodologie';
            }
          }}
        >
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

  if (error && !snapshot) {
    return renderDeploymentState(error);
  }

  if (!snapshot) {
    return renderDeploymentState(error ?? undefined);
  }

  const { indicateurs, metadata } = snapshot;
  const hasData =
    indicateurs.prix_moyens.length > 0 ||
    indicateurs.ecarts_dom_hexagone.length > 0 ||
    indicateurs.indices_vie_chere.length > 0 ||
    indicateurs.evolutions_temporelles.length > 0 ||
    indicateurs.dispersions_enseignes.length > 0;

  if (!hasData) {
    return renderDeploymentState(error ?? undefined);
  }

  return (
    <div className="observatory-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h2>📊 Observatoire des Prix</h2>
        <p className="subtitle">
          Données publiques - {metadata.nombre_observations_total} observations
        </p>
        {error && (
          <div className="warning-banner">
            <span>⚠️</span> {error}
          </div>
        )}
      </header>

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
            <span className="score">{Math.round(metadata.qualite_moyenne)}%</span>
            <div className="quality-bar">
              <div
                className="quality-fill"
                style={{ width: `${metadata.qualite_moyenne}%` }}
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
                <h3>{formatTerritory(ivc.territoire)}</h3>
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
                    <td>{formatTerritory(price.territoire)}</td>
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
                    <td>{formatTerritory(gap.territoire_dom)}</td>
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
                <h3>{evolution.produit}</h3>
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
                <h3>{dispersion.produit}</h3>
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
            Dernière mise à jour: {new Date(snapshot.date_snapshot).toLocaleString('fr-FR')}
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

export default ObservatoryDashboard;
