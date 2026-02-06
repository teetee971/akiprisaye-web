export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "Inter, system-ui, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>
          A KI PRI SA YÉ
        </h1>
        <p style={{ opacity: 0.85 }}>
          React est chargé via Vite.<br />
          Le fallback statique est sécurisé.
        </p>
      </div>
    </div>
  );
}