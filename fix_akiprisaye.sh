#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# Dossier projet
cd ~/akiprisaye-web 2>/dev/null || { echo "⚠️ Dossier ~/akiprisaye-web introuvable"; exit 1; }

echo "🧩 (1/6) Dépendances…"
# Node modules de style + react (si pas déjà là)
npm pkg get name >/dev/null 2>&1 || npm init -y
npm i react react-dom
npm i -D vite tailwindcss postcss autoprefixer
# init tailwind (-p = crée postcss.config)
npx tailwindcss init -p >/dev/null

echo "🧩 (2/6) Config Tailwind/PostCSS/Vite…"
# tailwind.config.cjs (couvre .html/.jsx)
cat > tailwind.config.cjs <<'TWC'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
TWC

# postcss.config.cjs (assure plugins)
cat > postcss.config.cjs <<'PCC'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
PCC

# vite.config.js minimal (aucun alias exotique)
cat > vite.config.js <<'VITE'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5174 },
});
VITE

echo "🧩 (3/6) Squelette HTML…"
# index.html (id root attendu par React)
cat > index.html <<'HTML'
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>A KI PRI SA YÉ — Démo</title>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
HTML

echo "🧩 (4/6) Fichiers src/…"
mkdir -p src/contexts src/components

# Feuille CSS tailwind
cat > src/index.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
CSS

# Contexte liste de courses
cat > src/contexts/ShoppingListContext.jsx <<'CTX'
import React, { createContext, useContext, useEffect, useState } from "react";

const ShoppingListContext = createContext();

export function ShoppingListProvider({ children }) {
  const [list, setList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopping:list")) || [];
    } catch { return []; }
  });
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    try { localStorage.setItem("shopping:list", JSON.stringify(list)); } catch {}
  }, [list]);

  function addItem(e) {
    e.preventDefault();
    const name = title.trim();
    const val  = parseFloat(String(price).replace(",", "."));
    if (!name) return;
    setList(cur => [{ id: Date.now(), title: name, price: isNaN(val) ? 0 : val }, ...cur]);
    setTitle(""); setPrice("");
  }

  function removeItem(id)   { setList(cur => cur.filter(it => it.id !== id)); }
  function clearList()      { setList([]); }

  const total = list.reduce((sum, it) => sum + (it.price || 0), 0);

  return (
    <ShoppingListContext.Provider value={{
      list, title, setTitle, price, setPrice, addItem, removeItem, clearList, total
    }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  return useContext(ShoppingListContext);
}
CTX

# Composant UI
cat > src/components/ShoppingList.jsx <<'CMP'
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
CMP

# Entrée React
cat > src/main.jsx <<'MAIN'
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ShoppingListProvider } from "./contexts/ShoppingListContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ShoppingListProvider>
      <App />
    </ShoppingListProvider>
  </React.StrictMode>
);
MAIN

# App minimal
cat > src/App.jsx <<'APP'
import React from "react";
import ShoppingList from "./components/ShoppingList.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4">
        <ShoppingList />
      </div>
    </div>
  );
}
APP

echo "🧩 (5/6) Scripts npm…"
# Ajoute/force des scripts sûrs (dev/preview)
node - <<'JS'
const fs = require('fs');
const p = 'package.json';
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
pkg.type = pkg.type || "module";
pkg.scripts = Object.assign({}, pkg.scripts, {
  dev: "vite --host",
  preview: "vite preview --host",
  build: "vite build"
});
fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
console.log("package.json OK");
JS

echo "🚀 (6/6) Lancement serveur…"
npm run dev
