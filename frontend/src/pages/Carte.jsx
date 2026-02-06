export default function Carte() {
  const pageMetadata = {
    heading: "Carte Interactive des Commerces",
    description: "Localisez les magasins et comparez leurs prix sur une carte interactive de la Guadeloupe"
  };

  const navigationLinks = [
    { text: "🏠 Accueil", target: "#/home" },
    { text: "📊 Stats", target: "#/dashboard" }
  ];

  const wrapperCSS = {
    minHeight: "100vh",
    background: "#0a0d12",
    color: "#f3f4f6",
    fontFamily: "system-ui, -apple-system, sans-serif"
  };

  const contentCSS = {
    maxWidth: "72rem",
    margin: "0 auto",
    padding: "2.5rem 1.5rem"
  };

  const headingCSS = {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "0.75rem",
    color: "#10b981"
  };

  const descCSS = {
    fontSize: "1rem",
    opacity: 0.85,
    marginBottom: "2rem",
    lineHeight: "1.6"
  };

  const mapPlaceholderCSS = {
    height: "28rem",
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "0.75rem",
    border: "2px dashed rgba(16, 185, 129, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    opacity: 0.7,
    marginBottom: "2rem"
  };

  const navContainerCSS = {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap"
  };

  const linkCSS = {
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.95rem",
    transition: "transform 0.2s"
  };

  return (
    <div style={wrapperCSS}>
      <div style={contentCSS}>
        <h1 style={headingCSS}>{pageMetadata.heading}</h1>
        <p style={descCSS}>{pageMetadata.description}</p>

        <div style={mapPlaceholderCSS}>
          <span>🗺️ Zone cartographique (intégration à venir)</span>
        </div>

        <nav style={navContainerCSS}>
          {navigationLinks.map((link, i) => (
            <a
              key={i}
              href={link.target}
              style={{
                ...linkCSS,
                background: i === 0 ? "#10b981" : "#3b82f6",
                color: i === 0 ? "#022c22" : "#fff"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {link.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
