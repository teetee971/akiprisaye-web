import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Carte from "./pages/Carte";
import Dashboard from "./pages/Dashboard";
import OcrPage from "./pages/OcrPage";

const container = document.getElementById("root");

if (container) {
  try {
    const root = createRoot(container);

    root.render(
      <React.StrictMode>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/carte" element={<Carte />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ocr" element={<OcrPage />} />
            <Route path="*" element={<Navigate to="/carte" replace />} />
          </Routes>
        </HashRouter>
      </React.StrictMode>
    );

    console.info("[React] App montée avec succès (HashRouter actif)");
  } catch (err) {
    console.error("[React] Erreur au montage", err);
  }
} else {
  console.error("[React] Element #root introuvable");
}
