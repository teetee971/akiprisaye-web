/**
 * CommerceSocial — Partagez vos listes, recommandations et profil contributeur
 * Route : /commerce-social
 * Module 26 — Commerce social
 */

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Share2, Star, Users, PlusCircle, Trash2, Copy, User, Edit3, X, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { TERRITORIES } from '../constants/territories';
import type { TerritoryCode } from '../constants/territories';

// ── Types ────────────────────────────────────────────────────────────────────

interface SharedList {
  id: string;
  name: string;
  items: string[];
  createdAt: string;
}

interface Recommendation {
  id: string;
  product: string;
  store: string;
  price: string;
  territory: TerritoryCode;
  comment: string;
  createdAt: string;
}

interface ContributorProfile {
  username: string;
  territory: TerritoryCode;
}

// ── Local storage helpers ────────────────────────────────────────────────────

function loadLists(): SharedList[] {
  try {
    return JSON.parse(localStorage.getItem('akiprisaye_shared_lists') ?? '[]');
  } catch {
    return [];
  }
}

function saveLists(lists: SharedList[]) {
  localStorage.setItem('akiprisaye_shared_lists', JSON.stringify(lists));
}

function loadRecommendations(): Recommendation[] {
  try {
    return JSON.parse(localStorage.getItem('akiprisaye_recommendations') ?? '[]');
  } catch {
    return [];
  }
}

function saveRecommendations(recs: Recommendation[]) {
  localStorage.setItem('akiprisaye_recommendations', JSON.stringify(recs));
}

function loadProfile(): ContributorProfile {
  try {
    const raw = localStorage.getItem('akiprisaye_profile');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { username: '', territory: 'gp' };
}

function saveProfile(profile: ContributorProfile) {
  localStorage.setItem('akiprisaye_profile', JSON.stringify(profile));
}

function countContributions(): number {
  const recs = loadRecommendations().length;
  try {
    const reports = JSON.parse(localStorage.getItem('akiprisaye_price_reports') ?? '[]').length;
    return recs + reports;
  } catch {
    return recs;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommerceSocial() {
  // Lists state
  const [lists, setLists] = useState<SharedList[]>(loadLists);
  const [newListName, setNewListName] = useState('');
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>(loadRecommendations);
  const [recForm, setRecForm] = useState({
    product: '',
    store: '',
    price: '',
    territory: 'gp' as TerritoryCode,
    comment: '',
  });

  // Profile state
  const [profile, setProfile] = useState<ContributorProfile>(loadProfile);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [draftProfile, setDraftProfile] = useState<ContributorProfile>(profile);

  const activeTerritories = Object.values(TERRITORIES).filter((t) => t.active);

  // ── Lists handlers ──────────────────────────────────────────────────────────

  function handleCreateList() {
    if (!newListName.trim()) return;
    const list: SharedList = {
      id: crypto.randomUUID(),
      name: newListName.trim(),
      items: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [list, ...lists];
    setLists(updated);
    saveLists(updated);
    setNewListName('');
    toast.success('Liste créée !');
  }

  function handleAddItem(listId: string) {
    const item = (newItem[listId] ?? '').trim();
    if (!item) return;
    const updated = lists.map((l) =>
      l.id === listId ? { ...l, items: [...l.items, item] } : l,
    );
    setLists(updated);
    saveLists(updated);
    setNewItem((prev) => ({ ...prev, [listId]: '' }));
  }

  function handleDeleteList(id: string) {
    const updated = lists.filter((l) => l.id !== id);
    setLists(updated);
    saveLists(updated);
  }

  async function handleShareList(list: SharedList) {
    const url = `${window.location.origin}/commerce-social?list=${list.id}&name=${encodeURIComponent(list.name)}&items=${encodeURIComponent(list.items.join(','))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: list.name, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papiers !');
  }

  // ── Recommendations handlers ────────────────────────────────────────────────

  function handleAddRec() {
    if (!recForm.product.trim() || !recForm.store.trim()) {
      toast.error('Produit et magasin obligatoires');
      return;
    }
    const rec: Recommendation = {
      id: crypto.randomUUID(),
      ...recForm,
      createdAt: new Date().toISOString(),
    };
    const updated = [rec, ...recommendations].slice(0, 10);
    setRecommendations(updated);
    saveRecommendations(updated);
    setRecForm({ product: '', store: '', price: '', territory: 'gp', comment: '' });
    toast.success('Recommandation ajoutée !');
  }

  function handleDeleteRec(id: string) {
    const updated = recommendations.filter((r) => r.id !== id);
    setRecommendations(updated);
    saveRecommendations(updated);
  }

  // ── Profile handlers ────────────────────────────────────────────────────────

  function handleSaveProfile() {
    setProfile(draftProfile);
    saveProfile(draftProfile);
    setShowProfileModal(false);
    toast.success('Profil mis à jour !');
  }

  const displayName = profile.username || 'Contributeur anonyme';
  const profileTerritory = activeTerritories.find((t) => t.code === profile.territory);

  return (
    <>
      <Helmet>
        <title>Commerce social — A KI PRI SA YÉ</title>
        <meta
          name='description'
          content='Partagez vos listes de courses et recommandations avec votre réseau — A KI PRI SA YÉ'
        />
        <link rel='canonical' href='https://teetee971.github.io/akiprisaye-web/commerce-social' />
      </Helmet>

      <div className='min-h-screen bg-gray-50'>
        <div className='px-4 pt-4 max-w-3xl mx-auto'>
          <HeroImage
            src={PAGE_HERO_IMAGES.commerceSocial}
            alt='Commerce social entre citoyens'
            gradient='from-slate-950 to-pink-900'
            height='h-40 sm:h-52'
          >
            <div className='flex items-center gap-2 mb-1'>
              <Share2 className='w-5 h-5 text-pink-300 drop-shadow' />
              <span className='text-xs font-semibold uppercase tracking-widest text-pink-300'>
                Commerce social
              </span>
            </div>
            <h1 className='text-2xl sm:text-3xl font-black text-white drop-shadow'>
              🤝 Commerce social
            </h1>
            <p className='text-pink-100 text-sm mt-1 drop-shadow'>
              Partagez listes, recommandations et bons plans avec votre réseau
            </p>
          </HeroImage>
        </div>

        <div className='max-w-3xl mx-auto px-4 py-6 pb-12 space-y-8'>

          {/* ── Profil contributeur ── */}
          <section className='bg-white border border-gray-200 rounded-xl p-5'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <User className='w-5 h-5 text-pink-600' />
                <h2 className='font-bold text-gray-900'>Profil public contributeur</h2>
              </div>
              <button
                onClick={() => { setDraftProfile(profile); setShowProfileModal(true); }}
                className='flex items-center gap-1.5 text-xs text-pink-600 hover:text-pink-800 font-medium border border-pink-200 rounded-lg px-3 py-1.5 hover:bg-pink-50 transition-colors'
              >
                <Edit3 className='w-3.5 h-3.5' />
                Configurer
              </button>
            </div>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-2xl'>
                {profileTerritory?.flag ?? '🌍'}
              </div>
              <div>
                <p className='font-semibold text-gray-900'>{displayName}</p>
                <p className='text-sm text-gray-500'>{profileTerritory?.name ?? 'Territoire inconnu'}</p>
              </div>
              <div className='ml-auto text-right'>
                <p className='text-2xl font-bold text-pink-600'>{countContributions()}</p>
                <p className='text-xs text-gray-500'>contributions</p>
              </div>
            </div>
          </section>

          {/* ── Partage de listes ── */}
          <section>
            <div className='flex items-center gap-2 mb-3'>
              <Share2 className='w-5 h-5 text-pink-600' />
              <h2 className='font-bold text-gray-900'>Partage de listes</h2>
            </div>

            <div className='flex gap-2 mb-4'>
              <input
                type='text'
                placeholder='Nom de la liste (ex: courses semaine)'
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent'
              />
              <button
                onClick={handleCreateList}
                className='flex items-center gap-1.5 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors'
              >
                <PlusCircle className='w-4 h-4' />
                Créer
              </button>
            </div>

            <div className='space-y-3'>
              {lists.length === 0 && (
                <p className='text-sm text-gray-400 text-center py-6 bg-white rounded-xl border border-dashed border-gray-200'>
                  Aucune liste pour l'instant. Créez votre première liste !
                </p>
              )}
              {lists.map((list) => (
                <div key={list.id} className='bg-white border border-gray-200 rounded-xl p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='font-semibold text-gray-900 text-sm'>{list.name}</p>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleShareList(list)}
                        className='flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800 font-medium px-2 py-1 rounded border border-pink-200 hover:bg-pink-50 transition-colors'
                      >
                        <Copy className='w-3 h-3' />
                        Partager
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className='p-1 text-gray-400 hover:text-red-500 transition-colors'
                        aria-label='Supprimer'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                  <ul className='space-y-1 mb-2'>
                    {list.items.map((item, i) => (
                      <li key={i} className='text-sm text-gray-600 flex items-center gap-2'>
                        <Check className='w-3 h-3 text-green-500 flex-shrink-0' />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className='flex gap-2 mt-2'>
                    <input
                      type='text'
                      placeholder='Ajouter un article…'
                      value={newItem[list.id] ?? ''}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, [list.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem(list.id)}
                      className='flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-pink-400'
                    />
                    <button
                      onClick={() => handleAddItem(list.id)}
                      className='text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors'
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Recommandations citoyens ── */}
          <section>
            <div className='flex items-center gap-2 mb-3'>
              <Star className='w-5 h-5 text-pink-600' />
              <h2 className='font-bold text-gray-900'>Recommandations citoyens</h2>
            </div>

            <div className='bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <input
                  type='text'
                  placeholder='Produit *'
                  value={recForm.product}
                  onChange={(e) => setRecForm((f) => ({ ...f, product: e.target.value }))}
                  className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                />
                <input
                  type='text'
                  placeholder='Magasin *'
                  value={recForm.store}
                  onChange={(e) => setRecForm((f) => ({ ...f, store: e.target.value }))}
                  className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                />
                <input
                  type='text'
                  placeholder='Prix (ex: 2,50 €)'
                  value={recForm.price}
                  onChange={(e) => setRecForm((f) => ({ ...f, price: e.target.value }))}
                  className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                />
                <select
                  value={recForm.territory}
                  onChange={(e) => setRecForm((f) => ({ ...f, territory: e.target.value as TerritoryCode }))}
                  className='border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent'
                >
                  {activeTerritories.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder='Commentaire (optionnel)'
                value={recForm.comment}
                onChange={(e) => setRecForm((f) => ({ ...f, comment: e.target.value }))}
                rows={2}
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none'
              />
              <button
                onClick={handleAddRec}
                className='w-full bg-pink-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors'
              >
                Publier la recommandation
              </button>
            </div>

            <div className='space-y-2'>
              {recommendations.length === 0 && (
                <p className='text-sm text-gray-400 text-center py-4'>
                  Aucune recommandation pour l'instant.
                </p>
              )}
              {recommendations.map((rec) => {
                const terr = activeTerritories.find((t) => t.code === rec.territory);
                return (
                  <div key={rec.id} className='bg-white border border-gray-200 rounded-xl p-4 flex gap-3'>
                    <div className='text-2xl'>{terr?.flag ?? '🌍'}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className='font-semibold text-gray-900 text-sm'>{rec.product}</p>
                        <button
                          onClick={() => handleDeleteRec(rec.id)}
                          className='p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0'
                          aria-label='Supprimer'
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                        </button>
                      </div>
                      <p className='text-xs text-gray-500 mt-0.5'>
                        {rec.store} · {terr?.name ?? rec.territory}
                        {rec.price && <span className='ml-2 text-pink-700 font-semibold'>{rec.price}</span>}
                      </p>
                      {rec.comment && <p className='text-xs text-gray-600 mt-1 italic'>{rec.comment}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>

      {/* ── Profile modal ── */}
      {showProfileModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='font-bold text-gray-900 flex items-center gap-2'>
                <Users className='w-5 h-5 text-pink-600' />
                Mon profil contributeur
              </h3>
              <button onClick={() => setShowProfileModal(false)} className='text-gray-400 hover:text-gray-600'>
                <X className='w-5 h-5' />
              </button>
            </div>
            <div className='space-y-3'>
              <div>
                <label htmlFor='profile-username' className='block text-xs font-medium text-gray-700 mb-1'>Pseudo</label>
                <input
                  id='profile-username'
                  type='text'
                  placeholder='Contributeur anonyme'
                  value={draftProfile.username}
                  onChange={(e) => setDraftProfile((p) => ({ ...p, username: e.target.value }))}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500'
                />
              </div>
              <div>
                <label htmlFor='profile-territory' className='block text-xs font-medium text-gray-700 mb-1'>Territoire</label>
                <select
                  id='profile-territory'
                  value={draftProfile.territory}
                  onChange={(e) => setDraftProfile((p) => ({ ...p, territory: e.target.value as TerritoryCode }))}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500'
                >
                  {activeTerritories.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.flag} {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveProfile}
                className='w-full bg-pink-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors mt-2'
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

