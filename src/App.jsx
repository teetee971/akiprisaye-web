import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ModernNavbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import NotificationSystem from './components/NotificationSystem';
import HistoricalPriceComparison from './components/HistoricalPriceComparison';
import GamificationSystem from './components/GamificationSystem';
import AccessibilityPanel from './components/AccessibilityPanel';
import UserFeedbackSystem from './components/UserFeedbackSystem';
import GrandesSurfacesDOMTOM from './components/GrandesSurfacesDOMTOM';
import Carte from './pages/Carte';

export default function App() {
  return (
    <div className="min-h-screen">
      <ModernNavbar />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<Carte />} />
        <Route path="/stores" element={<GrandesSurfacesDOMTOM />} />
        <Route path="/notifications" element={<NotificationSystem />} />
        <Route path="/history" element={<HistoricalPriceComparison />} />
        <Route path="/gamification" element={<GamificationSystem />} />
        <Route path="/feedback" element={<UserFeedbackSystem />} />
      </Routes>

      {/* Accessibility Panel (always present) */}
      <AccessibilityPanel />
    </div>
  );
}

