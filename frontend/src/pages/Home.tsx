import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home-mobile.css';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }

    navigate(`/recherche-prix?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="home-mobile">
      <section className="home-mobile__hero">
        <p className="home-mobile__eyebrow">Comparateur citoyen DOM</p>
        <h1>Comparez les prix en quelques secondes</h1>
        <p className="home-mobile__subtitle">Recherchez un produit, scannez un code EAN ou importez votre ticket.</p>

        <form className="home-mobile__search" onSubmit={handleSearch}>
          <input
            id="home-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Ex : lait 1L, riz, huile"
            aria-label="Rechercher un produit"
          />
          <button type="submit">Rechercher</button>
        </form>

        <div className="home-mobile__actions" aria-label="Actions principales">
          <Link className="home-mobile__action" to="/recherche-prix">
            Rechercher un produit
          </Link>
          <Link className="home-mobile__action" to="/scan-ean">
            Scanner EAN
          </Link>
          <Link className="home-mobile__action" to="/recherche-prix?source=ticket">
            Scanner un ticket
          </Link>
        </div>
      </section>

      <section className="home-mobile__details">
        <button
          type="button"
          className="home-mobile__accordionTrigger"
          aria-expanded={isWhyExpanded}
          onClick={() => setIsWhyExpanded((prev) => !prev)}
        >
          Pourquoi A KI PRI SA YÉ ?
        </button>

        {isWhyExpanded && (
          <div className="home-mobile__accordionContent">
            <p>Prix observés localement, comparaison multi-enseignes, historique consultable sans création de compte.</p>
            <div className="home-mobile__links">
              <Link to="/about">En savoir plus</Link>
              <Link to="/faq">FAQ complète</Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
