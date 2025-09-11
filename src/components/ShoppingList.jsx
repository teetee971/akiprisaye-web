import React from "react";
import { useShoppingList } from "../contexts/ShoppingListContext.jsx";

const fmt = (n) => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"EUR" }).format(n);

export default function ShoppingList() {
  const { list, title, setTitle, price, setPrice, addItem, removeItem, clearList, total } = useShoppingList();

  return (
    <div className="p-4 max-w-xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">🛒 Ma liste de courses</h2>

      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nom du produit"
          className="flex-1 px-3 py-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="number" step="0.01" inputMode="decimal"
          placeholder="Prix (€)"
          className="w-32 px-3 py-2 border rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button type="submit" className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500">
          Ajouter
        </button>
      </form>

      {list.length === 0 ? (
        <p className="text-gray-500">Aucun article pour l’instant.</p>
      ) : (
        <ul className="divide-y">
          {list.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium">{it.title}</span>{" "}
                <span className="text-gray-500">{fmt(it.price || 0)}</span>
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="text-red-500 hover:text-red-600"
                title="Supprimer"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between text-lg font-semibold">
        <span>Total :</span>
        <span className="text-teal-700">{fmt(total)}</span>
      </div>

      <div className="mt-2">
        <button
          onClick={clearList}
          disabled={list.length === 0}
          className={`px-3 py-2 rounded ${
            list.length === 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-red-600 text-white hover:bg-red-500"
          }`}
        >
          Vider la liste
        </button>
      </div>
    </div>
  );
}
