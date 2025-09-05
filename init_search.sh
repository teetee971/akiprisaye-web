set -e

echo "🔒 Backup de public/index.html…"
mkdir -p backups
cp -f public/index.html "backups/index_$(date +%Y%m%d_%H%M%S).html" 2>/dev/null || true

echo "✍️  Écriture du nouvel index avec la recherche…"
cat > public/index.html <<'HTML'
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>A KI PRI SA YÉ – Comparateur de prix & suivi budget</title>
  <meta name="description" content="Comparez les prix, suivez votre budget et trouvez l’enseigne la moins chère dans votre zone (DROM-COM)." />
  <meta name="theme-color" content="#0f172a" />
  <style>
    :root{
      --bg:#0f172a; --panel:#111827; --muted:#94a3b8;
      --text:#e5e7eb; --brand:#38bdf8; --brand-dark:#0ea5e9;
      --ok:#22c55e; --err:#ef4444; --card:#1e293b;
    }
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:var(--bg); color:var(--text)}
    header{
      padding:2rem 1rem; text-align:center;
      background: radial-gradient(1200px 400px at 50% -50%, #0ea5e933, transparent 60%), linear-gradient(#0b1220, #0f172a);
    }
    h1{margin:0 0 0.5rem;font-size:clamp(1.4rem,3.5vw,2.3rem)}
    p.lead{margin:.25rem 0 1.25rem;color:var(--muted)}
    .cta{display:inline-block;padding:.9rem 1.35rem;border-radius:999px;background:linear-gradient(90deg,#22d3ee,#0ea5e9); color:#002;
         font-weight:700; text-decoration:none; box-shadow:0 10px 30px #0ea5e955}
    main{max-width:1000px;margin:0 auto;padding:1rem}
    .card{background:var(--card); border:1px solid #ffffff1a; border-radius:18px; box-shadow:0 10px 50px #0007; overflow:hidden; margin:1rem 0}
    .card h2{margin:0;padding:1rem 1rem .25rem 1rem; font-size:clamp(1.1rem,2.4vw,1.6rem)}
    .content{padding:1rem}
    .row{display:grid; gap:.75rem}
    @media(min-width:720px){ .row{grid-template-columns: 1fr 140px 140px} }
    label{font-size:.9rem;color:var(--muted)}
    select,input[type="text"]{width:100%; background:#0b1220; color:var(--text); border:1px solid #ffffff22; border-radius:12px; padding:.75rem .85rem}
    button{appearance:none; border:0; border-radius:12px; padding:.8rem 1rem; font-weight:700; cursor:pointer;
           background:#0ea5e9; color:#001; box-shadow:0 6px 20px #0ea5e955}
    button:hover{background:#38bdf8}
    .status{font-size:.9rem;color:var(--muted); margin-top:.35rem}
    .status.ok{color:var(--ok)} .status.err{color:var(--err)}
    table{width:100%; border-collapse:collapse; margin-top:.75rem}
    th,td{border:1px solid #ffffff1a; padding:.6rem .7rem; text-align:left}
    th{background:#0b1220; position:sticky; top:0}
    tbody tr:nth-child(odd){background:#ffffff07}
    .skeleton td{color:transparent; background:linear-gradient(90deg,#ffffff06,#ffffff0f,#ffffff06); background-size:200% 100%;
                 animation:sh 1.4s infinite}
    @keyframes sh{ to{ background-position:-200% 0 } }
    footer{padding:1.25rem; text-align:center; border-top:1px solid rgba(255,255,255,.08); opacity:.85}
    footer a{color:#38bdf8; text-decoration:none}
  </style>
</head>
<body>
  <header>
    <h1>A KI PRI SA YÉ</h1>
    <p class="lead">Comparez les prix, suivez votre budget et trouvez l’enseigne la moins chère.</p>
    <a class="cta" href="#" aria-disabled="true">Télécharger maintenant</a>
  </header>

  <main>
    <!-- RECHERCHE PRODUIT -->
    <section class="card" id="searchCard">
      <h2>🔎 Recherche produit</h2>
      <div class="content">
        <div class="row" style="align-items:end">
          <div>
            <label for="zoneSearch">Zone :</label>
            <select id="zoneSearch">
              <option value="martinique">Martinique</option>
              <option value="guadeloupe">Guadeloupe</option>
              <option value="guyane">Guyane</option>
              <option value="reunion">Réunion</option>
              <option value="mayotte">Mayotte</option>
              <option value="saint-martin">Saint-Martin</option>
              <option value="saint-barthelemy">Saint-Barthélemy</option>
              <option value="saint-pierre-et-miquelon">Saint-Pierre-et-Miquelon</option>
              <option value="polynesie-francaise">Polynésie française</option>
              <option value="wallis-et-futuna">Wallis-et-Futuna</option>
            </select>
          </div>
          <div>
            <label for="q">Produit :</label>
            <input id="q" type="text" placeholder="Ex: lait demi-écrémé, baguette…" autocomplete="off" />
          </div>
          <div><button id="btnSearch">Rechercher</button></div>
        </div>
        <div id="searchStatus" class="status">Saisissez un produit puis « Rechercher ».</div>
        <div style="overflow:auto; max-height:420px; margin-top:.5rem">
          <table>
            <thead><tr>
              <th>Produit</th><th>Enseigne</th><th>Prix</th><th>Unité</th><th>Maj.</th>
            </tr></thead>
            <tbody id="searchBody"><tr><td colspan="5" class="status">—</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- PALMARÈS (existant) -->
    <section class="card">
      <h2>🏆 Palmarès – Meilleures enseignes</h2>
      <div class="content">
        <div class="row" style="grid-template-columns:1fr 140px;">
          <div>
            <label for="zoneRank">Zone :</label>
            <select id="zoneRank">
              <option value="martinique">Martinique</option>
              <option value="guadeloupe">Guadeloupe</option>
              <option value="guyane">Guyane</option>
              <option value="reunion">Réunion</option>
              <option value="mayotte">Mayotte</option>
              <option value="saint-martin">Saint-Martin</option>
              <option value="saint-barthelemy">Saint-Barthélemy</option>
              <option value="saint-pierre-et-miquelon">Saint-Pierre-et-Miquelon</option>
              <option value="polynesie-francaise">Polynésie française</option>
              <option value="wallis-et-futuna">Wallis-et-Futuna</option>
            </select>
          </div>
          <div><button id="btnRank">Actualiser</button></div>
        </div>
        <div id="rankStatus" class="status">Choisissez une zone puis « Actualiser ».</div>
        <div style="overflow:auto; max-height:420px; margin-top:.5rem">
          <table>
            <thead><tr>
              <th>Rang</th><th>Enseigne</th><th>Panier moyen</th><th>Échantillon</th>
            </tr></thead>
            <tbody id="rankBody"><tr><td colspan="4" class="status">—</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>

    <p class="content" style="color:var(--muted)">
      <strong>Transparence :</strong> données consolidées par zone (DROM-COM).  
      Mise à jour automatique via nos fonctions backend.
    </p>
  </main>

  <footer>
    <div style="font-size:.95rem">© <span id="y"></span> A KI PRI SA YÉ – DROM-COM</div>
    <div style="margin-top:.35rem;font-size:.9rem">
      <a href="mailto:contact@akiprisaye.app">contact@akiprisaye.app</a> •
      <a href="#">Mentions légales</a>
    </div>
    <script>document.getElementById('y').textContent = new Date().getFullYear();</script>
  </footer>

  <script>
  // === Endpoints Firebase ===
  const ENDPOINT_RANK   = "https://us-central1-a-ki-pri-sa-ye.cloudfunctions.net/getRanking";
  const ENDPOINT_SEARCH = "https://us-central1-a-ki-pri-sa-ye.cloudfunctions.net/searchProducts"; // à déployer (voir plus bas)

  // === Helpers UI ===
  const fmtEUR = new Intl.NumberFormat("fr-FR",{style:"currency", currency:"EUR"});
  const setStatus = (el, msg, cls="") => { el.textContent = msg; el.className = "status " + cls; };

  // ======= Recherche produit =======
  const zoneSearch = document.getElementById("zoneSearch");
  const qInput     = document.getElementById("q");
  const btnSearch  = document.getElementById("btnSearch");
  const searchBody = document.getElementById("searchBody");
  const searchStatus = document.getElementById("searchStatus");

  function renderSearchSkeleton(){
    searchBody.innerHTML = Array.from({length:6}).map(()=>(
      `<tr class="skeleton"><td>██████</td><td>████</td><td>██,██ €</td><td>██</td><td>██/██</td></tr>`
    )).join("");
  }
  function renderSearchRows(rows){
    searchBody.innerHTML = rows.map(r=>(
      `<tr>
         <td>${r.name || "—"}</td>
         <td>${r.store || "—"}</td>
         <td>${r.price!=null ? fmtEUR.format(r.price) : "—"}</td>
         <td>${r.unit || "—"}</td>
         <td>${r.updatedAt ? new Date(r.updatedAt._seconds? r.updatedAt._seconds*1000 : r.updatedAt).toLocaleDateString("fr-FR") : "—"}</td>
       </tr>`
    )).join("");
  }

  async function doSearch(){
    const zone = zoneSearch.value;
    const q = (qInput.value || "").trim();
    if(!q){ setStatus(searchStatus, "Saisis un produit puis clique « Rechercher ».", ""); qInput.focus(); return; }
    setStatus(searchStatus, "Recherche en cours…", "muted"); renderSearchSkeleton();
    const v = Date.now().toString().slice(-6);
    const url = `${ENDPOINT_SEARCH}?zone=${encodeURIComponent(zone)}&q=${encodeURIComponent(q)}&v=${v}`;
    try{
      const res = await fetch(url, { headers:{accept:"application/json"} });
      if(!res.ok) throw new Error("HTTP "+res.status);
      const data = await res.json();
      if(!data.items || data.items.length===0){
        searchBody.innerHTML = `<tr><td colspan="5" class="status">Aucun résultat pour « ${q} ».</td></tr>`;
        setStatus(searchStatus, "Aucun résultat.", "");
        return;
      }
      renderSearchRows(data.items);
      setStatus(searchStatus, `${data.items.length} résultat(s) pour « ${q} ».`, "ok");
    }catch(e){
      console.error(e);
      searchBody.innerHTML = `<tr><td colspan="5" class="status">Impossible de charger les résultats.</td></tr>`;
      setStatus(searchStatus, "Erreur : recherche indisponible (endpoint non déployé ?).", "err");
    }
  }
  btnSearch.addEventListener("click", doSearch);
  qInput.addEventListener("keydown", e => { if(e.key==="Enter") doSearch(); });

  // ======= Palmarès =======
  const zoneRank = document.getElementById("zoneRank");
  const btnRank  = document.getElementById("btnRank");
  const rankBody = document.getElementById("rankBody");
  const rankStatus = document.getElementById("rankStatus");

  function renderRankSkeleton(){
    rankBody.innerHTML = Array.from({length:6}).map(()=>(
      `<tr class="skeleton"><td>#</td><td>████</td><td>██,██ €</td><td>██</td></tr>`
    )).join("");
  }
  function renderRankRows(rows){
    rankBody.innerHTML = rows.map((row,i)=>(
      `<tr>
        <td>${i+1}</td>
        <td>${row.store}</td>
        <td>${fmtEUR.format(row.avgBasket)}</td>
        <td>${row.sampleSize}</td>
       </tr>`
    )).join("");
  }
  async function fetchRanking(){
    const zone = zoneRank.value;
    setStatus(rankStatus, "Chargement…", "muted"); renderRankSkeleton();
    const v = Date.now().toString().slice(-6);
    const url = `${ENDPOINT_RANK}?zone=${encodeURIComponent(zone)}&v=${v}`;
    try{
      const res = await fetch(url, { headers:{accept:"application/json"} });
      if(!res.ok) throw new Error("HTTP "+res.status);
      const data = await res.json();
      if(!data.rows || data.rows.length===0){
        rankBody.innerHTML = `<tr><td colspan="4" class="status">Aucune donnée disponible</td></tr>`;
        setStatus(rankStatus, "Aucune donnée.", "");
        return;
      }
      renderRankRows(data.rows);
      setStatus(rankStatus, "Données chargées.", "ok");
    }catch(e){
      console.error(e);
      rankBody.innerHTML = `<tr><td colspan="4" class="status">Impossible de charger les données</td></tr>`;
      setStatus(rankStatus, "Erreur de chargement.", "err");
    }
  }
  btnRank.addEventListener("click", fetchRanking);
  </script>
</body>
</html>
HTML

echo "📦 Build local (copie -> dist)…"
rm -rf dist && mkdir dist && cp -r public/* dist/

echo "💾 Git commit & push…"
git add public/index.html
git commit -m "feat: recherche produit (UI) + palmarès conservé"
git push

echo "✅ Terminé. Cloudflare Pages va se déployer automatiquement."
