/**
 * AdminDashboard — Admin Ti-Panié Solidaire
 * Route : /admin/dashboard
 * Module 13 — Administration & back-office
 */

import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  getAllBaskets,
  addBasket,
  updateBasket,
  deleteBasket,
  checkIsAdmin,
  type PanieBasket,
} from '../services/adminPanieService';

// ── Types locaux ──────────────────────────────────────────────────────────────

interface BasketFormData {
  title: string;
  store: string;
  territory: string;
  lat: string;
  lon: string;
  pickupWindow: string;
  stock: number;
  price: number;
  estimatedValue: number;
  items: string;
  img: string;
}

interface MessageState {
  type: 'success' | 'error' | '';
  text: string;
}

const EMPTY_FORM: BasketFormData = {
  title: '',
  store: '',
  territory: 'Guadeloupe',
  lat: '',
  lon: '',
  pickupWindow: '',
  stock: 0,
  price: 0,
  estimatedValue: 0,
  items: '',
  img: '',
};

// ── Composant ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [baskets, setBaskets] = useState<PanieBasket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBasket, setEditingBasket] = useState<PanieBasket | null>(null);
  const [message, setMessage] = useState<MessageState>({ type: '', text: '' });
  const [formData, setFormData] = useState<BasketFormData>(EMPTY_FORM);

  const loadBaskets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBaskets();
      setBaskets(data);
    } catch (error) {
      console.error('Error loading baskets:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paniers' });
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminAndLoad = useCallback(async () => {
    if (!user) {
      navigate('/mon-compte');
      return;
    }

    const adminStatus = await checkIsAdmin(user);
    setIsAdmin(adminStatus);

    if (!adminStatus) {
      setMessage({ type: 'error', text: 'Accès refusé. Vous devez être administrateur.' });
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    await loadBaskets();
  }, [user, navigate, loadBaskets]);

  useEffect(() => {
    checkAdminAndLoad();
  }, [checkAdminAndLoad]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const basketData = {
        ...formData,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
        stock: Number(formData.stock),
        price: parseFloat(String(formData.price)),
        estimatedValue: parseFloat(String(formData.estimatedValue)),
        items: formData.items.split(',').map((item) => item.trim()),
      };

      if (editingBasket?.id) {
        await updateBasket(editingBasket.id, basketData);
        setMessage({ type: 'success', text: 'Panier mis à jour avec succès !' });
      } else {
        await addBasket(basketData);
        setMessage({ type: 'success', text: 'Panier ajouté avec succès !' });
      }

      resetForm();
      await loadBaskets();
    } catch (error) {
      console.error('Error saving basket:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde du panier' });
    }
  };

  const handleEdit = (basket: PanieBasket) => {
    setEditingBasket(basket);
    setFormData({
      title: String(basket.title ?? ''),
      store: String(basket.store ?? ''),
      territory: String(basket.territory ?? 'Guadeloupe'),
      lat: String((basket as Record<string, unknown>).lat ?? ''),
      lon: String((basket as Record<string, unknown>).lon ?? ''),
      pickupWindow: String((basket as Record<string, unknown>).pickupWindow ?? ''),
      stock: Number(basket.stock ?? 0),
      price: Number(basket.price ?? 0),
      estimatedValue: Number((basket as Record<string, unknown>).estimatedValue ?? 0),
      items: Array.isArray((basket as Record<string, unknown>).items)
        ? ((basket as Record<string, unknown>).items as string[]).join(', ')
        : '',
      img: String((basket as Record<string, unknown>).img ?? ''),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce panier ?')) return;

    try {
      await deleteBasket(id);
      setMessage({ type: 'success', text: 'Panier supprimé avec succès !' });
      await loadBaskets();
    } catch (error) {
      console.error('Error deleting basket:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du panier' });
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingBasket(null);
    setShowForm(false);
  };

  if (!isAdmin) return null;

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <>
      <Helmet>
        <title>Admin Ti-Panié Solidaire — A KI PRI SA YÉ</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto py-8 px-4">
          {/* En-tête */}
          <header className="mb-8 flex items-center gap-3">
            <ShieldCheck className="w-9 h-9 text-blue-400 flex-shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-blue-400">
                Admin — Ti-Panié Solidaire
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Gérez les paniers solidaires en temps réel
              </p>
            </div>
          </header>

          {/* Message */}
          {message.text && (
            <div
              role="status"
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-900/30 border border-green-700 text-green-400'
                  : 'bg-red-900/30 border border-red-700 text-red-400'
              }`}
            >
              {message.text}
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="ml-4 text-sm underline"
                aria-label="Fermer le message"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <PlusCircle className="w-4 h-4" />
              {showForm ? 'Annuler' : 'Ajouter un panier'}
            </button>
          </div>

          {/* Formulaire */}
          {showForm && (
            <section
              aria-label={editingBasket ? 'Modifier le panier' : 'Nouveau panier'}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8"
            >
              <h2 className="text-xl font-semibold mb-4 text-blue-400">
                {editingBasket ? 'Modifier le panier' : 'Nouveau panier'}
              </h2>
              <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-titre" className="block text-sm font-medium mb-2 text-slate-300">
                    Titre *
                  </label>
                  <input id="admin-titre" type="text" required className={inputClass}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-magasin" className="block text-sm font-medium mb-2 text-slate-300">
                    Magasin *
                  </label>
                  <input id="admin-magasin" type="text" required className={inputClass}
                    value={formData.store}
                    onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-territoire" className="block text-sm font-medium mb-2 text-slate-300">
                    Territoire *
                  </label>
                  <select id="admin-territoire" required className={inputClass}
                    value={formData.territory}
                    onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  >
                    <option value="Guadeloupe">Guadeloupe</option>
                    <option value="Martinique">Martinique</option>
                    <option value="Guyane">Guyane</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-creneau" className="block text-sm font-medium mb-2 text-slate-300">
                    Créneau de retrait *
                  </label>
                  <input id="admin-creneau" type="text" required placeholder="17:00–19:00" className={inputClass}
                    value={formData.pickupWindow}
                    onChange={(e) => setFormData({ ...formData, pickupWindow: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-latitude" className="block text-sm font-medium mb-2 text-slate-300">
                    Latitude *
                  </label>
                  <input id="admin-latitude" type="number" step="any" required className={inputClass}
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-longitude" className="block text-sm font-medium mb-2 text-slate-300">
                    Longitude *
                  </label>
                  <input id="admin-longitude" type="number" step="any" required className={inputClass}
                    value={formData.lon}
                    onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-stock" className="block text-sm font-medium mb-2 text-slate-300">
                    Stock *
                  </label>
                  <input id="admin-stock" type="number" required min="0" className={inputClass}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-prix" className="block text-sm font-medium mb-2 text-slate-300">
                    Prix (€) *
                  </label>
                  <input id="admin-prix" type="number" step="0.01" required min="0" className={inputClass}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-valeur-estimee" className="block text-sm font-medium mb-2 text-slate-300">
                    Valeur estimée (€) *
                  </label>
                  <input id="admin-valeur-estimee" type="number" step="0.01" required min="0" className={inputClass}
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label htmlFor="admin-image-url" className="block text-sm font-medium mb-2 text-slate-300">
                    Image URL
                  </label>
                  <input id="admin-image-url" type="text" placeholder="/img/panie-fruits.jpg" className={inputClass}
                    value={formData.img}
                    onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="admin-articles" className="block text-sm font-medium mb-2 text-slate-300">
                    Articles (séparés par des virgules)
                  </label>
                  <input id="admin-articles" type="text" placeholder="Bananes, Tomates, Salade" className={inputClass}
                    value={formData.items}
                    onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <button type="submit"
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                  >
                    {editingBasket ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Liste paniers */}
          {loading ? (
            <div className="text-center py-12" role="status" aria-label="Chargement en cours">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
              <p className="text-slate-400">Chargement des paniers...</p>
            </div>
          ) : (
            <section aria-label="Liste des paniers solidaires" className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      {['Titre', 'Magasin', 'Territoire', 'Stock', 'Prix', 'Actions'].map((h) => (
                        <th key={h} scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold text-slate-300"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {baskets.map((basket) => (
                      <tr key={String(basket.id)} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-slate-200">{String(basket.title ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{String(basket.store ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{String(basket.territory ?? '')}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              (basket.stock ?? 0) > 0
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-red-900/30 text-red-400'
                            }`}
                          >
                            {String(basket.stock ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {((basket.price ?? 0) as number).toFixed(2)}€
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(basket)}
                              aria-label={`Modifier ${String(basket.title ?? '')}`}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
                            >
                              <Pencil className="w-3 h-3" />
                              Modifier
                            </button>
                            <button
                              onClick={() => basket.id && handleDelete(String(basket.id))}
                              aria-label={`Supprimer ${String(basket.title ?? '')}`}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {baskets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-400">Aucun panier en base de données</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
