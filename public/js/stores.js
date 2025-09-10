(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  const bust = u => u + (u.includes('?')?'&':'?') + 'v=' + (window.__APP_VERSION__||Date.now());
  const PLACEHOLDER = '/assets/brands/placeholder.png';

  const state = { data:[], brands:{}, filtered:[], page:1, per:12, territory:'', q:'' };

  function byBrandKey(k){ return state.brands[k] || {name:k, logo:PLACEHOLDER}; }
  function esc(s){ return String(s||'').replace(/[&<>"'`]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;' }[m])); }

  function draw(){
    // filtre
    const t = state.territory;
    const q = state.q.trim().toLowerCase();
    state.filtered = state.data.filter(x=>{
      const inT = !t || x.territory===t;
      const str = (x.name+' '+x.city+' '+x.brand).toLowerCase();
      const inQ = !q || str.includes(q);
      return inT && inQ;
    });

    // pagination
    const total = state.filtered.length;
    const pages = Math.max(1, Math.ceil(total/state.per));
    if (state.page>pages) state.page = pages;
    const start = (state.page-1)*state.per;
    const items = state.filtered.slice(start, start+state.per);

    // render cards
    const grid = $('#stores-grid');
    grid.innerHTML = items.map(card).join('') || `<div class="muted">Aucun résultat.</div>`;

    // attach fallback image
    grid.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error', ()=>{ img.src = bust(PLACEHOLDER); }, {once:true});
    });

    // pagination UI
    $('#stores-total').textContent = `${total}`;
    $('#stores-page').textContent = `${state.page}/${pages}`;
    $('#btn-prev').disabled = state.page<=1;
    $('#btn-next').disabled = state.page>=pages;
  }

  function card(x){
    const b = byBrandKey(x.brand);
    const logo = bust(b.logo || PLACEHOLDER);
    const city = x.city || '—';
    const addr = x.address || '—';
    return `
      <article class="store">
        <div class="logo"><img src="${logo}" alt="${esc(b.name)}" loading="lazy" decoding="async" width="56" height="56"></div>
        <div class="txt">
          <div class="name"><strong>${esc(x.name||b.name)}</strong></div>
          <div class="meta">${esc(city)}${addr!=='—'?' • '+esc(addr):''}</div>
          <div class="muted">${esc(x.territory||'')}</div>
        </div>
      </article>`;
  }

  async function load(){
    // inject styles minimalistes
    if(!$('#stores-css')){
      const css=document.createElement('style'); css.id='stores-css'; css.textContent=`
      .stores-wrap{margin-top:16px}
      .toolbar{display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:10px}
      .toolbar select,.toolbar input{padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#0b1220; color:#e5e7eb}
      .toolbar .grow{flex:1 1 220px}
      #stores-grid{display:grid; gap:12px; grid-template-columns:repeat(1,minmax(0,1fr))}
      @media(min-width:560px){#stores-grid{grid-template-columns:repeat(2,1fr)}}
      @media(min-width:900px){#stores-grid{grid-template-columns:repeat(3,1fr)}}
      .store{display:flex; gap:12px; padding:12px; border:1px solid #1f2937; background:#111827; border-radius:14px}
      .store .logo{width:56px;height:56px; border-radius:12px; background:#0b2930; display:grid; place-items:center; overflow:hidden; border:1px solid #0a2a30}
      .store .logo img{max-width:100%; max-height:100%; object-fit:contain; display:block; background:#fff; border-radius:10px}
      .store .txt .name{margin-bottom:4px}
      .muted{color:#94a3b8; font-size:12px}
      .pager{display:flex; gap:8px; align-items:center; margin-top:10px}
      .pager button{padding:8px 12px; border-radius:10px; border:1px solid #334155; background:#0b1220; color:#e5e7eb}
      `; document.head.appendChild(css);
    }

    const url = bust('/data/stores_domtom.json');
    const r = await fetch(url, {cache:'no-store'});
    const j = await r.json();

    // map brands
    state.brands = {};
    for(const b of j.brands||[]) state.brands[b.key]=b;

    // data
    state.data = Array.isArray(j.stores)? j.stores : [];
    // remplir select territoires
    const ts = (j.meta && j.meta.territories) ? j.meta.territories : [...new Set(state.data.map(x=>x.territory).filter(Boolean))].sort();
    const sel = $('#filter-territory');
    sel.innerHTML = `<option value=''>Tous les territoires</option>` + ts.map(t=>`<option>${esc(t)}</option>`).join('');

    draw();
  }

  // events
  document.addEventListener('click', (e)=>{
    if(e.target.id==='btn-prev'){ state.page=Math.max(1,state.page-1); draw(); }
    if(e.target.id==='btn-next'){ state.page=state.page+1; draw(); }
  });
  document.addEventListener('input', (e)=>{
    if(e.target.id==='filter-q'){ state.q=e.target.value; state.page=1; draw(); }
    if(e.target.id==='filter-territory'){ state.territory=e.target.value; state.page=1; draw(); }
  });

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
