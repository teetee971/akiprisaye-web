// petit exemple : branche palmarès
(async function(){
  const tbl = document.getElementById('palmares-table');
  if(!tbl) return;
  const body = tbl.querySelector('tbody') || tbl.appendChild(document.createElement('tbody'));
  try{
    const r = await fetch('/data/palmares.json'); const d = await r.json();
    body.innerHTML = d.ranking.map((r)=>`
      <tr>
        <td>${r.rank}</td>
        <td>${r.brand}</td>
        <td>${r.zone}</td>
        <td>${Number(r.basket).toFixed(2)} €</td>
      </tr>`).join('');
    const stamp = document.getElementById('palmares-updated');
    if(stamp) stamp.textContent = d.updatedAt || '—';
  }catch(e){ body.innerHTML = '<tr><td colspan="4" class="muted">Indispo</td></tr>'; }
})();
