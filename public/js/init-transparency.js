import { quickHealth } from './healthcheck.js';
(async ()=>{
  const box=document.getElementById('transparencyBox');
  if(!box) return;
  const dot=s=>s==='ok'?'●':'○';
  try{
    const r=await quickHealth();
    box.innerHTML = r.map(x=>`<span class="status ${x.s}">${dot(x.s)}</span>`).join(' ')
      + ' API: territoires + prix';
  }catch(e){ box.textContent='API: indisponible'; }
})();
