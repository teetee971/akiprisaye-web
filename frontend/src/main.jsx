import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import './styles/glass.css';
import './styles/mobile-fixes.css';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PerformanceMonitor } from './components/PerformanceMonitor';

// Import real pages
import Home from './pages/Home';
import Carte from './pages/Carte';
import AdminDashboard from './pages/AdminDashboard';
import Comparateur from './pages/Comparateur';
import Observatoire from './pages/Observatoire';
import Methodologie from './pages/Methodologie';
import Faq from './pages/Faq';
import Contact from './pages/Contact';
import MentionsLegales from './pages/MentionsLegales';

/**
 * Root application render with HashRouter for Cloudflare Pages SPA
 * ErrorBoundary is intentionally placed at the highest level
 * to avoid any blank screen in production.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Root element #root not found');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <HashRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse text-lg">
                      Chargement…
                    </div>
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/carte" replace />} />
                    <Route path="carte" element={<Carte />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="home" element={<Home />} />
                    <Route path="comparateur" element={<Comparateur />} />
                    <Route path="observatoire" element={<Observatoire />} />
                    <Route path="methodologie" element={<Methodologie />} />
                    <Route path="faq" element={<Faq />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="mentions-legales" element={<MentionsLegales />} />
                    <Route path="*" element={<Navigate to="/carte" replace />} />
                  </Route>
                </Routes>
                <PerformanceMonitor />
              </Suspense>
            </HashRouter>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
