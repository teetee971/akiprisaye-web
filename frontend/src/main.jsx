import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import OcrPage from "./pages/OcrPage";

const container = document.getElementById("root");

if (container) {
  try {
    const root = createRoot(container);

    root.render(
      <React.StrictMode>
        <HashRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/ocr" element={<OcrPage />} />
          </Routes>
        </HashRouter>
      </React.StrictMode>
    );

    console.info("[React] App montée avec succès (Router actif)");
  } catch (err) {
    console.error("[React] Erreur au montage", err);
    // le fallback HTML statique reste visible
  }
}