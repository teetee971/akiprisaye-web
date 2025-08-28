const $ = s => document.querySelector(s);
const app = $('#app');

async function fetchJSON(p){ const r = await fetch(p, {cache:'no-store'}); return r.json(); }
function €(n){ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n) }
function pct(fr, dom){ return Math.round(((dom-fr)/fr)*100) }

async function viewHome(){
  const data = await fetchJSON('/data/products.json');
  app.innerHTML = `
    <div class="card"><h1>Produits</h1>
      <input class="search" id="q" placeholder="Rechercher un produit..."/>
    </div>
    <div class="grid" id="grid"></div>`;
  const grid = $('#grid'), q = $('#q');
  const render = (list)=> grid.innerHTML = list.map(p => `
    <div class="card">
      <img src="${p.image}" alt="${p.name}" style="width:100%;height:140px;object-fit:cover;border-radius:10px"/>
      <h3 style="margin:8px 0">${p.name}</h3>
      <div class="badge">🇫🇷 ${€(p.price_fr)} · 🇬🇵 ${€(p.price_gp)} <span style="color:${pct(p.price_fr,p.price_gp)>=0?'#f87171':'#22c55e'}"> ${pct(p.price_fr,p.price_gp)>=0?'+':''}${pct(p.price_fr,p.price_gp)}%</span></div>
    </div>`).join('');
  render(data);
  q.oninput = () => {
    const s = q.value.trim().toLowerCase();
    render(data.filter(p => p.name.toLowerCase().includes(s)));
  };
}

async function viewVieChere(){
  const data = await fetchJSON('/data/products.json');
  const rows = data.map(p => `<tr><td>${p.name}</td><td>${€(p.price_fr)}</td><td>${€(p.price_gp)}</td><td style="color:${pct(p.price_fr,p.price_gp)>=0?'#f87171':'#22c55e'}">${pct(p.price_fr,p.price_gp)>=0?'+':''}${pct(p.price_fr,p.price_gp)}%</td></tr>`).join('');
  app.innerHTML = `
    <div class="card">
      <h1>Vie chère — Comparatif 🇫🇷 ↔ 🇬🇵</h1>
      <table class="table">
        <thead><tr><th>Produit</th><th>🇫🇷 FR</th><th>🇬🇵 GP</th><th>Écart</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function viewScan(){
  app.innerHTML = `
    <div class="card">
      <h1>Scanner (démo)</h1>
      <p>Ce module est une simulation. Entrez un nom produit pour le retrouver :</p>
      <input class="search" id="scanq" placeholder="Ex: lessive, oeufs, sucre..."/>
      <div id="scanout" style="margin-top:10px"></div>
    </div>`;
  $('#scanq').oninput = async (e)=>{
    const s = e.target.value.trim().toLowerCase();
    if(!s) return $('#scanout').innerHTML='';
    const data = await fetchJSON('/data/products.json');
    const found = data.filter(p => p.name.toLowerCase().includes(s));
    $('#scanout').innerHTML = found.map(p => `<div class="card" style="margin-top:10px">${p.name} — 🇫🇷 ${€(p.price_fr)} / 🇬🇵 ${€(p.price_gp)}</div>`).join('');
  };
}

function viewCompte(){
  app.innerHTML = `
    <div class="card"><h1>Compte</h1>
      <p>Démo locale — connexion désactivée.</p>
      <button class="btn secondary" onclick="alert('Bientôt disponible')">Activer Auth</button>
    </div>`;
}

const routes = {
  '#/': viewHome,
  '#/vie-chere': viewVieChere,
  '#/scan': viewScan,
  '#/compte': viewCompte,
};

function setActiveTab(){
  document.querySelectorAll('.tabs a').forEach(a=> a.classList.toggle('active', a.getAttribute('href')===location.hash || (location.hash==='' && a.getAttribute('href')==='#/')));
}
async function router(){
  const h = location.hash || '#/';
  setActiveTab();
  const view = routes[h] || viewHome;
  await view();
}
window.addEventListener('hashchange', router);
window.addEventListener('load', async ()=>{
  // PWA
  if('serviceWorker' in navigator){ try{ await navigator.serviceWorker.register('/sw.js'); }catch(e){} }
  router();
});
