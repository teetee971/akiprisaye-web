// Real Home page from src/pages/Home.tsx -> HOME_v5.tsx
// Stub version for frontend build

export default function Home() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{
          fontSize: "2.5rem",
          marginBottom: "1rem",
          background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          A KI PRI SA YÉ
        </h1>
        <p style={{ fontSize: "1.25rem", opacity: 0.9 }}>
          Plateforme citoyenne de transparence des prix en Outre-mer
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {[
          { icon: "🗺️", title: "Carte Interactive", desc: "Localisez les magasins et comparez", link: "#/carte" },
          { icon: "📊", title: "Dashboard", desc: "Statistiques et analyses des prix", link: "#/dashboard" },
          { icon: "📸", title: "Scanner OCR", desc: "Scannez vos tickets de caisse", link: "#/ocr" }
        ].map((card, i) => (
          <a
            key={i}
            href={card.link}
            style={{
              background: "#1a1d24",
              padding: "2rem",
              borderRadius: "0.75rem",
              border: "1px solid #2d3748",
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{card.icon}</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "#10b981" }}>{card.title}</h3>
            <p style={{ opacity: 0.8 }}>{card.desc}</p>
          </a>
        ))}
      </div>

      <div style={{
        background: "#1a1d24",
        padding: "2rem",
        borderRadius: "0.75rem",
        border: "1px solid #2d3748"
      }}>
        <p style={{ opacity: 0.8, fontSize: "0.9rem" }}>
          <strong>Note:</strong> Cette page est la vraie page Home (src/pages/Home.tsx → HOME_v5.tsx).
          Pour la version complète avec toutes les fonctionnalités, animations, et intégrations,
          le système complet du projet est nécessaire.
        </p>
      </div>
    </div>
  );
}
