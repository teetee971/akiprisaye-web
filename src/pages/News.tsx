/**
 * News Page - Civic Glass Design System
 * Displays news items with proper source attribution
 */
import React, { useState, useEffect } from 'react';
import { CivicNewsItem } from '../types/civic';
import { GlassCard } from '../components/ui/GlassCard';
import { CivicBadge } from '../components/ui/CivicBadge';
import { SourceFooter } from '../components/ui/SourceFooter';
import { fetchNews } from '../lib/api';

export function News({ items }: { items?: CivicNewsItem[] }) {
  const [newsItems, setNewsItems] = useState<CivicNewsItem[]>(items || []);
  const [loading, setLoading] = useState(!items);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!items) {
      fetchNews()
        .then(setNewsItems)
        .catch((err) => {
          console.error('Failed to fetch news:', err);
          setError('Impossible de charger les actualités');
        })
        .finally(() => setLoading(false));
    }
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8 flex items-center justify-center">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">📰 Actualités</h1>
        <div className="space-y-4">
          {newsItems.map(item => (
            <GlassCard key={item.id}>
              <CivicBadge label={item.category} />
              <h3 className="text-lg font-semibold mt-2 text-white">{item.title}</h3>
              <p className="text-sm text-gray-300 mt-2">{item.summary}</p>
              <div className="text-xs text-gray-400 mt-2">
                {item.territory} • {new Date(item.publishedAt).toLocaleDateString('fr-FR')}
              </div>
              <SourceFooter source={item.source} />
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export default News;
