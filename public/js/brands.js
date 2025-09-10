/* Grille Enseignes — charge /data/stores.json si dispo, sinon démo */
(function(){
  const GRID = "#grid-enseignes";
  const fallback = [
    {"name":"Carrefour","logo":"/assets/brands/carrefour.png"},
    {"name":"Super U","logo":"/assets/brands/superu.png"},
    {"name":"Leader Price","logo":"/assets/brands/leaderprice.png"},
    {"name":"Promocash","logo":"/assets/brands/promocash.png"}
  ];
  const PLACEHOLDER="/assets/brands/placeholder.png";
  const q=s=>document.querySelector(s);
  const bust=u=> u+(u.includes('?')?'&':'?')+'v='+Date.now();
  const safe=s=>String(s||'').replace(/[&<>"'`]/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;' }[m]));
  const initials = n => (n||'?').split(/\s+/).map(x=>x[0]||'').join('').slice(0,3).toUpperCase();

  function card(x){
    const logo = x.logo ? bust(x.logo) : bust(PLACEHOLDER);
    return `
      <a class="brand-card" href="#" title="${safe(x.name)}" style="display:flex;gap:12px;align-items:center;padding:14px;border:1px solid #1f2937;border-radius:14px;background:#111827">
        <span class="logo" style="width:44px;height:44px;border-radius:10px;display:grid;place-items:center;overflow:hidden;background:#0b2930;border:1px solid #0a2a30">
          <img loading="lazy" decoding="async" src="${logo}" alt="${safe(x.name)}" width="44" height="44">
        </span>
        <span style="font-weight:700">${safe(x.name)}</span>
        <span class="badge-missing" style="margin-left:auto;display:none;color:#fca5a5;font-size:12px">logo manquant</span>
      </a>`;
  }

  async function load(){
    const root = q(GRID);
    if(!root) return;
    let data = null;
    try{
      const r = await fetch(bust('/data/stores.json'), {cache:'no-store'});
      if(r.ok){ data = await r.json(); }
    }catch(_){}
    const list = Array.isArray(data)&&data.length ? data : fallback;
    root.innerHTML = list.map(card).join('');
    root.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error',()=>{
        const cardEl = img.closest('.brand-card');
        cardEl?.classList.add('is-missing');
        const box = cardEl?.querySelector('.logo');
        if(box){ box.textContent = initials(img.alt||'?'); box.style.color="#a7f3d0"; }
        img.remove();
        const badge = cardEl?.querySelector('.badge-missing'); if(badge) badge.style.display='inline';
      }, {once:true});
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
