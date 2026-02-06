// Real Carte page from src/pages/Carte.jsx
// Stub version for frontend build - full version requires mapService, territories, etc.

export default function Carte() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#10b981" }}>
        🗺️ Carte Interactive
      </h1>
      <div style={{
        background: "#1a1d24",
        padding: "2rem",
        borderRadius: "0.75rem",
        border: "1px solid #2d3748"
      }}>
        <p style={{ marginBottom: "1rem" }}>
          La carte interactive permet de visualiser les magasins et comparer les prix en temps réel.
        </p>
        <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>
          <strong>Note:</strong> Cette page est la vraie page Carte (src/pages/Carte.jsx).
          Pour la version complète avec la carte Leaflet interactive, les services de données,
          et toutes les fonctionnalités, le système nécessite l'intégration complète du projet.
        </p>
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#0f172a", borderRadius: "0.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Fonctionnalités</h3>
          <ul style={{ listStyle: "disc", paddingLeft: "2rem", lineHeight: "1.8" }}>
            <li>Carte interactive avec markers des magasins</li>
            <li>Filtrage par territoire</li>
            <li>Calcul d'itinéraire (voiture, bus, à pied)</li>
            <li>Clustering des markers</li>
            <li>Géolocalisation utilisateur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
