/**
 * ⑤ CLASSEMENT SIMPLE DES ENSEIGNES
 * Top 3 des enseignes les plus économiques
 * 
 * Updated to show actual cheapest products count from seed data
 * and make cards clickable to open detail panel
 */

import React, { useState, useMemo } from "react";
import { GlassCard } from "../ui/glass-card";
import { SEED_STORES } from "../../data/seedStores";
import { getCheapestProductsCount, getCheapestProductsByStore } from "../../services/storeCheapestProductsService";
import StoreCheapestProductsPanel from "../store/StoreCheapestProductsPanel";
import type { CheapestByStore } from "../../services/storeCheapestProductsService";

interface StoreRank {
  rank: number;
  storeId: string;
  name: string;
  chain: string;
  productsCount: number;
  medal: string;
}

export function StoreRanking() {
  const territory = "Guadeloupe";
  const [selectedStore, setSelectedStore] = useState<CheapestByStore | null>(null);

  // Calculate actual rankings from seed data
  const rankings: StoreRank[] = useMemo(() => {
    // Get stores from the selected territory
    const territoryStores = SEED_STORES.filter(s => s.territory === territory);
    
    // Calculate cheapest products count for each store
    const storesWithCounts = territoryStores.map(store => ({
      storeId: store.id,
      name: store.name,
      chain: store.chain,
      productsCount: getCheapestProductsCount(store.id),
    }))
    .filter(store => store.productsCount > 0) // Only include stores with cheapest products
    .sort((a, b) => b.productsCount - a.productsCount) // Sort by count descending
    .slice(0, 3); // Top 3

    // Add ranks and medals
    const medals = ["🥇", "🥈", "🥉"];
    return storesWithCounts.map((store, index) => ({
      ...store,
      rank: index + 1,
      medal: medals[index] || "",
    }));
  }, [territory]);

  const handleStoreClick = (storeId: string) => {
    const data = getCheapestProductsByStore(storeId);
    if (data) {
      setSelectedStore(data);
    }
  };

  return (
    <>
      <GlassCard className="bg-yellow-900/10 border-yellow-500/30">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2 text-yellow-300">
              🏆 Enseignes les plus économiques – {territory}
            </h3>
            <p className="text-xs text-gray-400">
              Cliquez sur une enseigne pour voir les détails
            </p>
          </div>

          {/* Classement */}
          <div className="space-y-3">
            {rankings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Aucune donnée disponible pour ce territoire</p>
              </div>
            ) : (
              rankings.map((store) => (
                <button
                  key={store.rank}
                  onClick={() => handleStoreClick(store.storeId)}
                  className="w-full flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-all transform hover:scale-102"
                >
                  <div className="text-4xl">{store.medal}</div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-lg text-white">{store.chain}</div>
                    <div className="text-sm text-gray-400">
                      {store.productsCount} produits les moins chers
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-green-400">
                      #{store.rank}
                    </div>
                    <div className="text-xs text-blue-400 mt-1">
                      👉 Voir détails
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Mention légale */}
          <div className="text-center pt-4 border-t border-slate-700">
            <div className="text-xs text-gray-400">
              📊 Données publiques – observatoire citoyen
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Basé sur {rankings.reduce((sum, r) => sum + r.productsCount, 0)} produits suivis
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Detail Panel Modal */}
      {selectedStore && (
        <StoreCheapestProductsPanel 
          data={selectedStore}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </>
  );
}
