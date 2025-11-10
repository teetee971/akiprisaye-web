
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/glass.css';
import Home from './pages/Home';
import ChatIALocal from './components/ChatIALocal';
import ScanOCR from './pages/ScanOCR';
import Comparateur from './pages/Comparateur';
import Carte from './pages/Carte';
import Actualites from './pages/Actualites';
import MentionsLegales from './pages/MentionsLegales';
import MonCompte from './pages/MonCompte';
import Pricing from './pages/Pricing';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/chat' element={<ChatIALocal />} />
        <Route path='/scan' element={<ScanOCR />} />
        <Route path='/comparateur' element={<Comparateur />} />
        <Route path='/carte' element={<Carte />} />
        <Route path='/actualites' element={<Actualites />} />
        <Route path='/mentions-legales' element={<MentionsLegales />} />
        <Route path='/mon-compte' element={<MonCompte />} />
        <Route path='/pricing' element={<Pricing />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
