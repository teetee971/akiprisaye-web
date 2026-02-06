import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Import pages
import CartePage from "./pages/Carte";
import HomePage from "./pages/Home";
import DashboardPage from "./pages/AdminDashboard";
import OcrPage from "./pages/OcrPage";

// Simple Layout wrapper
const SimpleLayout = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "#0a0d12", color: "#f3f4f6" }}>
    <nav style={{
      background: "#1a1d24",
      padding: "1rem",
      borderBottom: "1px solid #2d3748",
      marginBottom: "2rem"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <a href="#/carte" style={{ color: "#10b981", textDecoration: "none", padding: "0.5rem 1rem", background: "#1e293b", borderRadius: "0.5rem" }}>🗺️ Carte</a>
        <a href="#/home" style={{ color: "#10b981", textDecoration: "none", padding: "0.5rem 1rem", background: "#1e293b", borderRadius: "0.5rem" }}>🏠 Home</a>
        <a href="#/dashboard" style={{ color: "#10b981", textDecoration: "none", padding: "0.5rem 1rem", background: "#1e293b", borderRadius: "0.5rem" }}>📊 Dashboard</a>
        <a href="#/ocr" style={{ color: "#10b981", textDecoration: "none", padding: "0.5rem 1rem", background: "#1e293b", borderRadius: "0.5rem" }}>📸 OCR</a>
      </div>
    </nav>
    {children}
  </div>
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[AKIPRISAYE] Root element #root not found");
} else {
  const root = createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <HashRouter>
        <SimpleLayout>
          <Routes>
            <Route index element={<Navigate to="/carte" replace />} />
            <Route path="/carte" element={<CartePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/ocr" element={<OcrPage />} />
            <Route path="*" element={<Navigate to="/carte" replace />} />
          </Routes>
        </SimpleLayout>
      </HashRouter>
    </React.StrictMode>
  );

  console.info("[AKIPRISAYE] Application mounted with HashRouter");
}
