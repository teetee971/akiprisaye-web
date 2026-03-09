import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroImage } from '../ui/HeroImage';

// Real Unsplash photo: supermarket grocery scene (free to use)
const HERO_IMG = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fm=webp&fit=crop&w=1600&q=80';

export default function HeroSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      return;
    }
    navigate('/search');
  };

  return (
    <section className="space-y-4">
      <HeroImage
        src={HERO_IMG}
        alt="Marché local — fruits et légumes frais"
        gradient="from-emerald-950 to-slate-900"
        height="h-72 sm:h-96"
      >
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
          Comparez les prix réels près de chez vous.
        </h1>
        <p className="text-base md:text-lg text-slate-200 drop-shadow">Données locales DOM-TOM &amp; France. Gratuit.</p>
      </HeroImage>

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex : riz 5kg, lait, eau..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Rechercher un produit"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Rechercher
        </button>
      </form>

      <button
        type="button"
        onClick={() => navigate('/scanner?mode=ticket')}
        className="text-sm text-slate-200 underline underline-offset-2 hover:text-white"
      >
        Scanner un ticket
      </button>

      <p className="text-xs text-slate-400">Sans compte. Vos recherches restent sur votre appareil.</p>
    </section>
  );
}
