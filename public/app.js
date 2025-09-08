async function hydrateKPIs(){
  try{
    const k = await (await fetch('../data/kpis.json')).json();
    byId('kpiProducts').textContent   = k.products.toLocaleString('fr-FR');
    byId('kpiRetailers').textContent  = k.retailers.toLocaleString('fr-FR');
    byId('kpiTerritories').textContent= k.territories.toLocaleString('fr-FR');
    byId('kpiUpdated').textContent    = new Date(k.updated).toLocaleDateString('fr-FR');
  }catch(e){ console.warn('kpis.json?', e); }
}

async function hydrateNews(){
  try{
    const items = await (await fetch('../data/news.json')).json();
    const wrap = byId('news'); wrap.innerHTML='';
    items.forEach(n=>{
      const card = el('div','card');
      card.innerHTML = `
        <span class="badge">${n.tag}</span>
        <h3>${n.title}</h3>
        <div class="lead3">${new Date(n.date).toLocaleDateString('fr-FR')}</div>
        <p class="lead3">${n.excerpt}</p>`;
      wrap.appendChild(card);
    });
  }catch(e){ console.warn('news.json?', e); }
}

async function hydrateReviews(){
  try{
    const items = await (await fetch('../data/reviews.json')).json();
    const wrap = byId('reviews'); wrap.innerHTML='';
    items.forEach(v=>{
      const stars = '★★★★★'.slice(0, v.rating).split('').map(s=>`<span style="color:#ffc857">${s}</span>`).join('');
      const card = el('div','card');
      card.innerHTML = `<div>${stars}</div><p class="lead3">${v.text}</p><strong>${v.author}</strong>`;
      wrap.appendChild(card);
    });
  }catch(e){ console.warn('reviews.json?', e); }
}

async function hydrateStores(){
  try{
    const items = await (await fetch('../data/stores.json')).json();
    const row = byId('logos'); row.innerHTML='';
    items.forEach(s=>{
      const box = el('div'); box.style.textAlign='center';
      box.innerHTML=`<img class="logo" alt="${s.name}" src="${s.logo}" onerror="this.replaceWith(document.createTextNode('${s.name}'));">`;
      row.appendChild(box);
    });
  }catch(e){ console.warn('stores.json?', e); }
}

// Recherche: redirige vers /recherche.html?q=...
document.getElementById('searchForm').addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const q = byId('q').value.trim();
  const t = byId('territoire').value.trim();
  // Démo endpoint EAN (optionnel) si q ressemble à un EAN
  if(/^\d{8,14}$/.test(q)){
    fetch(`/api/ean2nc8?ean=${encodeURIComponent(q)}`)
      .then(r=>r.json()).then(console.log).catch(()=>{});
  }
  const u = new URL(location.origin + '/recherche.html');
  u.searchParams.set('q', q);
  if(t) u.searchParams.set('t', t);
  location.href = u.toString();
});

function byId(id){return document.getElementById(id)}
function el(tag,cls){const n=document.createElement(tag); if(cls) n.className=cls; return n;}

document.addEventListener('DOMContentLoaded', ()=>{
  hydrateKPIs(); hydrateNews(); hydrateReviews(); hydrateStores();
  byId('year').textContent = new Date().getFullYear();
});

// ====== Hydrate Partners & Territories (DOM-COM) ======
async function hydratePartners(){
  try{
    const data = await (await fetch('/data/partners.json')).json();
    const wrap = document.getElementById('partners') || document.querySelector('.partners');
    if(!wrap) return;
    wrap.innerHTML = '';
    data.forEach(p=>{
      const card = document.createElement('div'); card.className='partner';
      const img  = document.createElement('img'); img.alt = p.name; img.loading='lazy'; img.src = p.logo;
      img.onerror = ()=>{ img.remove(); const fb=document.createElement('div'); fb.textContent=p.name; fb.style.opacity='.85'; fb.style.textAlign='center'; fb.style.fontWeight='700'; card.appendChild(fb); };
      card.appendChild(img);
      wrap.appendChild(card);
    });
  }catch(e){ console.warn('partners.json?', e); }
}

async function hydrateFlags(){
  try{
    const data = await (await fetch('/data/territories.json')).json();
    // Selecteur
    const select = document.getElementById('territoire') || document.querySelector('select[name="territoire"]');
    if(select){
      select.innerHTML = '';
      const opt0 = document.createElement('option'); opt0.value=''; opt0.textContent='— Territoire —'; select.appendChild(opt0);
      data.forEach(t=>{ const o=document.createElement('option'); o.value=t.code; o.textContent=t.name; select.appendChild(o); });
    }
    // Grille drapeaux si présente
    const grid = document.getElementById('flags') || document.querySelector('.flags');
    if(grid){
      grid.innerHTML='';
      data.forEach(t=>{
        const box = document.createElement('div'); box.className='flag-item';
        const img = document.createElement('img'); img.alt=t.name; img.loading='lazy'; img.src=t.flag;
        img.onerror = ()=>{ img.remove(); const fb=document.createElement('div'); fb.textContent=t.code; fb.style.fontWeight='700'; fb.style.opacity='.85'; box.appendChild(fb); };
        const label = document.createElement('div'); label.textContent=t.name; label.style.marginTop='8px'; label.style.opacity='.85'; label.style.fontSize='12px'; label.style.textAlign='center';
        box.appendChild(img); box.appendChild(label);
        grid.appendChild(box);
      });
    }
  }catch(e){ console.warn('territories.json?', e); }
}

document.addEventListener('DOMContentLoaded', ()=>{
  try{ hydratePartners(); }catch{}
  try{ hydrateFlags(); }catch{}
});
