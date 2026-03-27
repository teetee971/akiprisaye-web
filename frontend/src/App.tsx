import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Chargement différé (Lazy Loading) pour la performance mobile
const EspaceCreateur = lazy(() => import('./pages/EspaceCreateur'));

// Page d'accueil temporaire ou composant Home
const Home = () => <div style={{color: 'white', padding: '20px'}}>Bienvenue sur A KI PRI SA YÉ</div>;

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{color: 'white', padding: '20px'}}>Chargement du Radar...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/espace-createur" element={<EspaceCreateur />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
