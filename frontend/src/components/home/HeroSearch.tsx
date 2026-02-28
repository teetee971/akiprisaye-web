import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <section className="min-h-[calc(100vh-5rem)] flex items-center py-10">
      <div className="w-full space-y-4">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          Comparez les prix réels près de chez vous.
        </h1>
        <p className="text-base md:text-lg text-slate-300">Données locales DOM-TOM. Gratuit.</p>

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
      </div>
    </section>
  );
}
