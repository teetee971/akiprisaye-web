import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductSearch } from '../hooks/useProductSearch';
import styles from './RechercheHub.module.css';

const suggestedQueries = [
  'Produit du quotidien',
  'Enseigne locale',
  'Comparateur thématique',
];

const destinations = [
  {
    title: 'Comparer les prix',
    description: 'Accéder au comparateur principal pour une vue synthétique.',
    to: '/comparateur',
  },
  {
    title: 'Prix observés',
    description: 'Consulter les prix observés et leurs sources par territoire.',
    to: '/recherche-prix-observes',
  },
  {
    title: 'Recherche produit',
    description: 'Accéder à la recherche produit existante.',
    to: '/comparateur-formats',
  },
  {
    title: 'Recherche enseigne',
    description: 'Comparer les enseignes avec une navigation dédiée.',
    to: '/comparaison-enseignes',
  },
];

export default function RechercheHub() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { results, loading, error, hasQuery } = useProductSearch(query);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
    [],
  );

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const formatPrice = (price?: number, range?: [number, number]) => {
    if (price !== undefined) {
      return currencyFormatter.format(price);
    }
    if (range) {
      return `${currencyFormatter.format(range[0])} – ${currencyFormatter.format(range[1])}`;
    }
    return 'Prix indisponible';
  };

  const formatSource = (source: string, region?: string) => {
    const base =
      source === 'openfoodfacts'
        ? 'Open Food Facts'
        : source === 'datagouv'
          ? 'Data.gouv.fr'
          : 'Estimation données publiques';
    return region ? `${base} (${region})` : base;
  };

  const formatUpdatedAt = (value: string) =>
    new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });

  return (
    // ⚠️ A11y contract – do not alter without accessibility review.
    // Focus initial volontaire sur le champ de recherche; ordre de tabulation: champ → suggestions → destinations.
    // Choix sémantiques natifs (label/input, nav/ul/li, button/link) pour des noms accessibles sans ARIA superflu.
    // TODO(a11y): ajouter un test automatisé Lighthouse/axe en CI.
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Recherche & comparaison</p>
        <h1 className={styles.title}>Point d’entrée unique pour vos recherches</h1>
        <p className={styles.subtitle}>
          Un accès central, sobre et clair pour orienter vos recherches sans surcharge visuelle.
        </p>
      </header>

      <section className={styles.searchSection} aria-label="Recherche">
        <label className={styles.label} htmlFor="recherche-hub-input">
          Rechercher
        </label>
        <input
          id="recherche-hub-input"
          className={styles.input}
          type="search"
          placeholder="Produit, enseigne ou comparateur"
          autoComplete="off"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          ref={inputRef}
        />
        <div className={styles.suggestions}>
          {suggestedQueries.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={styles.suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div
          className={styles.results}
          aria-live="polite"
          aria-atomic="true"
          aria-label="Résultats de recherche"
        >
          {loading && <p className={styles.resultMessage}>Recherche en cours...</p>}
          {!loading && error && (
            <p className={styles.resultMessage} role="alert">
              {error} Les résultats peuvent être limités.
            </p>
          )}
          {!loading && !error && hasQuery && results.length === 0 && (
            <p className={styles.resultMessage}>
              Aucun résultat pour l’instant. Essayez un autre libellé.
            </p>
          )}
          {!loading && results.length > 0 && (
            <ul className={styles.resultList}>
              {results.map((product) => (
                <li key={product.id} className={styles.resultItem}>
                  <button
                    type="button"
                    className={styles.resultCard}
                    aria-disabled="true"
                    aria-describedby={`${product.id}-hint`}
                  >
                    <span className={styles.resultTitle}>{product.name}</span>
                    <span className={styles.resultMeta}>
                      {[product.brand, product.store, product.location]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className={styles.resultPrice}>
                      {formatPrice(product.price, product.priceRange)}
                    </span>
                    <span className={styles.resultUpdated}>
                      {product.price
                        ? 'Prix observé'
                        : product.priceRange
                          ? 'Prix estimé'
                          : 'Infos produit'}{' '}
                      – {formatSource(product.source, product.region)} – mis à jour le{' '}
                      {formatUpdatedAt(product.lastUpdated)}
                    </span>
                  </button>
                  <span id={`${product.id}-hint`} className={styles.srOnly}>
                    Détails indisponibles pour le moment.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <nav className={styles.destinations} aria-label="Recherche et comparaison">
        <ul className={styles.destinationList}>
          {destinations.map((destination) => (
            <li key={destination.title} className={styles.destinationItem}>
              <Link to={destination.to} className={styles.card}>
                <div>
                  <h2 className={styles.cardTitle}>{destination.title}</h2>
                  <p className={styles.cardDescription}>{destination.description}</p>
                </div>
                <span className={styles.cardAction}>Accéder</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={styles.note} aria-label="Transparence">
        <p>
          Cette page propose une recherche unifiée avec des données publiques externes,
          sans collecte de données personnelles ni appel direct depuis l’interface.
        </p>
      </section>
    </main>
  );
}
