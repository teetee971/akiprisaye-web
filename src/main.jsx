import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Comparateur from './pages/Comparateur';
import Carte from './pages/Carte';
import Scanner from './pages/Scanner';

const App = () => (
  <BrowserRouter>
    <nav style={{ padding: "1rem", background: "#222", color: "#fff" }}>
      <Link to="/" style={{ margin: "1rem", color: "#fff" }}>Accueil</Link>
      <Link to="/comparateur" style={{ margin: "1rem", color: "#fff" }}>Comparateur</Link>
      <Link to="/carte" style={{ margin: "1rem", color: "#fff" }}>Carte</Link>
      <Link to="/scanner" style={{ margin: "1rem", color: "#fff" }}>Scanner</Link>
    </nav>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/comparateur" element={<Comparateur />} />
      <Route path="/carte" element={<Carte />} />
      <Route path="/scanner" element={<Scanner />} />
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
