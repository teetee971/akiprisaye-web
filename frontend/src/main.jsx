import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/Home";
import CarteInteractive from "./pages/Carte";
import DashboardAnalytics from "./pages/Dashboard";
import OcrScanner from "./pages/OcrPage";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[AKIPRISAYE] Erreur: élément racine introuvable");
} else {
  const reactRoot = createRoot(rootElement);

  const AppRouterConfig = () => (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/carte" element={<CarteInteractive />} />
        <Route path="/dashboard" element={<DashboardAnalytics />} />
        <Route path="/ocr" element={<OcrScanner />} />
        <Route path="*" element={<Navigate to="/carte" replace />} />
      </Routes>
    </HashRouter>
  );

  try {
    reactRoot.render(
      <React.StrictMode>
        <AppRouterConfig />
      </React.StrictMode>
    );
    console.info("[AKIPRISAYE] Application démarrée avec HashRouter");
  } catch (mountError) {
    console.error("[AKIPRISAYE] Échec du montage:", mountError);
  }
}
