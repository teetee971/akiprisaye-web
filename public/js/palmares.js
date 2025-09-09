(function(){
  const tbl = document.getElementById('palmares-table');
  if (!tbl) return;

  // Carte drapeaux par territoire (emoji)
  const flagMap = {
    guadeloupe: "🇬🇵",
    martinique: "🇲🇶",
    guyane: "🇬🇫",
    reunion: "🇷🇪",
    mayotte: "🇾🇹",
    "saint-martin": "🇫🇷",       // (pas d’emoji ISO dédié, on met 🇫🇷 par défaut)
    "saint-barthelemy": "🇫🇷",
    "saint-barthélemy": "🇫🇷",
    "polynesie-francaise": "🇵🇫",
    "polynésie-française": "🇵🇫",
    "nouvelle-caledonie": "🇳🇨",
    "nouvelle-calédonie": "🇳🇨",
    "wallis-et-futuna": "🇼🇫"
  };

  const norm = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

  // Si "territory" manquant, on devine à partir de la ville/zone
  function inferTerritoryFromZone(zone){
    const z = norm(zone);
    if (/pointe.?a.?pitre/.test(z)) return "guadeloupe";
    if (/fort.?de.?france/.test(z)) return "martinique";
    if (/saint.?denis/.test(z)) return "reunion";
    if (/cayenne|kourou/.test(z)) return "guyane";
    if (/mamoudzou/.test(z)) return "mayotte";
    return "guadeloupe"; // fallback
  }

  fetch('/data/palmares.json')
    .then(r => r.json())
    .then(d => {
      const body = tbl.querySelector('tbody') || tbl.appendChild(document.createElement('tbody'));
      body.innerHTML = d.ranking.map(r => {
        const terr = r.territory || inferTerritoryFromZone(r.zone);
        const flag = flagMap[terr] || "🇫🇷";
        return `
          <tr>
            <td>${r.rank}</td>
            <td>${flag} ${r.brand}</td>
            <td>${r.zone}</td>
            <td>${Number(r.basket).toFixed(2)} €</td>
          </tr>
        `;
      }).join('');

      const stamp = document.getElementById('palmares-updated');
      if (stamp) stamp.textContent = d.updatedAt;
    })
    .catch(() => { /* on laisse le contenu statique si erreur */ });
})();
