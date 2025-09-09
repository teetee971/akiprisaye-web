(() => {
  const tbl = document.getElementById('palmares-table');
  if (!tbl) return;

  fetch('/data/palmares.json')
    .then(r => r.json())
    .then(d => {
      const tbody = tbl.querySelector('tbody') || tbl.appendChild(document.createElement('tbody'));
      tbody.innerHTML = d.ranking.map(r => `
        <tr>
          <td>${r.rank}</td>
          <td>${r.brand}</td>
          <td>${r.zone}</td>
          <td>${r.basket.toFixed(2)} €</td>
        </tr>
      `).join('');

      const stamp = document.getElementById('palmares-updated');
      if (stamp && d.updatedAt) stamp.textContent = d.updatedAt;
    })
    .catch(() => {
      // Laisse le contenu démo tel quel si erreur réseau
    });
})();
