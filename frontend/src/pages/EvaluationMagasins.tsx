/**
 * EvaluationMagasins — Notation des magasins par les utilisateurs
 * Route : /evaluation-magasins
 * Module 29 — Évaluation des magasins par les utilisateurs
 */

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Flag, Star, MapPin, ThumbsUp, ShoppingBag, Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import {
  getUserRatings,
  saveUserRating,
  avgRatingFrom,
  type UserStoreRating,
} from '../services/storeRatingsService';
import {
  type StoreRating,
  EXAMPLE_RATINGS,
  ALL_SECTORS,
  ALL_TERRITORIES,
  SECTOR_META,
} from '../data/evaluationMagasinsData';


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

// ── Composant ─────────────────────────────────────────────────────────────────

export default function EvaluationMagasins() {
  const [showForm, setShowForm] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedSector, setSelectedSector] = useState('Tous');
  const [selectedTerritory, setSelectedTerritory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRatings, setUserRatings] = useState<UserStoreRating[]>([]);
  const [reportedStores, setReportedStores] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    storeName: '',
    territory: 'Guadeloupe',
    sector: 'Alimentaire',
    service: 0,
    proprete: 0,
    disponibilite: 0,
    comment: '',
  });

  // Load user ratings from localStorage on mount
  useEffect(() => {
    setUserRatings(getUserRatings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = SECTOR_META[form.sector] ?? { emoji: '🏪', color: 'bg-gray-100 text-gray-700' };
    saveUserRating({
      storeName: form.storeName,
      territory: form.territory,
      sector: form.sector,
      sectorEmoji: meta.emoji,
      sectorColor: meta.color,
      ratings: { service: form.service, proprete: form.proprete, disponibilite: form.disponibilite },
      comment: form.comment,
    });
    setUserRatings(getUserRatings());
    setRatingSubmitted(true);
    setShowForm(false);
    setForm({ storeName: '', territory: 'Guadeloupe', sector: 'Alimentaire', service: 0, proprete: 0, disponibilite: 0, comment: '' });
  };

  const handleReport = (storeId: string) => {
    setReportedStores((prev) => new Set([...prev, storeId]));
  };

  const filteredBase = EXAMPLE_RATINGS.filter((s) => {
    if (selectedSector !== 'Tous' && s.sector !== selectedSector) return false;
    if (selectedTerritory !== 'Tous' && s.territory !== selectedTerritory) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !s.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredUser = userRatings.filter((s) => {
    if (selectedSector !== 'Tous' && s.sector !== selectedSector) return false;
    if (selectedTerritory !== 'Tous' && s.territory !== selectedTerritory) return false;
    if (searchQuery && !s.storeName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalVisible = filteredUser.length + filteredBase.length;

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

      <div className="min-h-screen bg-amber-50/40">
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

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setShowForm(!showForm); setRatingSubmitted(false); }}
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
              className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Form header image */}
              <div className="relative h-24 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fm=webp&fit=crop&w=800&q=80"
                  alt="Évaluer un magasin"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/70 to-orange-800/50 flex items-center px-5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-300" />
                    <h3 className="font-bold text-white text-lg">Évaluer un magasin</h3>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="eval-nom-magasin" className="block text-sm font-medium text-amber-900 mb-1">
                      Nom du magasin
                    </label>
                  <input
                      id="eval-nom-magasin"
                      type="text"
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    placeholder="Ex: Carrefour Jarry"
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="eval-territoire" className="block text-sm font-medium text-amber-900 mb-1">
                      Territoire
                    </label>
                    <select
                      id="eval-territoire"
                      value={form.territory}
                      onChange={(e) => setForm({ ...form, territory: e.target.value })}
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    >
                      {ALL_TERRITORIES.filter((t) => t !== 'Tous').map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="eval-secteur" className="block text-sm font-medium text-amber-900 mb-1">
                      Secteur
                    </label>
                    <select
                      id="eval-secteur"
                      value={form.sector}
                      onChange={(e) => setForm({ ...form, sector: e.target.value })}
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80"
                    >
                      {ALL_SECTORS.filter((s) => s !== 'Tous').sort().map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(['service', 'proprete', 'disponibilite'] as const).map((criterion) => (
                  <div key={criterion}>
                    <span className="block text-sm font-medium text-amber-900 mb-1">
                      {criterion === 'proprete' ? 'Propreté' : criterion === 'disponibilite' ? 'Disponibilité produits' : 'Qualité de service'}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm({ ...form, [criterion]: star })}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 ${star <= form[criterion] ? 'text-amber-500 fill-amber-500' : 'text-amber-200 fill-amber-100'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label htmlFor="eval-commentaire" className="block text-sm font-medium text-amber-900 mb-1">
                      Commentaire (optionnel)
                    </label>
                  <textarea
                      id="eval-commentaire"
                      value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    placeholder="Décrivez votre expérience..."
                    rows={3}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white/80"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!form.storeName || form.service === 0}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Envoyer l'évaluation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 border border-amber-300 text-amber-700 rounded-xl text-sm hover:bg-amber-100 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Annuaire des évaluations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <h2 className="font-bold text-gray-900">
                  Évaluations citoyennes{' '}
                  <span className="text-gray-400 font-normal text-sm">({totalVisible})</span>
                </h2>
              </div>
              {(selectedSector !== 'Tous' || selectedTerritory !== 'Tous' || searchQuery) && (
                <button
                  onClick={() => { setSelectedSector('Tous'); setSelectedTerritory('Tous'); setSearchQuery(''); }}
                  className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900"
                >
                  <X className="w-3.5 h-3.5" /> Réinitialiser
                </button>
              )}
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un magasin, une adresse…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>

            {/* Filtre territoire */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Territoire</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {ALL_TERRITORIES.map((terr) => (
                  <button
                    key={terr}
                    onClick={() => setSelectedTerritory(terr)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedTerritory === terr
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {terr}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre secteur */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Secteur</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {ALL_SECTORS.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedSector === sector
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Avis utilisateur (localStorage) */}
            {filteredUser.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  📝 Vos avis ({filteredUser.length})
                </p>
                {filteredUser.map((u) => (
                  <div key={u.id} className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900 text-sm">{u.storeName}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.sectorColor}`}>
                          {u.sectorEmoji} {u.sector}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{u.territory} · {new Date(u.submittedAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Service</span>
                          <StarRating value={u.ratings.service} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Propreté</span>
                          <StarRating value={u.ratings.proprete} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Disponibilité</span>
                          <StarRating value={u.ratings.disponibilite} />
                        </div>
                      </div>
                      {u.comment && (
                        <p className="mt-2 text-xs text-gray-600 italic">"{u.comment}"</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-gray-700">{avgRatingFrom(u.ratings).toFixed(1)} / 5</span>
                        </div>
                        {reportedStores.has(`user-${u.storeName}`) ? (
                          <span className="text-xs text-gray-400 italic">✓ Signalé</span>
                        ) : (
                          <button
                            onClick={() => handleReport(`user-${u.storeName}`)}
                            aria-label={`Signaler l'avis pour ${u.storeName}`}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Flag className="w-3 h-3" />
                            Signaler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cartes annuaire de base */}
            {filteredBase.length > 0 && (
              <div className="space-y-3">
                {filteredUser.length > 0 && (
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    🏪 Annuaire ({filteredBase.length})
                  </p>
                )}
                {filteredBase.map((store) => (
                  <div key={store.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {/* Banner image */}
                    <div className="relative h-32">
                      <img
                        src={store.storeImage}
                        alt={store.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                      <span className={`absolute top-2.5 right-3 text-xs font-semibold px-2 py-0.5 rounded-full ${store.sectorColor}`}>
                        {store.sectorEmoji} {store.sector}
                      </span>
                      <p className="absolute bottom-2.5 left-3 font-bold text-white text-sm drop-shadow-md">
                        {store.name}
                      </p>
                      <div className="absolute bottom-2.5 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-white font-bold text-sm">{avgRatingFrom(store.ratings).toFixed(1)}</span>
                        <span className="text-white/70 text-xs">({store.totalReviews})</span>
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{store.address} · {store.territory}</span>
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
                      {/* Modération */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                        {reportedStores.has(store.id) ? (
                          <span className="text-xs text-gray-400 italic">✓ Signalement transmis</span>
                        ) : (
                          <button
                            onClick={() => handleReport(store.id)}
                            aria-label={`Signaler l'avis pour ${store.name}`}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            Signaler cet avis
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalVisible === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun magasin trouvé pour ces filtres.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
