export default function Dashboard() {
  const dashboardConfig = {
    title: "Tableau de Bord Analytique",
    subtitle: "Visualisation des données de prix et tendances du marché",
    statsCards: [
      { label: "Produits suivis", value: "En cours", color: "#10b981" },
      { label: "Commerces référencés", value: "En cours", color: "#3b82f6" },
      { label: "Analyses effectuées", value: "En cours", color: "#f59e0b" }
    ]
  };

  const quickLinks = [
    { label: "🏠 Retour", href: "#/home" },
    { label: "🗺️ Carte", href: "#/carte" }
  ];

  const layoutCSS = {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#e6edf3",
    fontFamily: "system-ui, sans-serif",
    padding: "2rem 1.25rem"
  };

  const containerCSS = {
    maxWidth: "68rem",
    margin: "0 auto"
  };

  const titleCSS = {
    fontSize: "2.25rem",
    fontWeight: "700",
    marginBottom: "0.5rem",
    color: "#58a6ff"
  };

  const subtitleCSS = {
    fontSize: "1rem",
    opacity: 0.8,
    marginBottom: "2.5rem"
  };

  const cardsGridCSS = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
    gap: "1.25rem",
    marginBottom: "2.5rem"
  };

  const statCardCSS = {
    padding: "1.75rem",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "0.625rem",
    border: "1px solid rgba(255, 255, 255, 0.08)"
  };

  const chartAreaCSS = {
    height: "22rem",
    background: "linear-gradient(to bottom, #161b22, #0d1117)",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2rem",
    fontSize: "1.125rem",
    opacity: 0.6
  };

  const linksCSS = {
    display: "flex",
    gap: "1rem"
  };

  const linkButtonCSS = {
    padding: "0.875rem 1.75rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontWeight: "600",
    transition: "opacity 0.2s"
  };

  return (
    <div style={layoutCSS}>
      <div style={containerCSS}>
        <h1 style={titleCSS}>{dashboardConfig.title}</h1>
        <p style={subtitleCSS}>{dashboardConfig.subtitle}</p>

        <div style={cardsGridCSS}>
          {dashboardConfig.statsCards.map((card, idx) => (
            <div key={idx} style={statCardCSS}>
              <div style={{ 
                fontSize: "0.875rem", 
                opacity: 0.75, 
                marginBottom: "0.5rem" 
              }}>
                {card.label}
              </div>
              <div style={{ 
                fontSize: "1.75rem", 
                fontWeight: "700",
                color: card.color 
              }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <div style={chartAreaCSS}>
          <span>📈 Espace graphiques analytiques (intégration prochaine)</span>
        </div>

        <nav style={linksCSS}>
          {quickLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              style={{
                ...linkButtonCSS,
                background: i === 0 ? "#238636" : "#1f6feb",
                color: "#ffffff"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
