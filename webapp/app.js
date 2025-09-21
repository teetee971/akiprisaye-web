(function(){
  const API_URL = window.__AKP__?.API_URL || "";
  document.getElementById('apiUrlDisplay').textContent = API_URL || 'non défini';

  const grid = document.getElementById('grid');
  const render = list => {
    grid.innerHTML = list.map(p => `
      <div class="item">
        <h4>${p.name}</h4>
        <div>DOM: <span class="price">${p.price_dom.toFixed(2)} €</span></div>
        <div>Métropole: <span>${p.price_hex.toFixed(2)} €</span></div>
      </div>
    `).join('') || '<div class="muted">Aucun produit</div>';
  };

  async function fetchMock(){
    const res = await fetch('./mock/products.json', {cache:'no-store'});
    return res.json();
  }
  async function fetchAPI(){
    const res = await fetch(API_URL + '/api/prices?territory=guadeloupe&limit=20', {cache:'no-store'});
    if(!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    
    // Transform API data to webapp format if needed
    if(data.data && Array.isArray(data.data)) {
      return {
        items: data.data.map(item => ({
          id: item.id,
          name: item.title,
          price_dom: item.price,
          price_hex: item.price * 0.8 // Estimated mainland price
        }))
      };
    }
    
    return data;
  }

  async function load(useAPI=true){
    try{
      const data = useAPI && API_URL ? await fetchAPI() : await fetchMock();
      render(data.items || data);
    }catch(e){
      console.warn('API indispo, fallback mock:', e.message);
      const data = await fetchMock();
      render(data.items || data);
    }
  }

  document.getElementById('btnCompare').onclick = () => load(true);
  document.getElementById('btnMock').onclick = () => load(false);

  // initial
  load(!!API_URL);
})();