(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Année footer
  $('#year').textContent = new Date().getFullYear();

  // Charger stats + listes
  fetch('/data/stats.json?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
      // Stats
      $('#statProducts').textContent = data.products_total.toLocaleString('fr-FR');
      $('#statStores').textContent = data.stores_total.toLocaleString('fr-FR');
      $('#statZones').textContent = data.zones_total.toLocaleString('fr-FR');
      $('#statUpdated').textContent = new Date(data.last_update).toLocaleDateString('fr-FR');

      // Territoires
      const chips = $('#chipsZones');
      data.zones.forEach(z => {
        const li = document.createElement('li');
        li.textContent = z.label;
        li.onclick = () => {
          const url = new URL('/search.html', location.origin);
          url.searchParams.set('zone', z.value);
          location.href = url.toString();
        };
        chips.appendChild(li);
      });

      // Enseignes
      const grid = $('#storesGrid');
      data.stores.forEach(s => {
        const div = document.createElement('div');
        div.className = 'store';
        div.innerHTML = `<strong>${s.name}</strong><div style="font-size:.85rem;color:#a9b4d0">${s.zone_label}</div>`;
        grid.appendChild(div);
      });
    })
    .catch(() => {
      // valeurs de secours
      $('#statProducts').textContent = '—';
      $('#statStores').textContent = '—';
      $('#statZones').textContent = '—';
      $('#statUpdated').textContent = '—';
    });
})();
