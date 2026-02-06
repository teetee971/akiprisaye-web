export default function Carte() {
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
          🗺️ Carte Interactive
        </h1>
        <p style={{ opacity: 0.85 }}>
          Visualisez les commerces et comparez les prix en temps réel
        </p>
      </header>
      
      <main>
        <div style={{
          padding: "24px",
          background: "#1a1d24",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          <p>
            La carte interactive affiche les magasins et leurs prix.<br />
            Cette page sera connectée à la fonctionnalité complète.
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
          <a href="#/dashboard" style={{
            padding: "10px 16px",
            background: "#3b82f6",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600
          }}>
            Dashboard
          </a>
        </nav>
      </main>
    </div>
  );
}
