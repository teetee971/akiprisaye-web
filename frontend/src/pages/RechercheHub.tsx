import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import styles from './RechercheHub.module.css';
import { HeroImage } from '../components/ui/HeroImage';
import OptimizedImage from '../components/OptimizedImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const suggestedQueries = ['Produit du quotidien', 'Enseigne locale', 'Comparateur thématique'];

const destinations = [
  {
    title: 'Comparer les prix',
    description: 'Accéder au comparateur principal pour une vue synthétique.',
    to: '/comparateur',
  },
  {
    title: 'Prix observés',
    description: 'Consulter les prix observés et leurs sources par territoire.',
    to: '/observatoire',
  },
  {
    title: 'Recherche produit',
    description: 'Accéder à la recherche produit existante.',
    to: '/comparateurs',
  },
  {
    title: 'Recherche enseigne',
    description: 'Comparer les enseignes avec une navigation dédiée.',
    to: '/comparaison-enseignes',
  },
];

export default function RechercheHub() {
  const visualRef = useRef<HTMLElement | null>(null);
  const [showVisual, setShowVisual] = useState(false);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }),
    []
  );

  const formatSuggestedPrice = (index: number) => currencyFormatter.format(1.8 + index * 0.7);

  useEffect(() => {
    const node = visualRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowVisual(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    // ⚠️ A11y contract – do not alter without accessibility review.
    // Focus initial volontaire sur le champ de recherche; ordre de tabulation: champ → suggestions → destinations.
    // Choix sémantiques natifs (label/input, nav/ul/li, button/link) pour des noms accessibles sans ARIA superflu.
    // TODO(a11y): ajouter un test automatisé Lighthouse/axe en CI.
    <main className={styles.page}>
      <Helmet>
        <link rel="preload" as="image" href={PAGE_HERO_IMAGES.heroRecherche} />
      </Helmet>
      <HeroImage
        src={PAGE_HERO_IMAGES.heroRecherche}
        alt="Recherche"
        gradient="from-slate-950 to-blue-900"
        height="h-40 sm:h-52"
        loading="eager"
        fetchPriority="high"
        width={1200}
        heightPx={624}
        sizes="100vw"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          Recherche unifiée
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Point d’entrée unique pour rechercher un produit, un prix ou un magasin.
        </p>
      </HeroImage>

      <section
        ref={visualRef}
        className={styles.searchSection}
        aria-label="Habillage visuel professionnel"
      >
        <h2 className={styles.cardTitle}>Visualisation professionnelle 2D / 3D</h2>
        {showVisual ? (
          <OptimizedImage
            src={PAGE_HERO_IMAGES.sectionProfessional3d}
            alt="Visualisation professionnelle de données pour la recherche"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="w-full h-44 sm:h-56 rounded-xl object-cover border border-white/10"
          />
        ) : (
          <div
            className="w-full h-44 sm:h-56 rounded-xl border border-white/10 bg-slate-900/50"
            aria-hidden="true"
          />
        )}
      </section>

      <section className={styles.searchSection} aria-label="Recherche">
        <p className={styles.label}>
          Utilisez la recherche globale depuis l’en-tête (Ctrl/Cmd + K) pour éviter les saisies
          redondantes.
        </p>
        <Link to="/" className={styles.card}>
          <div>
            <h2 className={styles.cardTitle}>Ouvrir la recherche globale</h2>
            <p className={styles.cardDescription}>
              Retournez à l’accueil puis activez la recherche centrale.
            </p>
          </div>
          <span className={styles.cardAction}>Accéder</span>
        </Link>
        <div className={styles.suggestions}>
          {suggestedQueries.map((suggestion, index) => (
            <span key={suggestion} className={styles.suggestion}>
              {suggestion} · à partir de {formatSuggestedPrice(index)}
            </span>
          ))}
        </div>

        <div
          className={styles.results}
          aria-live="polite"
          aria-atomic="true"
          aria-label="Résultats de recherche"
        >
          <p className={styles.resultMessage}>
            La recherche centrale agrège pages, produits, enseignes et territoires dans une seule
            interface.
          </p>
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
          Cette page propose une recherche unifiée avec des données publiques externes, sans
          collecte de données personnelles ni appel direct depuis l’interface.
        </p>
      </section>
    </main>
  );
}
