(()=> {
  const tbl = document.getElementById('palmares-table');
  if (!tbl) return;
  fetch('/data/palmares.json').then(r=>r.json()).then(d=>{
    const body = tbl.querySelector('tbody') || tbl.appendChild(document.createElement('tbody'));
    body.innerHTML = d.ranking.map(r=>`
      <tr>
        <td>${r.rank}</td>
        <td>${r.brand}</td>
        <td>${r.zone}</td>
        <td>${r.basket.toFixed(2)} €</td>
      </tr>
    `).join('');
    const stamp = document.getElementById('palmares-updated');
    if (stamp) stamp.textContent = d.updatedAt;
  }).catch(()=>{ /* laisse le contenu démo s’il existe */ });
})();
