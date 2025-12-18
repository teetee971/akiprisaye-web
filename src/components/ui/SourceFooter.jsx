// src/components/ui/SourceFooter.jsx
import React from 'react';
import { DataBadge } from './DataBadge';
import { LimitNote } from './LimitNote';

/**
 * SourceFooter - Mandatory component for data transparency
 * Must be included at the bottom of every page displaying data
 * 
 * @param {Object} props
 * @param {Array<{source: string, date: string, territory?: string, url?: string}>} props.sources - Array of data sources
 * @param {string} props.limitation - Optional limitation note
 * @param {string} props.methodology - Optional methodology description
 */
export function SourceFooter({ sources = [], limitation, methodology }) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <footer className="mt-12 pt-8 border-t border-[color:var(--glass-border)]">
      <div className="glass px-6 py-4 rounded-xl">
        <h3 className="text-sm font-semibold text-[color:var(--text-main)] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sources des données
        </h3>
        
        <div className="space-y-2 mb-4">
          {sources.map((src, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-[color:var(--accent-primary)] text-xs font-mono">
                [{index + 1}]
              </span>
              <div className="flex-1">
                <DataBadge 
                  source={src.source}
                  date={src.date}
                  territory={src.territory}
                />
                {src.url && (
                  <a 
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[color:var(--accent-primary)] hover:underline mt-1 inline-block"
                  >
                    Consulter la source →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {limitation && (
          <div className="mb-4">
            <LimitNote>{limitation}</LimitNote>
          </div>
        )}

        {methodology && (
          <details className="mt-3">
            <summary className="text-xs text-[color:var(--text-muted)] cursor-pointer hover:text-[color:var(--text-main)] transition-colors">
              📋 Méthodologie détaillée
            </summary>
            <div className="mt-2 text-xs text-[color:var(--text-subtle)] leading-relaxed pl-4 border-l-2 border-[color:var(--glass-border)]">
              {methodology}
            </div>
          </details>
        )}

        <div className="mt-4 pt-4 border-t border-[color:var(--glass-border)]">
          <p className="text-xs text-[color:var(--text-muted)]">
            <strong className="text-[color:var(--text-main)]">A KI PRI SA YÉ</strong> utilise exclusivement des données publiques officielles.{' '}
            <a 
              href="/methodologie" 
              className="text-[color:var(--accent-primary)] hover:underline"
            >
              En savoir plus sur nos sources
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SourceFooter;
