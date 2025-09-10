export default function BrandGrid({brands=[]}) {
  const items = brands.length ? brands : [
    {slug:"carrefour", name:"Carrefour"},
    {slug:"superu", name:"Super U"},
    {slug:"leaderprice", name:"Leader Price"},
    {slug:"promocash", name:"Promocash"},
    {slug:"hyperu", name:"Hyper U"},
    {slug:"market", name:"Market"},
    {slug:"monoprix", name:"Monoprix"},
    {slug:"intermarché", name:"Intermarché"},
    {slug:"proxi", name:"Proxi"},
    {slug:"score", name:"Score"},
    {slug:"spar", name:"Spar"},
    {slug:"u_express", name:"U Express"},
    {slug:"utile", name:"Utile"}
  ];
  const ph="/assets/brands/placeholder.png";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map(b=>(
        <figure key={b.slug} className="bg-slate-800 rounded-xl p-4 aspect-[3/2] flex items-center justify-center">
          <img
            loading="lazy"
            src={`/assets/brands/${b.slug}.png`}
            alt={`Logo ${b.name}`}
            className="max-h-16 object-contain"
            onError={(e)=>{ if(e.currentTarget.src.endsWith("placeholder.png")) return; e.currentTarget.src=ph; }}
          />
          <figcaption className="sr-only">{b.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
