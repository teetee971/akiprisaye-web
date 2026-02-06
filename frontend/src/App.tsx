import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import OcrScanner from "./components/OcrScanner";

const Home: React.FC = () => (
  <main style={{ padding: 24, color: "#f1f5f9" }}>
    <h1>A KI PRI SA YÉ</h1>
    <p>Plateforme citoyenne de transparence des prix.</p>

    <a
      href="#/ocr"
      style={{
        display: "inline-block",
        marginTop: 16,
        padding: "10px 16px",
        background: "#22c55e",
        color: "#022c22",
        borderRadius: 8,
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      Accéder à l’OCR
    </a>
  </main>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ocr" element={<OcrScanner />} />
      </Routes>
    </HashRouter>
  );
};

export default App;