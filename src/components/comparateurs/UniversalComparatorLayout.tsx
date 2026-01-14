/**
 * Universal Comparator Layout
 * 
 * Standardized layout component for all citizen comparators.
 * Provides a consistent structure with header, filters, results, and footer.
 * 
 * Features:
 * - Responsive design (mobile-first)
 * - Dark mode compatible
 * - Customizable sections
 * - Metadata display
 */

import React from 'react';
import type { ComparatorMetadata } from '../../types/comparatorCommon';

export interface UniversalComparatorLayoutProps {
  /** Title of the comparator */
  title: string;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Description/subtitle */
  description: string;
  /** Optional filters section */
  filters?: React.ReactNode;
  /** Results/content section */
  results?: React.ReactNode;
  /** Metadata about the comparator */
  metadata?: ComparatorMetadata;
  /** Optional additional content */
  children?: React.ReactNode;
  /** Optional custom header content */
  headerExtra?: React.ReactNode;
}

/**
 * Universal Comparator Layout Component
 */
export const UniversalComparatorLayout: React.FC<UniversalComparatorLayoutProps> = ({
  title,
  icon,
  description,
  filters,
  results,
  metadata,
  children,
  headerExtra,
}) => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-blue-400">{icon}</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
              {title}
            </h1>
          </div>
          
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            {description}
          </p>

          {metadata && (
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>
                📊 {metadata.totalEntries} entrée{metadata.totalEntries > 1 ? 's' : ''}
              </span>
              {metadata.lastUpdate && (
                <span>
                  🕒 Mis à jour : {new Date(metadata.lastUpdate).toLocaleDateString('fr-FR')}
                </span>
              )}
              {metadata.coverage && (
                <span>
                  🗺️ Couverture : {metadata.coverage.territories.length} territoire{metadata.coverage.territories.length > 1 ? 's' : ''} ({metadata.coverage.percentage}%)
                </span>
              )}
            </div>
          )}

          {headerExtra && (
            <div className="mt-4">
              {headerExtra}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Filters Section */}
          {filters && (
            <section 
              className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5"
              aria-label="Filtres"
            >
              {filters}
            </section>
          )}

          {/* Results Section */}
          {results && (
            <section 
              className="space-y-6"
              aria-label="Résultats"
            >
              {results}
            </section>
          )}

          {/* Additional Content */}
          {children}
        </div>
      </main>

      {/* Footer - Metadata & Methodology */}
      {metadata && (
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-400 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-300 mb-1">
                  Méthodologie & Sources
                </h3>
                
                {metadata.methodology && (
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">
                    {metadata.methodology}
                  </p>
                )}

                {metadata.dataSource && (
                  <p className="text-xs text-gray-400">
                    <span className="font-medium">Source des données :</span> {metadata.dataSource}
                  </p>
                )}

                {metadata.disclaimer && (
                  <p className="text-xs text-gray-400 mt-2">
                    {metadata.disclaimer}
                  </p>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default UniversalComparatorLayout;
