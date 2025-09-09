import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://akiprisaye.pages.dev/api";
const LIMIT_OPTIONS = [6, 12, 24];

/* ----------------------------- App racine ----------------------------- */
export default function App() {
  return (
    <div>
      <Header/>
      <main>
        <Hero/>
        <PricesByTerritory/>
        <HealthCheck/>
        <Stores/>
        <Reviews/>
        <Pricing/>
      </main>
      <Footer/>
    </div>
  );
}

/* ------------------------------- Header ------------------------------- */
function Header(){
  return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="container-app flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white font-bold">₳</span>
          <span className="font-bold">A KI PRI SA YÉ</span>
        </div>
        <nav className="text-sm hidden sm:flex gap-4">
          <a href="#compare" className="hover:text-brand">Comparer</a>
          <a href="#stores" className="hover:text-brand">Enseignes</a>
          <a href="#reviews" className="hover:text-brand">Avis</a>
          <a href="#pricing" className="hover:text-brand">Tarifs</a>
        </nav>
      </div>
    </header>
  );
}

/* -------------------------------- Hero -------------------------------- */
function Hero(){
  return (
    <section className="section">
      <div className="card p-6">
        <h1 className="text-3xl font-bold mb-2">Gérez votre budget, comparez les prix DOM-TOM</h1>
        <p className="text-gray-600">
          Accédez aux prix par territoire, suivez les enseignes et vérifiez l’état de l’API en temps réel.
        </p>
      </div>
    </section>
  );
}

/* ----------------------- Comparateur de prix UI ----------------------- */
function PricesByTerritory() {
  const [territories, setTerritories] = useState([]);
  const [territoriesLoading, setTerritoriesLoading] = useState(true);
  const [territoriesError, setTerritoriesError] = useState("");

  const [selected, setSelected] = useState("");
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(null);
  const abortRef = useRef(null);

  // Charger territoires
  useEffect(() => {
    let cancel = false;
    setTerritoriesLoading(true);
    setTerritoriesError("");
    fetch(`${API_BASE}/territories`)
      .then(r => {
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        if(cancel) return;
        const list = Array.isArray(json?.territories) ? json.territories : (Array.isArray(json) ? json : []);
        setTerritories(list);
        if(!selected && list.length) setSelected(list[0].code);
      })
      .catch(e => setTerritoriesError(e.message || "Erreur chargement territoires"))
      .finally(()=> !cancel && setTerritoriesLoading(false));
    return ()=>{ cancel = true; };
  }, []);

  // Charger items
  useEffect(() => {
    if(!selected) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setItemsLoading(true);
    setItemsError("");
    fetch(`${API_BASE}/prices?territory=${encodeURIComponent(selected)}&limit=${limit}&page=${page}`, { signal: controller.signal })
      .then(r => {
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(json => {
        setItems(json?.data || json?.items || []);
        if (typeof json?.total === "number") setTotal(json.total);
        else setTotal(null);
      })
      .catch(e => {
        if(e.name !== "AbortError") setItemsError(e.message || "Erreur chargement prix");
      })
      .finally(() => setItemsLoading(false));
    return ()=> controller.abort();
  }, [selected, limit, page]);

  useEffect(()=> setPage(0), [selected, limit]);

  const canPrev = page > 0;
  const canNext = total != null ? (page + 1) * limit < total : items.length === limit;
  const skeletons = useMemo(()=> Array.from({length: limit},(_,i)=><CardSkeleton key={i}/>), [limit]);

  return (
    <section id="compare" className="section">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">🛒 Comparateur de prix</h2>

        {/* Contrôles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6">
          <div className="col-span-2">
            <label htmlFor="territory" className="block text-sm font-medium mb-1">Territoire</label>
            {territoriesLoading ? (
              <div className="h-10 rounded bg-gray-200 animate-pulse"/>
            ) : territoriesError ? (
              <ErrorBox message={territoriesError} onRetry={()=>window.location.reload()}/>
            ) : (
              <select
                id="territory"
                value={selected}
                onChange={(e)=>setSelected(e.target.value)}
                className="w-full h-10 border rounded px-3">
                {territories.map(t=>(
                  <option key={t.code} value={t.code}>{t.name} ({t.type})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="limit" className="block text-sm font-medium mb-1">Résultats / page</label>
            <select id="limit" value={limit} onChange={e=>setLimit(Number(e.target.value))} className="w-full h-10 border rounded px-3">
              {LIMIT_OPTIONS.map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Liste */}
        {itemsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{skeletons}</div>
        ) : itemsError ? (
          <ErrorBox message={itemsError} onRetry={()=>setPage(p=>p)}/>
        ) : items.length === 0 ? (
          <EmptyState selected={selected}/>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(item=>(
                <article key={item.id || item.title} className="card p-4 hover:shadow transition">
                  <h4 className="font-semibold text-lg mb-1 line-clamp-2">{item.title}</h4>
                  <p className="text-gray-700 mb-1">
                    Prix : <span className="font-bold">{item.price} {item.currency || "EUR"}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Territoire : {item.territory || selected} • Source : {item.source || "—"}
                  </p>
                </article>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <button className="btn" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={!canPrev}>← Précédent</button>
              <div className="text-sm text-gray-600">Page <span className="font-medium">{page+1}</span></div>
              <button className="btn" onClick={()=>setPage(p=>p+1)} disabled={!canNext}>Suivant →</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------- Vérification de l'API ------------------------- */
function HealthCheck(){
  const [status, setStatus] = useState({
    territories: { ok: null, error: "" },
    prices: { ok: null, error: "" }
  });

  const run = async ()=>{
    setStatus({ territories:{ok:null,error:""}, prices:{ok:null,error:""} });
    try{
      const r = await fetch(`${API_BASE}/territories`);
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      await r.json();
      setStatus(s=>({...s, territories:{ok:true, error:""}}));
    }catch(e){ setStatus(s=>({...s, territories:{ok:false, error:e.message}})); }

    try{
      const r = await fetch(`${API_BASE}/prices?territory=guadeloupe&limit=1`);
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      await r.json();
      setStatus(s=>({...s, prices:{ok:true, error:""}}));
    }catch(e){ setStatus(s=>({...s, prices:{ok:false, error:e.message}})); }
  };

  useEffect(()=>{ run(); },[]);

  const Pill = ({state}) => state===null ? "⏳" : state ? "✅" : "❌";

  return (
    <section className="section">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">🔍 Vérification API</h2>
        <ul className="space-y-2 text-sm">
          <li><span className="font-medium">/api/territories :</span> <Pill state={status.territories.ok}/> {status.territories.ok===false && <span className="text-red-600">({status.territories.error})</span>}</li>
          <li><span className="font-medium">/api/prices :</span> <Pill state={status.prices.ok}/> {status.prices.ok===false && <span className="text-red-600">({status.prices.error})</span>}</li>
        </ul>
        <button className="btn mt-4" onClick={run}>↻ Rafraîchir</button>
      </div>
    </section>
  );
}

/* --------------------------- Enseignes / Magasins --------------------------- */
/* Démo: liste statique; remplace par tes données si besoin */
const DEMO_STORES = [
  { name:"Carrefour Destreland", territory:"guadeloupe", city:"Baie-Mahault", address:"ZI de Houelbourg, 97122", phone:"+590 590 25 00 00" },
  { name:"E.Leclerc Abymes", territory:"guadeloupe", city:"Les Abymes", address:"ZI de La Providence, 97139", phone:"+590 590 93 00 00" },
  { name:"Hyper U Madiana", territory:"martinique", city:"Schoelcher", address:"Madiana, 97233", phone:"+596 596 50 00 00" },
  { name:"Géant Casino Dillon", territory:"martinique", city:"Fort-de-France", address:"Centre Cial Dillon, 97200", phone:"+596 596 42 00 00" }
];

function Stores(){
  return (
    <section id="stores" className="section">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">🏪 Enseignes & Magasins</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_STORES.map((s,i)=>(
            <div key={i} className="card p-4">
              <h4 className="font-semibold">{s.name}</h4>
              <p className="text-sm text-gray-600">{s.city} — {s.territory}</p>
              <p className="text-sm">{s.address}</p>
              <p className="text-xs text-gray-500 mt-1">{s.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Avis Clients ------------------------------ */
const DEMO_REVIEWS = [
  { name:"Marie", note:5, text:"Super pratique pour comparer rapidement !", territory:"Guadeloupe" },
  { name:"Jules", note:4, text:"Interface claire et API fiable.", territory:"Martinique" },
  { name:"Amina", note:5, text:"M’a aidée à mieux gérer mon budget.", territory:"Mayotte" }
];
function Reviews(){
  return (
    <section id="reviews" className="section">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">⭐ Avis utilisateurs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_REVIEWS.map((r,i)=>(
            <div key={i} className="card p-4">
              <div className="font-semibold">{r.name}</div>
              <div className="text-yellow-500 text-sm mb-1">{"★".repeat(r.note)}{"☆".repeat(5-r.note)}</div>
              <p className="text-sm">{r.text}</p>
              <div className="text-xs text-gray-500 mt-2">{r.territory}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Pricing -------------------------------- */
function Pricing(){
  return (
    <section id="pricing" className="section">
      <div className="card p-6">
        <h2 className="text-2xl font-bold mb-4">💼 Tarifs & Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PriceCard title="Gratuit" price="0€" features={["Comparateur de base","Territoires DOM-TOM","Santé API (lecture)"]}/>
          <PriceCard title="Pro" price="19€" features={["Historique & pagination avancée","Exports CSV","Alertes prix","Support prioritaire"]}/>
          <PriceCard title="Entreprise" price="Sur devis" features={["SLA & quota étendus","Intégrations SI","Dashboards dédiés","Accompagnement"]}/>
        </div>
      </div>
    </section>
  );
}
function PriceCard({title, price, features=[]}){
  return (
    <div className="card p-5 border-brand/30">
      <div className="text-xl font-bold">{title}</div>
      <div className="text-3xl font-extrabold my-2">{price}</div>
      <ul className="text-sm space-y-1 mb-4">{features.map((f,i)=><li key={i}>• {f}</li>)}</ul>
      <button className="btn border-brand text-brand">Choisir {title}</button>
    </div>
  );
}

/* --------------------------------- Footer --------------------------------- */
function Footer(){
  return (
    <footer className="border-t mt-8">
      <div className="container-app py-6 text-sm text-gray-600">
        © {new Date().getFullYear()} A KI PRI SA YÉ • Lutte contre la vie chère • DOM-TOM
      </div>
    </footer>
  );
}

/* ------------------------------- Utils UI -------------------------------- */
function CardSkeleton(){
  return (
    <div className="card p-4">
      <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded mb-3"/>
      <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-2"/>
      <div className="h-3 w-1/3 bg-gray-200 animate-pulse rounded"/>
    </div>
  );
}
function ErrorBox({message, onRetry}){
  return (
    <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded">
      <p className="mb-2">❌ {message}</p>
      <button className="btn" onClick={onRetry}>Réessayer</button>
    </div>
  );
}
function EmptyState({selected}){
  return (
    <div className="p-6 border rounded bg-gray-50 text-gray-700">
      <p className="font-medium">Aucun article trouvé</p>
      <p className="text-sm">Aucun résultat pour <span className="font-semibold">{selected}</span>. Modifie le nombre de résultats ou change de page.</p>
    </div>
  );
}
