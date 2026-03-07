// src/components/AddToTiPanierButton.tsx
import React, { useState } from 'react';
import { useTiPanier } from '../hooks/useTiPanier';
import type { PublicProduct } from '../services/eanPublicCatalog';
import { useToast } from '../hooks/useToast';
import { useEntitlements } from '../billing/useEntitlements';
import { addShoppingListItem } from '../store/useShoppingListStore';
import { isTerritoryCode } from '../types/territory';

type AddToTiPanierButtonProps = {
  product: PublicProduct;
};

export default function AddToTiPanierButton({ product }: AddToTiPanierButtonProps) {
  const { addItem, removeItem } = useTiPanier();
  const { quota } = useEntitlements();
  const [added, setAdded] = useState(false);
  const toast = useToast();

  const handleAdd = () => {
    const latestPrice = product.observedPrices?.[product.observedPrices.length - 1];
    const territory = isTerritoryCode(latestPrice?.territory) ? latestPrice.territory : undefined;

    addItem({
      id: product.ean,
      quantity: 1,
      meta: {
        ean: product.ean,
        name: product.name,
        price: latestPrice?.price,
        store: latestPrice?.store,
        ...(territory ? { territory } : {}),
        category: product.category,
      },
    });

    addShoppingListItem(
      {
        id: product.ean,
        name: product.name,
        quantity: 1,
        price: latestPrice?.price,
        ...(territory ? { territory } : {}),
        history: latestPrice?.price ? [latestPrice.price] : undefined,
      },
      quota('maxItems'),
    );

    setAdded(true);

    toast.undoable('🛒 Ajouté au ti-panier', {
      onUndo: () => {
        removeItem(product.ean);
        setAdded(false);
        toast.success('Article retiré');
      },
      duration: 5000,
    });

    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={added}
      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
        added ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'
      }`}
      aria-label={`Ajouter ${product.name} au ti-panier`}
    >
      {added ? '✓ Ajouté au ti-panier' : '🛒 Ajouter au ti-panier'}
    </button>
  );
}
