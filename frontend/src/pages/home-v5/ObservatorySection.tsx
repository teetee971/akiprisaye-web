import { Link } from 'react-router-dom';

const OBSERVATORY_STATS = [
  { icon: '🛒', value: '5 000+', label: 'produits suivis' },
  { icon: '📷', value: '1 200+', label: 'scans validés' },
  { icon: '🗺️', value: '12', label: 'territoires couverts' },
  { icon: '🔔', value: '300+', label: 'alertes actives' },
];

export default function ObservatorySection() {
  return (
    <section className="observatory-v5 fade-in section-reveal">
      <div className="observatory-content slide-up">
        <span className="observatory-icon">🏛️</span>
        <h3 className="observatory-title">Observatoire citoyen indépendant</h3>
        <div className="observatory-badge">🏛️ Données certifiées Etalab 2.0</div>
        <p className="observatory-desc">Toutes nos données sont ouvertes, vérifiables et mises à jour en continu.</p>

        <div className="observatory-stats">
          {OBSERVATORY_STATS.map((stat) => (
            <div key={stat.label} className="observatory-stat-item">
              <span className="observatory-stat-icon">{stat.icon}</span>
              <span className="observatory-stat-value">{stat.value}</span>
              <span className="observatory-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="observatory-actions">
          <Link to="/observatoire" className="btn-observatory">
            Accéder à l'observatoire
          </Link>
          <Link to="/methodologie" className="btn-docs">
            Voir la méthodologie
          </Link>
        </div>
      </div>
    </section>
  );
}
