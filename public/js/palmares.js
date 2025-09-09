(()=> {
  const tbl = document.getElementById('palmares-table');
  if(!tbl) return;
  fetch('/data/palmares.json')
    .then(r => r.json())
    .then(d => {
      const body = tbl.tBodies[0] || tbl.appendChild(document.createElement('tbody'));
      body.innerHTML = d.ranking.map(r => `
        <tr>
          <td>${r.rank}</td>
          <td>${r.brand}</td>
          <td>${r.zone}</td>
          <td>${r.basket.toFixed(2)} €</td>
        </tr>`).join('');
      const ts = document.getElementById('palmares-updated');
      if(ts) ts.textContent = d.updatedAt;
    })
    .catch(()=>{ /* silencieux (données démo) */ });
})();
