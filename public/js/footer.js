(()=>{ // Injecte le footer si #site-footer est présent
  const slot = document.getElementById('site-footer');
  if(!slot) return;
  fetch('/footer.html').then(r=>r.text()).then(html=>{
    slot.innerHTML = html;
    const y = slot.querySelector('#year'); if(y) y.textContent = new Date().getFullYear();
  }).catch(()=>{ /* silencieux */ });
})();
