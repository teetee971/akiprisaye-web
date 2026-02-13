import { Link } from 'react-router-dom';

export default function ObservatorySection() {
  return (
    <section className="observatory-v5 fade-in section-reveal">
      <div className="observatory-content slide-up">
        <span className="observatory-icon">🏛️</span>
        <h3 className="observatory-title">Observatoire citoyen indépendant</h3>
        <div className="observatory-badge">🏛️ Données certifiées Etalab 2.0</div>
        <p className="observatory-desc">Toutes nos données sont ouvertes et vérifiables</p>
        <div className="observatory-actions">
          <Link to="/observatoire" className="btn-observatory">
            Accéder à l'observatoire
          </Link>
          <Link to="/methodologie" className="btn-docs">
            Pack presse
          </Link>
        </div>
      </div>
    </section>
  );
}
