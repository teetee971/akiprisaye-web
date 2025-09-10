import { useEffect, useState } from "react";

export default function Diagnostics(){
  const [state, setState] = useState({page:false, version:"(absent)", territories:{ok:false, count:0}, prices:{ok:false, count:0}});
  useEffect(()=>{
    (async ()=>{
      const v = await fetch("/version.txt?"+Date.now()).then(r=>r.text()).catch(()=>"(absent)");
      const t = await fetch("/api/territories?"+Date.now()).then(r=>r.json()).catch(()=>({ok:false,data:[]}));
      const p = await fetch("/api/prices?territory=guadeloupe&limit=5&v="+Date.now()).then(r=>r.json()).catch(()=>({ok:false,data:[]}));
      setState({
        page:true,
        version:v,
        territories:{ok: !!(t.ok && (t.data||[]).length), count:(t.data||[]).length||0},
        prices:{ok: !!(p.ok && (p.data||[]).length), count:(p.data||[]).length||0}
      });
    })();
  },[]);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4 text-slate-200">
      <h1 className="text-2xl font-semibold">Diagnostics</h1>
      <ul className="space-y-2">
        <li>Page HTML: <b>{state.page?"OK":"KO"}</b></li>
        <li>version.txt: <code className="text-xs">{String(state.version).slice(0,80)}</code></li>
        <li>API /territories: <b>{state.territories.ok?"OK":"KO"}</b> (count={state.territories.count})</li>
        <li>API /prices (échantillon): <b>{state.prices.ok?"OK":"KO"}</b> (items={state.prices.count})</li>
      </ul>
      <p className="text-sm opacity-70">Astuce: si /territories est KO (count=0), vérifie le Worker/route; le site basculera sur le fallback public/api/territories.json.</p>
    </main>
  );
}
