import React, { useState } from "react";
import TicketsAdmin from "./pages/TicketsAdmin";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const renderPage = () => {
    switch (currentPage) {
      case "tickets-admin":
        return <TicketsAdmin />;
      default:
        return (
          <div className="min-h-screen bg-slate-50 text-slate-900 antialiased p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">
              A KI PRI SA YÉ
            </h1>

            <p className="text-center text-slate-600 mb-4">
              Comparateur - version démo
            </p>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Nom du produit"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                type="number"
                placeholder="Prix (€)"
                className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-right"
              />
              <button className="rounded-xl bg-sky-600 px-4 py-2 text-white font-medium hover:bg-sky-700">
                Ajouter
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentPage("tickets-admin")}
                className="rounded-xl bg-gray-800 text-white px-6 py-3 font-medium hover:bg-gray-900"
              >
                📂 Administration des Tickets
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {currentPage !== "home" && (
        <div className="bg-gray-800 text-white p-2">
          <button
            onClick={() => setCurrentPage("home")}
            className="text-blue-300 hover:text-blue-100"
          >
            ← Retour à l'accueil
          </button>
        </div>
      )}
      {renderPage()}
    </div>
  );
}

