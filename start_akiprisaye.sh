#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

# ====== Options ======
HOST="${HOST:-127.0.0.1}"                 # override: HOST=0.0.0.0
PORT="${PORT:-5173}"                      # override: PORT=5174
SESSION="${SESSION:-web}"
FORCE="${FORCE:-false}"                   # override: FORCE=true pour réécrire les fichiers

say(){ printf '\033[1;32m[✓]\033[0m %s\n' "$*"; }
write_if_needed(){ local p="$1"; shift || true; if $FORCE || [ ! -s "$p" ]; then mkdir -p "$(dirname "$p")"; cat > "$p"; say "Écrit: $p"; else say "Ok (existant): $p"; fi; }

# ====== Fichiers ======
write_if_needed index.html <<'HTML'
<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>A Ki Pri Sa Yé</title><link rel="stylesheet" href="/style.css"/>
</head><body>
<header class="topbar"><div class="brand"><span class="logo">🛡</span><strong>A Ki Pri Sa Yé</strong></div>
<nav class="nav">
  <a href="#" class="active" data-view="dashboard">Tableau de bord</a>
  <a href="#" data-view="detections">Détections</a>
  <a href="#" data-view="alerts">Alertes</a>
  <a href="#" data-view="stats">Statistiques</a>
  <a href="#" data-view="settings">Paramètres</a>
</nav></header>

<main>
  <!-- Dashboard -->
  <section id="view-dashboard" class="view show">
    <section class="grid">
      <article class="card"><h2>Statut</h2><div class="kpis">
        <div><span class="hint">En ligne</span></div>
        <div><span class="hint">Agent connecté</span></div>
      </div></article>
      <article class="card"><h2>Détections (aujourd'hui)</h2><div class="value" id="detectionsToday">0</div></article>
      <article class="card"><h2>Fichiers scannés</h2><div class="value" id="filesScanned">0</div></article>
      <article class="card"><h2>Uptime</h2><div class="value" id="uptime">00:00:00</div></article>
    </section>
    <section class="toolbar">
      <button id="toggleTheme" class="btn">Mode sombre</button>
      <button id="scanNow" class="btn btn-primary">Scanner maintenant</button>
    </section>
    <section class="panel"><h2>Dernières alertes</h2><ul id="alerts" class="alerts"></ul></section>
  </section>

  <!-- Détections -->
  <section id="view-detections" class="view">
    <h2>Détections</h2>
    <table class="table">
      <thead><tr><th>Heure</th><th>Fichier</th><th>Type</th><th>Gravité</th></tr></thead>
      <tbody id="detectionsTable"></tbody>
    </table>
  </section>

  <!-- Alertes -->
  <section id="view-alerts" class="view"><h2>Alertes</h2><ul id="alerts2" class="alerts"></ul></section>

  <!-- Stats -->
  <section id="view-stats" class="view"><h2>Statistiques</h2><canvas id="chart" width="360" height="180"></canvas></section>

  <!-- Paramètres -->
  <section id="view-settings" class="view">
    <h2>Paramètres</h2>
    <label class="form-row"><span>Notifications</span><input id="optNotify" type="checkbox" checked/></label>
  </section>
</main>

<footer class="footer">© 2025 A Ki Pri Sa Yé</footer>
<script type="module" src="/main.js"></script>
</body></html>
HTML

write_if_needed style.css <<'CSS'
:root{--bg:#fafafa;--surface:#fff;--text:#111827;--muted:#6b7280;--border:#e5e7eb;--accent:#0ea5e9;--success:#22c55e;--danger:#ef4444;--warning:#f59e0b}
:root.dark{--bg:#0f172a;--surface:#0b1220;--text:#e6edf3;--muted:#94a3b8;--border:#1f2937;--accent:#7dd3fc;--success:#34d399;--danger:#f87171;--warning:#fbbf24}
*{box-sizing:border-box}html,body{height:100%}body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,"Segoe UI",Roboto,Arial,sans-serif}
.topbar{background:var(--surface);border-bottom:1px solid var(--border);padding:.75rem}.brand{display:flex;align-items:center;gap:.5rem}.logo{filter:drop-shadow(0 0 4px color-mix(in srgb,var(--accent) 12%,transparent))}
.nav{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:.5rem}.nav a{color:var(--text);opacity:.8}.nav a.active{opacity:1;text-decoration:underline}
main{display:flex;flex-direction:column;gap:1rem;max-width:980px;margin:1rem auto;padding:0 1rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
.card{background:var(--surface);border:1px solid var(--border);border-radius:.5rem;padding:1rem}.kpis{display:flex;gap:.75rem}
.value{font-size:1.8rem;font-weight:700}.hint{opacity:.7;font-size:.9rem}
.toolbar{display:flex;flex-wrap:wrap;gap:.5rem}.btn{padding:.5rem .8rem;border:1px solid var(--border);border-radius:.5rem;background:var(--surface);cursor:pointer}.btn-primary{border-color:var(--accent)}
.alerts{list-style:none;margin:0;padding:0;display:grid;gap:.5rem}.alerts li{display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);background:var(--surface);padding:.5rem .8rem;border-radius:.5rem}
.sev-high .hint{color:var(--danger)}.sev-medium .hint{color:var(--warning)}.sev-low .hint{color:var(--success)}
.table{width:100%;border-collapse:collapse}.table th,.table td{padding:.5rem;border-bottom:1px solid var(--border)}
.form-row{display:flex;align-items:center;gap:.75rem;padding:.5rem 0}.footer{text-align:center;color:var(--muted);padding:2rem 1rem}
.view{display:none}.view.show{display:block}
CSS

write_if_needed main.js <<'JS'
"use strict";
// Thème
const THEME_KEY="A Ki Pri Sa Yé-theme"; const root=document.documentElement;
function applyTheme(name){root.classList.toggle('dark',name==='dark');}
applyTheme(localStorage.getItem(THEME_KEY)||"light");
document.getElementById('toggleTheme')?.addEventListener('click',()=>{const next=root.classList.contains('dark')?'light':'dark';localStorage.setItem(THEME_KEY,next);applyTheme(next);});

// Navigation
document.querySelectorAll('.nav a').forEach(a=>{
  a.addEventListener('click',e=>{e.preventDefault();
    document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active')); a.classList.add('active');
    const id="view-"+a.dataset.view; document.querySelectorAll('.view').forEach(v=>v.classList.remove('show'));
    document.getElementById(id)?.classList.add('show');
  });
});

// KPI + uptime
let start=Date.now();
setInterval(()=>{
  const det=Math.floor(Math.random()*7);
  const detEl=document.getElementById('detectionsToday'); if(detEl) detEl.textContent=String(det);
  const filesEl=document.getElementById('filesScanned'); if(filesEl) filesEl.textContent=(1200+Math.floor(Math.random()*800)).toLocaleString('fr-FR');
  const s=Math.floor((Date.now()-start)/1000), h=String(Math.floor(s/3600)).padStart(2,'0'), m=String(Math.floor((s%3600)/60)).padStart(2,'0'), ss=String(s%60).padStart(2,'0');
  const up=document.getElementById('uptime'); if(up) up.textContent=`${h}:${m}:${ss}`;
},1000);

// Alertes démo
const alertsUL=document.getElementById('alerts')||document.getElementById('alerts2');
const demoAlerts=[{text:'Processus suspect bloqué',severity:'high'},{text:'Nouvelle règle appliquée',severity:'low'},{text:'Scan terminé (rapide)',severity:'medium'}];
if(alertsUL){demoAlerts.forEach(a=>{const li=document.createElement('li'); li.className=`sev-${a.severity}`; li.innerHTML=`<span>${a.text}</span><span class="hint">${a.severity}</span>`; alertsUL.appendChild(li);});}

// Détections démo
const tbody=document.getElementById('detectionsTable');
[{time:'08:01',file:'/system/bin/app',type:'heuristique',severity:'high'},
 {time:'08:15',file:'/sdcard/Download/x.apk',type:'signature',severity:'low'},
 {time:'08:57',file:'/data/app/SoOn',type:'comportement',severity:'medium'}]
.forEach(r=>{ if(!tbody) return; const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.time}</td><td>${r.file}</td><td>${r.type}</td><td>${r.severity}</td>`; tbody.appendChild(tr);});

// Scan manuel
document.getElementById('scanNow')?.addEventListener('click',()=>{
  const hhmm=new Date().toTimeString().slice(0,5);
  if(tbody){const tr=document.createElement('tr'); tr.innerHTML=`<td>${hhmm}</td><td>/scan/manual</td><td>manual</td><td>info</td>`; tbody.prepend(tr);}
  if(alertsUL){const li=document.createElement('li'); li.className='sev-medium'; li.innerHTML='<span>Scan manuel lancé</span><span class="hint">info</span>'; alertsUL.prepend(li);}
});

// Mini chart (sans lib)
const canvas=document.getElementById('chart'); if(canvas){const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height,M=20; const data=[3,5,2,4,1,6,4]; const max=Math.max(...data); const sx=(W-2*M)/data.length, k=(H-2*M)/max;
  ctx.clearRect(0,0,W,H); ctx.strokeStyle='#ccc'; ctx.beginPath(); ctx.moveTo(M,H-M); ctx.lineTo(W-M,H-M); ctx.moveTo(M,H-M); ctx.lineTo(M,M); ctx.stroke();
  data.forEach((v,i)=>{const x=M+i*sx+6, y=H-M-v*k, h=v*k; ctx.fillRect(x,y, sx-12, h);});
}
JS

# ====== npm / vite ======
if [ ! -f package.json ]; then
  say "Init npm"; npm init -y >/dev/null
  npm pkg set name=A Ki Pri Sa Yé private=true type=module >/dev/null
fi
npm pkg set scripts.dev="vite --host $HOST --port $PORT --strictPort" >/dev/null
if ! npx --yes vite --version >/dev/null 2>&1; then say "Install vite"; npm i -D vite >/dev/null; fi

# ====== (Re)start serveur ======
tmux kill-session -t "$SESSION" 2>/dev/null || true
tmux new -ds "$SESSION" "bash -lc 'npm run dev 2>&1 | tee -a vite-dev.log'" >/dev/null
URL="http://$HOST:$PORT/"; say "Serveur prêt : $URL"
command -v termux-open-url >/dev/null 2>&1 && termux-open-url "$URL" || true
say "Logs: tmux attach -t $SESSION  (Ctrl+b puis d pour détacher)"
