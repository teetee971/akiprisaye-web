const $ = (s) => document.querySelector(s);
const K = (n) => Intl.NumberFormat('fr-FR').format(n);

async function loadJSON(path, fallback=[]) {
  try { const r = await fetch(path, {cache:'no-store'}); return await r.json(); }
  catch(e){ console.warn('json fail', path, e); return fallback; }
}

async function hydrateKPIs(){
  const k = await loadJSON('./data/kpis.json', {});
  $('#kpi-products').textContent   = K(k.products ?? 0);
  $('#kpi-stores').textContent     = K(k.stores ?? 0);
  $('#kpi-territories').textContent= K(k.territories ?? 0);
  $('#kpi-updated').textContent    = (k.updated ?? '').split('T')[0].split('-').reverse().join('/');
}

async function hydrateFeatures(){
  const feats = await loadJSON('./data/features.json', []);
  const wrap = $('#features'); wrap.innerHTML = '';
  feats.forEach(f=>{
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `<span class="badge">${f.tag}</span>
      <h3 style="margin:8px 0 6px">${f.title}</h3>
      <p class="lead" style="font-size:14px">${f.text}</p>`;
    wrap.appendChild(el);
  });
}

async function hydrateNews(){
  const items = await loadJSON('./data/news.json', []);
  const wrap = $('#news'); wrap.innerHTML = '';
  items.slice(0,3).forEach(n=>{
    const el = document.createElement('div');
    el.className='card';
    const d = new Date(n.date).toLocaleDateString('fr-FR');
    el.innerHTML = `<span class="badge">${n.tag}</span>
      <h3 style="margin:8px 0 6px">${n.title}</h3>
      <p class="lead" style="font-size:14px">${n.excerpt}</p>
      <div class="lead" style="font-size:12px;color:#9fb1d3">${d}</div>`;
    wrap.appendChild(el);
  });
}

async function hydrateReviews(){
  const items = await loadJSON('./data/reviews.json', []);
  const wrap = $('#reviews'); wrap.innerHTML = '';
  if(items.length){
    const avg = (items.reduce((a,b)=>a+b.rating,0)/items.length).toFixed(1);
    $('#avg-rating').textContent = `Note moyenne ${avg} ★`;
  }
  items.slice(0,3).forEach(v=>{
    const stars = '★★★★★'.slice(0, v.rating).split('').join('<span style="opacity:.25">★</span>') + (v.rating<5?'':'');
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `<div style="font-size:18px;font-weight:800">${v.title}</div>
    <p class="lead" style="font-size:14px">${v.text}</p>
    <div class="lead" style="font-size:12px;color:#9fb1d3">${'★'.repeat(v.rating)}${'☆'.repeat(5-v.rating)} — ${v.author}</div>`;
    wrap.appendChild(el);
  });
}

async function hydrateStores(){
  const logos = await loadJSON('./data/stores.json', []);
  const row = $('#logos'); row.innerHTML='';
  logos.forEach(s=>{
    const el = document.createElement('div');
    el.innerHTML = `<img class="logo" alt="${s.name}" src="${s.logo}">`;
    row.appendChild(el);
  });
}

function wireSearch(){
  $('#go').addEventListener('click', ()=>{
    const q = ($('#q').value||'').trim();
    if(!q) return;
    // Option A (recherche côté client plus tard) :
    window.location.href = `/recherche.html?q=${encodeURIComponent(q)}`;
    // Option B : démo API EAN :
    // fetch(`/api/ean2nc8?ean=${encodeURIComponent(q)}`).then(r=>r.json()).then(console.log);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  $('#y').textContent = new Date().getFullYear();
  hydrateKPIs(); hydrateFeatures(); hydrateNews(); hydrateReviews(); hydrateStores();
  wireSearch();
});
