export default function Home() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      padding: "24px",
      background: "#0f1115",
      color: "#ffffff",
      fontFamily: "system-ui, sans-serif"
    }}>
      <header style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "12px" }}>
          🟢 A KI PRI SA YÉ
        </h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.85 }}>
          Plateforme citoyenne de transparence des prix
        </p>
      </header>
      
      <main style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          padding: "24px",
          background: "#1a1d24",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
            Bienvenue !
          </h2>
          <p style={{ lineHeight: 1.6, marginBottom: "16px" }}>
            Notre plateforme vous permet de comparer les prix, visualiser les commerces 
            et faire des économies au quotidien.
          </p>
          <p style={{ lineHeight: 1.6 }}>
            Utilisez les boutons ci-dessous pour naviguer vers les différentes fonctionnalités.
          </p>
        </div>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginTop: "32px"
        }}>
          <a href="#/carte" style={{
            padding: "24px",
            background: "#22c55e",
            color: "#022c22",
            borderRadius: "8px",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600
          }}>
            🗺️ Carte Interactive
          </a>
          <a href="#/dashboard" style={{
            padding: "24px",
            background: "#3b82f6",
            color: "#ffffff",
            borderRadius: "8px",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600
          }}>
            📊 Dashboard
          </a>
          <a href="#/ocr" style={{
            padding: "24px",
            background: "#f59e0b",
            color: "#000000",
            borderRadius: "8px",
            textDecoration: "none",
            textAlign: "center",
            fontWeight: 600
          }}>
            📸 Scanner OCR
          </a>
        </div>
      </main>
    </div>
  );
}
