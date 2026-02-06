export default function Home() {
  const platformInfo = {
    tagline: "Transparence des prix en Guadeloupe",
    features: [
      { icon: "🗺️", label: "Carte des magasins", path: "#/carte" },
      { icon: "📊", label: "Statistiques prix", path: "#/dashboard" },
      { icon: "📸", label: "Scanner ticket", path: "#/ocr" }
    ]
  };

  const containerCSS = {
    minHeight: "100vh",
    padding: "2rem 1.5rem",
    background: "linear-gradient(135deg, #0f1115 0%, #1a1d24 100%)",
    color: "#e5e7eb",
    fontFamily: "'Inter', system-ui, sans-serif"
  };

  const headerCSS = {
    textAlign: "center",
    maxWidth: "42rem",
    margin: "0 auto 3rem"
  };

  const titleCSS = {
    fontSize: "2.5rem",
    fontWeight: "700",
    marginBottom: "1rem",
    background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  };

  const gridCSS = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
    gap: "1.5rem",
    maxWidth: "56rem",
    margin: "0 auto"
  };

  const cardCSS = {
    padding: "2rem",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    textAlign: "center",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.3s ease",
    cursor: "pointer"
  };

  const iconCSS = {
    fontSize: "3rem",
    marginBottom: "1rem"
  };

  return (
    <div style={containerCSS}>
      <header style={headerCSS}>
        <h1 style={titleCSS}>A KI PRI SA YÉ</h1>
        <p style={{ fontSize: "1.125rem", opacity: 0.9 }}>
          {platformInfo.tagline}
        </p>
      </header>

      <main style={gridCSS}>
        {platformInfo.features.map((feat, idx) => (
          <a
            key={idx}
            href={feat.path}
            style={cardCSS}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <div style={iconCSS}>{feat.icon}</div>
            <div style={{ fontWeight: "600", fontSize: "1.125rem" }}>
              {feat.label}
            </div>
          </a>
        ))}
      </main>
    </div>
  );
}
