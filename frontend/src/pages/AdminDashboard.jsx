// Real AdminDashboard page from src/pages/AdminDashboard.jsx
// Stub version for frontend build

export default function AdminDashboard() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#3b82f6" }}>
        📊 Dashboard Admin
      </h1>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {[
          { label: "Paniers actifs", value: "-", color: "#10b981" },
          { label: "Observations", value: "-", color: "#3b82f6" },
          { label: "Utilisateurs", value: "-", color: "#f59e0b" }
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#1a1d24",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #2d3748"
            }}
          >
            <div style={{ fontSize: "0.875rem", opacity: 0.75, marginBottom: "0.5rem" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "#1a1d24",
        padding: "2rem",
        borderRadius: "0.75rem",
        border: "1px solid #2d3748",
        marginBottom: "2rem"
      }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Gestion des paniers anti-crise</h2>
        <p style={{ opacity: 0.85 }}>
          Interface de gestion administrative pour les paniers solidaires.
        </p>
      </div>

      <div style={{
        background: "#1a1d24",
        padding: "2rem",
        borderRadius: "0.75rem",
        border: "1px solid #2d3748"
      }}>
        <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>
          <strong>Note:</strong> Cette page est la vraie page AdminDashboard (src/pages/AdminDashboard.jsx).
          Pour la version complète avec authentification Firebase, gestion des paniers, modération,
          et toutes les fonctionnalités admin, le système complet est nécessaire avec:
        </p>
        <ul style={{ marginTop: "1rem", paddingLeft: "2rem", opacity: 0.8, fontSize: "0.9rem", lineHeight: "1.8" }}>
          <li>Context AuthContext pour l'authentification</li>
          <li>Services adminPanieService</li>
          <li>Firebase configuration</li>
          <li>Base de données Firestore</li>
        </ul>
      </div>
    </div>
  );
}
