import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Flyer from './pages/Flyer';
import Connexion from './pages/Connexion';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/flyer" element={<Flyer />} />
            <Route path="/connexion" element={<Connexion />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
