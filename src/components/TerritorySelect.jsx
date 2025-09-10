import {useEffect, useState} from "react";

const STATIC_FALLBACK = [
  {code:"BL",slug:"saint-barthelemy",name:"Saint-Barthélemy"},
  {code:"GF",slug:"guyane",name:"Guyane"},
  {code:"GP",slug:"guadeloupe",name:"Guadeloupe"},
  {code:"MF",slug:"saint-martin",name:"Saint-Martin"},
  {code:"MQ",slug:"martinique",name:"Martinique"},
  {code:"NC",slug:"nouvelle-caledonie",name:"Nouvelle-Calédonie"},
  {code:"PF",slug:"polynesie-francaise",name:"Polynésie française"},
  {code:"PM",slug:"saint-pierre-et-miquelon",name:"Saint-Pierre-et-Miquelon"},
  {code:"RE",slug:"reunion",name:"Réunion"},
  {code:"WF",slug:"wallis-et-futuna",name:"Wallis-et-Futuna"},
  {code:"YT",slug:"mayotte",name:"Mayotte"},
];

export default function TerritorySelect({value, onChange}) {
  const [options, setOptions] = useState(STATIC_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load(){ 
      try {
        // essaie l'API distante ; si vide, fallback local ; sinon fallback statique
        const cacheBust = Date.now();
        const urls = [
          "/api/territories?v="+cacheBust,          // Worker/API distant
          "/api/territories.json?v="+cacheBust      // fallback local (public/)
        ];
        for (const u of urls) {
          const r = await fetch(u);
          if (!r.ok) continue;
          const j = await r.json().catch(()=>null);
          const arr = j?.data || [];
          if (arr.length > 0) { if(!ignore) setOptions(arr); break; }
        }
      } finally { if(!ignore) setLoading(false); }
    }
    load(); 
    return ()=>{ignore=true};
  }, []);

  return (
    <label className="block">
      <span className="sr-only">Territoire</span>
      <select
        className="rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2 w-full"
        disabled={loading}
        value={value}
        onChange={(e)=>onChange?.(e.target.value)}
      >
        <option value="">{loading ? "Chargement…" : "— Territoire —"}</option>
        {options.map(t => (
          <option key={t.code} value={t.slug}>{t.name}</option>
        ))}
      </select>
    </label>
  );
}
