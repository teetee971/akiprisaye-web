(function(){
  const tbl = document.getElementById('palmares-table');
  if (!tbl) return;

  const FLAGS = {
    guadeloupe:"🇬🇵", martinique:"🇲🇶", guyane:"🇬🇫", reunion:"🇷🇪", mayotte:"🇾🇹",
    "saint-martin":"🇲🇫", "saint-barthelemy":"🇧🇱", "polynesie-francaise":"🇵🇫",
    "nouvelle-caledonie":"🇳🇨", "wallis-et-futuna":"🇼🇫"
  };
  const norm = s => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const guess = (zone)=>{
    const z = norm(zone);
    if(/pointe.?a.?pitre/.test(z)) return "guadeloupe";
    if(/fort.?de.?france/.test(z)) return "martinique";
    if(/saint.?denis/.test(z)) return "reunion";
    return "";
  };

  fetch('/data/palmares.json')
    .then(r=>r.json())
    .then(d=>{
      const body = tbl.tBodies[0] || tbl.appendChild(document.createElement('tbody'));
      body.innerHTML = d.ranking.map(r=>{
        const terr = r.territory || guess(r.zone) || "guadeloupe";
        const flag = FLAGS[terr] || "🇫🇷";
        return `<tr>
          <td>${r.rank}</td>
          <td>${flag} ${r.brand}</td>
          <td>${r.zone}</td>
          <td>${Number(r.basket).toFixed(2)} €</td>
        </tr>`;
      }).join('');

      const stamp=document.getElementById('palmares-updated');
      if(stamp) stamp.textContent = d.updatedAt || '';
    })
    .catch(()=>{ /* silencieux */ });
})();
