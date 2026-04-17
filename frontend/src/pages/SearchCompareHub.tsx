import { useEffect, useMemo, useState } from 'react';
import styles from './SearchCompareHub.module.css';
import { priceObservationService } from '../services/priceObservationService';
import type { PriceObservation } from '../types/PriceObservation';

const PERIOD_OPTIONS: Array<{ label: string; value: number | 'all' }> = [
  { label: 'Toutes périodes', value: 'all' },
  { label: '7 derniers jours', value: 7 },
  { label: '30 derniers jours', value: 30 },
  { label: '90 derniers jours', value: 90 },
];

const SOURCE_OPTIONS: Array<{ label: string; value: PriceObservation['sourceType'] | 'all' }> = [
  { label: 'Toutes sources', value: 'all' },
  { label: 'Tickets citoyens', value: 'citizen' },
  { label: 'Données ouvertes', value: 'open_data' },
  { label: 'Partenariats (désactivé)', value: 'partner' },
];

const getConfidenceLabel = (score: number): 'faible' | 'moyenne' | 'élevée' => {
  if (score >= 70) {
    return 'élevée';
  }
  if (score >= 45) {
    return 'moyenne';
  }
  return 'faible';
};

const getSourceLabel = (sourceType: PriceObservation['sourceType']): string => {
  switch (sourceType) {
    case 'citizen':
      return 'Prix observé (tickets citoyens)';
    case 'open_data':
      return 'Prix moyen (données ouvertes)';
    case 'partner':
      return 'Prix observé (partenaires)';
    default:
      return 'Source inconnue';
  }
};

export default function SearchCompareHub() {
  const [query, setQuery] = useState('');
  const [territory, setTerritory] = useState('all');
  const [store, setStore] = useState('all');
  const [period, setPeriod] = useState<number | 'all'>('all');
  const [source, setSource] = useState<PriceObservation['sourceType'] | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PriceObservation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
    []
  );

  const [options, setOptions] = useState<{ territories: string[]; stores: string[] }>({
    territories: [],
    stores: [],
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    priceObservationService
      .search({ query: '', territory: 'all', store: 'all', source: 'all', periodDays: 'all' })
      .then((items) => {
        if (!isMounted) {
          return;
        }
        const territories = Array.from(new Set(items.map((item) => item.territory))).sort();
        const stores = Array.from(
          new Set(items.map((item) => item.storeLabel).filter((s): s is string => s !== undefined))
        ).sort();
        setOptions({ territories, stores });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setOptions({ territories: [], stores: [] });
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const storeAliases = useMemo(() => {
    const aliasMap = new Map<string, string>();
    options.stores.forEach((label, index) => {
      aliasMap.set(label, `Enseigne ${String.fromCharCode(65 + index)}`);
    });
    return aliasMap;
  }, [options.stores]);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      priceObservationService
        .search({
          query,
          territory,
          store,
          source,
          periodDays: period,
        })
        .then((items) => {
          if (!isActive) {
            return;
          }
          setResults(items);
          setError(null);
        })
        .catch(() => {
          if (!isActive) {
            return;
          }
          setResults([]);
          setError('Impossible de charger les observations pour le moment.');
        })
        .finally(() => {
          if (!isActive) {
            return;
          }
          setLoading(false);
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [period, query, source, store, territory]);

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Recherche & comparaison</p>
        <h1 className={styles.title}>Prix observés par territoire</h1>
        <p className={styles.subtitle}>
          Des prix issus de tickets citoyens et de données ouvertes, présentés avec leur source,
          leur territoire et leur niveau de confiance.
        </p>
      </header>

      <section className={styles.controls} aria-label="Filtres de recherche">
        <div className={styles.controlGroup}>
          <label className={styles.label} htmlFor="search-query">
            Produit ou catégorie
          </label>
          <input
            id="search-query"
            className={styles.input}
            type="search"
            placeholder="Ex : lait, pâte, lessive..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className={styles.controlRow}>
          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="search-territory">
              Territoire
            </label>
            <select
              id="search-territory"
              className={styles.select}
              value={territory}
              onChange={(event) => setTerritory(event.target.value)}
            >
              <option value="all">Tous les territoires</option>
              {options.territories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="search-store">
              Enseigne
            </label>
            <select
              id="search-store"
              className={styles.select}
              value={store}
              onChange={(event) => setStore(event.target.value)}
            >
              <option value="all">Toutes les enseignes</option>
              {options.stores.map((item) => (
                <option key={item} value={item}>
                  {storeAliases.get(item) ?? 'Enseigne locale'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.controlRow}>
          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="search-period">
              Période
            </label>
            <select
              id="search-period"
              className={styles.select}
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value === 'all' ? 'all' : Number(event.target.value))
              }
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="search-source">
              Source
            </label>
            <select
              id="search-source"
              className={styles.select}
              value={source}
              onChange={(event) =>
                setSource(event.target.value as PriceObservation['sourceType'] | 'all')
              }
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={styles.results} aria-live="polite" aria-label="Résultats">
        {loading && <p className={styles.resultMessage}>Chargement des observations...</p>}
        {!loading && error && (
          <p className={styles.resultMessage} role="alert">
            {error}
          </p>
        )}
        {!loading && !error && results.length === 0 && (
          <p className={styles.resultMessage}>
            Aucun prix observé pour cette recherche. Ajustez les filtres ou élargissez la période.
          </p>
        )}
        {!loading && results.length > 0 && (
          <ul className={styles.resultList}>
            {results.map((item) => {
              const confidenceLabel = getConfidenceLabel(item.confidenceScore ?? 0);
              const storeLabel = storeAliases.get(item.storeLabel ?? '') ?? 'Enseigne locale';
              const tooltipId = `tooltip-${item.productId}`;
              const isExpanded = expandedId === item.productId;

              return (
                <li key={`${item.productId}-${item.observedAt}`} className={styles.resultItem}>
                  <article className={styles.resultCard}>
                    <div>
                      <h2 className={styles.resultTitle}>{item.productLabel}</h2>
                      <p className={styles.resultMeta}>
                        {item.territory} · {storeLabel}
                      </p>
                    </div>
                    <div className={styles.resultPriceRow}>
                      <span className={styles.resultPrice}>
                        {currencyFormatter.format(item.price)}
                      </span>
                      <span className={styles.resultBadge}>Confiance : {confidenceLabel}</span>
                    </div>
                    <p className={styles.resultDetails}>
                      {getSourceLabel(item.sourceType)} · {item.observationsCount ?? 0} ticket
                      {(item.observationsCount ?? 0) > 1 ? 's' : ''} ·{' '}
                      {new Date(item.observedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <button
                      type="button"
                      className={styles.tooltipButton}
                      aria-expanded={isExpanded}
                      aria-controls={tooltipId}
                      onClick={() => handleToggle(item.productId)}
                    >
                      Comment ce prix est calculé
                    </button>
                    <div
                      id={tooltipId}
                      role="tooltip"
                      aria-label="Méthode de calcul du prix"
                      className={isExpanded ? styles.tooltip : styles.tooltipHidden}
                    >
                      <p className={styles.tooltipText}>
                        Ce prix est calculé à partir des observations disponibles (tickets citoyens
                        ou données ouvertes), en tenant compte de la récence et du nombre de
                        relevés.
                      </p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.note} aria-label="Transparence">
        <p>
          Les prix affichés sont issus de sources citoyennes et de données ouvertes. Aucun site
          marchand n’est interrogé et les partenariats restent désactivés par défaut.
        </p>
      </section>
    </main>
  );
}
