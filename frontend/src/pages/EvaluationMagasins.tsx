/**
 * EvaluationMagasins — Notation des magasins par les utilisateurs
 * Route : /evaluation-magasins
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Star, MapPin, ThumbsUp, ShoppingBag, Search, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

// ── Données exemple ───────────────────────────────────────────────────────────

interface StoreRating {
  id: string;
  name: string;
  territory: string;
  address: string;
  ratings: { service: number; proprete: number; disponibilite: number };
  totalReviews: number;
  lastReview: string;
}

const EXAMPLE_RATINGS: StoreRating[] = [
  {
    id: '1',
    name: 'Carrefour Désirade',
    territory: 'Guadeloupe',
    address: 'ZAC de Jarry, Baie-Mahault',
    ratings: { service: 3.8, proprete: 4.1, disponibilite: 4.3 },
    totalReviews: 142,
    lastReview: '2024-12-10',
  },
  {
    id: '2',
    name: 'Champion Lamentin',
    territory: 'Martinique',
    address: 'Centre Commercial Galeria, Le Lamentin',
    ratings: { service: 4.0, proprete: 3.9, disponibilite: 3.7 },
    totalReviews: 89,
    lastReview: '2024-12-08',
  },
  {
    id: '3',
    name: 'Leader Price Saint-Denis',
    territory: 'La Réunion',
    address: 'Rue du Maréchal Leclerc, Saint-Denis',
    ratings: { service: 3.5, proprete: 3.8, disponibilite: 4.0 },
    totalReviews: 61,
    lastReview: '2024-12-05',
  },
];

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-600 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function avgRating(r: StoreRating['ratings']): number {
  return Math.round(((r.service + r.proprete + r.disponibilite) / 3) * 10) / 10;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function EvaluationMagasins() {
  const [showForm, setShowForm] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [form, setForm] = useState({ storeName: '', service: 0, proprete: 0, disponibilite: 0, comment: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRatingSubmitted(true);
    setShowForm(false);
  };

  return (
    <>
      <Helmet>
        <title>Évaluation des magasins — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Notez la qualité de service, la propreté et la disponibilité des produits dans votre magasin — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/evaluation-magasins" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.evaluationMagasins}
            alt="Évaluation des magasins par les citoyens"
            gradient="from-slate-950 to-amber-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-amber-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                Évaluations citoyennes
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              ⭐ Évaluation des magasins
            </h1>
            <p className="text-amber-100 text-sm mt-1 drop-shadow">
              Service, propreté, disponibilité : notez les magasins de votre territoire
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-20 space-y-6">

          {/* Avertissement bêta */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Fonctionnalité en développement (V3). Les avis présentés sont des exemples.
              La persistance et la modération des avis réels seront disponibles prochainement.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <Star className="w-4 h-4" />
              Évaluer un magasin
            </button>
            <Link
              to="/carte"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Trouver un magasin sur la carte
            </Link>
          </div>

          {/* Succès */}
          {ratingSubmitted && (
            <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
              <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Merci pour votre évaluation ! Elle sera examinée et publiée après modération.
              </p>
            </div>
          )}

          {/* Formulaire d'évaluation */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-semibold text-gray-900">Évaluer un magasin</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du magasin
                </label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  placeholder="Ex: Carrefour Jarry"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {(['service', 'proprete', 'disponibilite'] as const).map((criterion) => (
                <div key={criterion}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {criterion === 'proprete' ? 'Propreté' : criterion === 'disponibilite' ? 'Disponibilité produits' : 'Qualité de service'}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, [criterion]: star })}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${star <= form[criterion] ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-100'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="Décrivez votre expérience..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Envoyer l'évaluation
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* Exemples d'évaluations */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900">Évaluations récentes (exemples)</h2>
            {EXAMPLE_RATINGS.map((store) => (
              <div key={store.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600" />
                      <p className="font-semibold text-gray-900">{store.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {store.address} · {store.territory}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600">{avgRating(store.ratings).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{store.totalReviews} avis</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Service</span>
                    <StarRating value={store.ratings.service} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Propreté</span>
                    <StarRating value={store.ratings.proprete} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Disponibilité</span>
                    <StarRating value={store.ratings.disponibilite} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
