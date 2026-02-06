export default function Dashboard() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "24px",
      background: "#0f1115",
      color: "#ffffff",
      fontFamily: "system-ui, sans-serif"
    }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
          📊 Dashboard
        </h1>
        <p style={{ opacity: 0.85 }}>
          Tableau de bord des statistiques et analyses de prix
        </p>
      </header>
      
      <main>
        <div style={{
          padding: "24px",
          background: "#1a1d24",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
            Aperçu des données
          </h2>
          <p>
            Le dashboard présente les statistiques et analyses en temps réel.<br />
            Cette page sera connectée aux données complètes.
          </p>
        </div>
        
        <nav style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <a href="#/" style={{
            padding: "10px 16px",
            background: "#22c55e",
            color: "#022c22",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600
          }}>
            Retour Accueil
          </a>
          <a href="#/carte" style={{
            padding: "10px 16px",
            background: "#3b82f6",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600
          }}>
            Carte
          </a>
        </nav>
      </main>
    </div>
  );
}
