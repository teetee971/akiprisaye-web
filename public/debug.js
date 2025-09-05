/* Debug helper pour A KI PRI SA YÉ (search page) */
(function () {
  // Active sur toutes les origines; si tu veux limiter: if (!location.hostname.endsWith('pages.dev')) return;

  console.info('[DEBUG] instrumentation active');

  // Patch fetch pour tracer les appels API
  const _fetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url);
    const headers = (init && init.headers) || {};
    const t0 = performance.now();
    console.log('[DEBUG][fetch→]', url, headers);
    try {
      const r = await _fetch(input, init);
      console.log('[DEBUG][fetch←]', r.status, r.statusText, 'en', (performance.now() - t0).toFixed(1), 'ms');
      return r;
    } catch (e) {
      console.error('[DEBUG][fetch×]', url, e);
      throw e;
    }
  };

  // Enveloppe doSearch pour tracer entrée/sortie
  const ensure = (id)=>document.getElementById(id);
  const _doSearch = window.doSearch;
  if (typeof _doSearch === 'function') {
    window.doSearch = async function (...args) {
      const zone = ensure('zone')?.value || '';
      const q    = ensure('q')?.value || '';
      console.groupCollapsed('%c[DEBUG] doSearch()', 'color:#0bf');
      console.log('inputs =>', { zone, q });
      console.time('[DEBUG] doSearch');
      try {
        const res = await _doSearch.apply(this, args);
        console.timeEnd('[DEBUG] doSearch');
        console.groupEnd();
        return res;
      } catch (e) {
        console.timeEnd('[DEBUG] doSearch');
        console.error('[DEBUG] doSearch error', e);
        console.groupEnd();
        throw e;
      }
    };
  } else {
    console.warn('[DEBUG] window.doSearch introuvable au moment du patch.');
    // Retente après le onload si le script principal se charge plus tard
    window.addEventListener('load', () => {
      if (typeof window.doSearch === 'function') {
        console.info('[DEBUG] doSearch détectée après load, patch en place.');
        const _late = window.doSearch;
        window.doSearch = async (...args) => {
          console.time('[DEBUG] doSearch');
          try { return await _late(...args); }
          finally { console.timeEnd('[DEBUG] doSearch'); }
        };
      }
    });
  }

  // Petit bouton debug pour re-jouer la recherche rapidement (optionnel)
  try {
    const host = document.querySelector('#results') || document.body;
    const btn  = Object.assign(document.createElement('button'), {
      textContent: '🔁 Rejouer (debug)',
      style: 'margin:.5rem 0;padding:.35rem .6rem;border-radius:.5rem;border:1px solid #09f;background:#001627;color:#9bd;cursor:pointer;font:12px/1.2 system-ui'
    });
    btn.addEventListener('click', ()=> (typeof window.doSearch==='function') && window.doSearch());
    host.parentNode && host.parentNode.insertBefore(btn, host);
  } catch {}
})();
