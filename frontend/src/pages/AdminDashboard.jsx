import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getAllBaskets,
  addBasket,
  updateBasket,
  deleteBasket,
  checkIsAdmin,
} from '../services/adminPanieService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [baskets, setBaskets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBasket, setEditingBasket] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
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
  });

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

    loadBaskets();
  }, [user, navigate]);

  useEffect(() => {
    checkAdminAndLoad();
  }, [checkAdminAndLoad]);

  const loadBaskets = async () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const basketData = {
        ...formData,
        lat: parseFloat(formData.lat),
        lon: parseFloat(formData.lon),
        stock: parseInt(formData.stock),
        price: parseFloat(formData.price),
        estimatedValue: parseFloat(formData.estimatedValue),
        items: formData.items.split(',').map((item) => item.trim()),
      };

      if (editingBasket) {
        await updateBasket(editingBasket.id, basketData);
        setMessage({ type: 'success', text: 'Panier mis à jour avec succès !' });
      } else {
        await addBasket(basketData);
        setMessage({ type: 'success', text: 'Panier ajouté avec succès !' });
      }

      resetForm();
      loadBaskets();
    } catch (error) {
      console.error('Error saving basket:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde du panier' });
    }
  };

  const handleEdit = (basket) => {
    setEditingBasket(basket);
    setFormData({
      title: basket.title || '',
      store: basket.store || '',
      territory: basket.territory || 'Guadeloupe',
      lat: basket.lat || '',
      lon: basket.lon || '',
      pickupWindow: basket.pickupWindow || '',
      stock: basket.stock || 0,
      price: basket.price || 0,
      estimatedValue: basket.estimatedValue || 0,
      items: Array.isArray(basket.items) ? basket.items.join(', ') : '',
      img: basket.img || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer ce panier ?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteBasket(id);
      setMessage({ type: 'success', text: 'Panier supprimé avec succès !' });
      loadBaskets();
    } catch (error) {
      console.error('Error deleting basket:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression du panier' });
    }
  };

  const resetForm = () => {
    setFormData({
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
    });
    setEditingBasket(null);
    setShowForm(false);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-blue-400">
            🛡️ Admin Dashboard - Ti-Panié Solidaire
          </h1>
          <p className="text-slate-400">
            Gérez les paniers solidaires en temps réel
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
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
            >
              Fermer
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            {showForm ? '❌ Annuler' : '➕ Ajouter un panier'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">
              {editingBasket ? 'Modifier le panier' : 'Nouveau panier'}
            </h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Magasin *
                </label>
                <input
                  type="text"
                  value={formData.store}
                  onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Territoire *
                </label>
                <select
                  value={formData.territory}
                  onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Guadeloupe">Guadeloupe</option>
                  <option value="Martinique">Martinique</option>
                  <option value="Guyane">Guyane</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Créneau de retrait *
                </label>
                <input
                  type="text"
                  value={formData.pickupWindow}
                  onChange={(e) => setFormData({ ...formData, pickupWindow: e.target.value })}
                  placeholder="17:00–19:00"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.lon}
                  onChange={(e) => setFormData({ ...formData, lon: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Stock *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Prix (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Valeur estimée (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  required
                  min="0"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.img}
                  onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  placeholder="/img/panie-fruits.jpg"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Articles (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={formData.items}
                  onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                  placeholder="Bananes, Tomates, Salade"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  💾 {editingBasket ? 'Mettre à jour' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Baskets List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-400">Chargement des paniers...</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                      Titre
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                      Magasin
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                      Territoire
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {baskets.map((basket) => (
                    <tr key={basket.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-sm text-slate-200">
                        {basket.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {basket.store}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {basket.territory}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            basket.stock > 0
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}
                        >
                          {basket.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {basket.price?.toFixed(2)}€
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(basket)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(basket.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
                          >
                            🗑️ Supprimer
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
          </div>
        )}
      </div>
    </div>
  );
}
