import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

import './styles/glass.css';
import './styles/mobile-fixes.css';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PerformanceMonitor } from './components/PerformanceMonitor';

/**
 * Root application render
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
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="animate-pulse text-lg">
                    Chargement…
                  </div>
                </div>
              }
            >
              <Layout />
              <PerformanceMonitor />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
