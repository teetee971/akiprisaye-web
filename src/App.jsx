import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TicketsAdmin from "./pages/admin/TicketsAdmin";

function App() {
  return (
    <Router>
      <Routes>
        {/* Route par défaut */}
        <Route path="/" element={
          <div className="min-h-screen bg-slate-50 text-slate-900 antialiased p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-6">
              A KI PRI SA YÉ
            </h1>

            <p className="text-center text-slate-600 mb-4">
              Comparateur - version démo
            </p>

            <div className="flex gap-4">
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
          </div>
        } />
        {/* autres routes */}
        <Route path="/admin/tickets" element={<TicketsAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;

