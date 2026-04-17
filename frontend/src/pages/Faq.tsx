import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { HeroImage } from '@/components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '@/config/imageAssets';
import { FAQ_DATA, getFAQByCategory, searchFAQ, type FAQItem } from '@/data/faq';
import { Link } from 'react-router-dom';

const FAQ_CATEGORIES = [
  { id: 'all', label: 'Toutes', icon: '📋' },
  { id: 'general', label: 'Général', icon: '❓' },
  { id: 'abonnements', label: 'Abonnements', icon: '💳' },
  { id: 'donnees', label: 'Données', icon: '📊' },
  { id: 'technique', label: 'Technique', icon: '⚙️' },
  { id: 'institutionnel', label: 'Institutionnel', icon: '🏛️' },
] as const;

export default function Faq() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFAQ, setExpandedFAQ] = useState<Set<string>>(new Set());

  // Filter FAQ based on category and search
  const filteredFAQ = (): FAQItem[] => {
    let items = FAQ_DATA;

    // Filter by category
    if (selectedCategory !== 'all') {
      items = getFAQByCategory(selectedCategory as FAQItem['category']);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      items = searchFAQ(searchQuery);
    }

    return items;
  };

  const toggleFAQ = (id: string) => {
    const newExpanded = new Set(expandedFAQ);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFAQ(newExpanded);
  };

  const displayedFAQ = filteredFAQ();

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <Helmet>
        <title>FAQ – A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Questions fréquentes sur A KI PRI SA YÉ : transparence des prix, données, abonnements, technique et conformité institutionnelle."
        />
        <meta property="og:title" content="FAQ – A KI PRI SA YÉ" />
        <meta
          property="og:description"
          content="Tout ce que vous devez savoir sur A KI PRI SA YÉ, l'application citoyenne de transparence des prix Outre-mer."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/faq" />
        <link rel="alternate" hrefLang="fr" href="https://teetee971.github.io/akiprisaye-web/faq" />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/faq"
        />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 pb-4 animate-fade-in">
        <HeroImage
          src={PAGE_HERO_IMAGES.faq}
          alt="FAQ — questions et réponses"
          gradient="from-slate-900 to-blue-950"
          height="h-36 sm:h-48"
        >
          <h1 className="text-3xl font-bold text-white drop-shadow">Questions Fréquentes (FAQ)</h1>
          <p className="text-slate-300 text-sm drop-shadow">
            Tout ce que vous devez savoir sur A KI PRI SA YÉ — du public aux institutions
          </p>
        </HeroImage>
      </div>
      <GlassContainer className="max-w-6xl mx-auto p-8">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher dans la FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {FAQ_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/50 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {displayedFAQ.length === 0 ? (
            <GlassCard className="text-center py-12">
              <p className="text-gray-400">Aucune question ne correspond à votre recherche.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </GlassCard>
          ) : (
            displayedFAQ.map((item) => {
              const isExpanded = expandedFAQ.has(item.id);

              return (
                <GlassCard
                  key={item.id}
                  className="cursor-pointer hover:border-blue-500/50 transition-all"
                  onClick={() => toggleFAQ(item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{item.question}</h3>

                      {isExpanded && (
                        <div className="mt-3">
                          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                            {item.answer}
                          </p>

                          {/* Tags */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-slate-700/50 text-gray-400 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <span
                        className={`text-2xl transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <GlassCard className="bg-blue-900/20 border-blue-500/30">
            <h3 className="text-xl font-semibold text-white mb-3">
              Vous ne trouvez pas de réponse ?
            </h3>
            <p className="text-gray-300 mb-4">
              Essayez notre assistant intelligent ou contactez-nous directement.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="#assistant"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
              >
                💬 Poser une question à l'assistant
              </a>
              <Link
                to="/contact"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                📧 Nous contacter
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Statistics */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            {displayedFAQ.length} question{displayedFAQ.length > 1 ? 's' : ''} affichée
            {displayedFAQ.length > 1 ? 's' : ''}
            {' • '}
            {FAQ_DATA.length} questions au total
          </p>
        </div>
      </GlassContainer>
    </div>
  );
}
