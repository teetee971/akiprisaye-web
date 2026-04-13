 
/**
 * Shopping List Manager Component
 * Main component for managing shopping lists
 */

import { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Trash2, Edit2, TrendingDown } from 'lucide-react';
import { shoppingListService } from '../services/smartShoppingListService';
import type { ShoppingList } from '../types/shoppingList';

export function ShoppingListManager() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = () => {
    const loadedLists = shoppingListService.getLists();
    setLists(loadedLists);
    if (loadedLists.length > 0 && !selectedList) {
      setSelectedList(loadedLists[0]);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    await shoppingListService.createList(newListName, 'GP');
    setNewListName('');
    setIsCreating(false);
    loadLists();
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
      await shoppingListService.deleteList(listId);
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
      loadLists();
    }
  };

  const handleOptimize = async () => {
    if (!selectedList) return;
    
    const optimization = await shoppingListService.optimizeBudget(selectedList);
    setSelectedList({
      ...selectedList,
      optimization
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Mes Listes de Courses
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Créez et optimisez vos listes pour économiser
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lists Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Mes listes
                </h2>
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  aria-label="Créer une nouvelle liste"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Create New List Form */}
              {isCreating && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Nom de la liste"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold"
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* List Items */}
              <div className="space-y-2">
                {lists.map(list => (
                  <button
                    key={list.id}
                    type="button"
                    className={`
                      w-full text-left p-3 rounded-lg cursor-pointer transition-colors
                      ${selectedList?.id === list.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500' 
                        : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }
                    `}
                    onClick={() => setSelectedList(list)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {list.name}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {list.items.length} article{list.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        aria-label="Supprimer la liste"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                ))}

                {lists.length === 0 && !isCreating && (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune liste pour le moment</p>
                    <p className="text-xs">Créez votre première liste!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected List Detail */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="space-y-6">
                {/* List Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedList.name}
                    </h2>
                    <button
                      aria-label={`Renommer la liste "${selectedList.name}"`}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Créée le {new Date(selectedList.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Articles ({selectedList.items.length})
                    </h3>
                    <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>

                  {selectedList.items.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <p>Aucun article dans cette liste</p>
                      <p className="text-sm">Commencez à ajouter des produits</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedList.items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {item.productName}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Quantité: {item.quantity} • {item.category}
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              await shoppingListService.removeItem(selectedList.id, item.id);
                              loadLists();
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optimize Button */}
                {selectedList.items.length > 0 && (
                  <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Optimiser ma liste</h3>
                        <p className="text-sm opacity-90">
                          Trouvez les meilleurs prix et le meilleur itinéraire
                        </p>
                      </div>
                      <button
                        onClick={handleOptimize}
                        className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"
                      >
                        <TrendingDown className="w-5 h-5" />
                        Optimiser
                      </button>
                    </div>
                  </div>
                )}

                {/* Optimization Results */}
                {selectedList.optimization && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                      Résultats de l'optimisation
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-sm text-green-800 dark:text-green-200">Économies</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {selectedList.optimization.savings.toFixed(2)}€
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm text-blue-800 dark:text-blue-200">Temps estimé</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {selectedList.optimization.estimatedTime} min
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-sm text-purple-800 dark:text-purple-200">Distance</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {selectedList.optimization.estimatedDistance.toFixed(1)} km
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedList.optimization.stores.map((store, i) => (
                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div className="font-semibold text-slate-900 dark:text-white mb-2">
                            {store.storeName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {store.items.length} article{store.items.length !== 1 ? 's' : ''} • 
                            Sous-total: {store.subtotal.toFixed(2)}€
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-12 shadow-lg text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-xl text-slate-600 dark:text-slate-400">
                  Sélectionnez une liste ou créez-en une nouvelle
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
