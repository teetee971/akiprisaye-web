import { useState } from "react";
import TerritorySelect from "@/components/TerritorySelect";
import BrandGrid from "@/components/BrandGrid";
import ProductScanner from "@/components/ProductScanner";

export default function Home(){
  const [territory, setTerritory] = useState("");
  const [scan, setScan] = useState(false);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold">Compare les prix <span className="text-cyan-300">près de chez toi</span></h1>
        <p className="text-slate-300">DROM-COM : Guadeloupe, Martinique, Guyane, Réunion, Mayotte…</p>
        <div className="flex gap-3 items-center">
          <div className="w-72"><TerritorySelect value={territory} onChange={setTerritory} /></div>
          <a className="text-sm text-cyan-300 underline" href="/diagnostics/">Diagnostics</a>
          <button onClick={()=>setScan(s=>!s)} className="text-sm px-3 py-2 rounded-lg bg-slate-800 border border-slate-600">
            {scan ? "Fermer le scanner" : "Scanner un code-barres"}
          </button>
        </div>
      </header>

      {scan && (
        <section className="space-y-3">
          <ProductScanner onCode={(ean)=>alert("EAN détecté: "+ean)} />
          <p className="text-sm text-slate-400">Après décodage, tu pourras appeler ton endpoint produit (ex: /api/product?ean=...).</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Enseignes partenaires / suivies</h2>
        <BrandGrid />
      </section>
    </main>
  );
}
