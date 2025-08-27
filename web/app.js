// Démo front — modules mock
const out = document.getElementById('output');
const write = (o) => { out.textContent = (typeof o === 'string') ? o : JSON.stringify(o,null,2) };

// Chargement d'un petit dataset mock
async function loadPrices(){
  const res = await fetch('../mock_api/prices.json');
  return await res.json();
}

// Algo mock de comparaison prix entre DOM et Hexagone
async function demoCompare(){
  const data = await loadPrices();
  // tri par écart desc
  const top = [...data.items].sort((a,b)=> (b.price_dom-b.price_hex) - (a.price_dom-a.price_hex)).slice(0,8);
  write({ message: 'TOP écarts DOM/Hexagone', items: top });
}

// IA démo: forecast simple => moyenne mobile + seuil
async function demoForecast(){
  const res = await fetch('../mock_api/series.json');
  const {series} = await res.json();
  const window = 3;
  const ma = series.map((v,i,arr)=>{
    const s = arr.slice(Math.max(0,i-window+1),i+1);
    return {t:i, value:v, ma: s.reduce((a,b)=>a+b,0)/s.length };
  });
  // prévision = dernière moyenne + micro random
  const last = ma[ma.length-1].ma;
  const forecast = +(last * (1+ (Math.random()-0.5)*0.02)).toFixed(4);
  write({ message:'Prévision inflation (démo)', last_ma:last, forecast });
}

// Vwa Peyi — synthèse vocale basique (navigateur)
function demoVoice(){
  const msg = new SpeechSynthesisUtterance("Pri-la ka monté, mé nou ké trapé bon ti promo !");
  msg.lang = 'fr-FR'; // démo FR (créole TTS non standard selon OS)
  speechSynthesis.speak(msg);
  write('🔊 Vwa Peyi : phrase parlée (voir réglages audio)');
}

// Radar cherté — alerte si produit dépasse seuil
async function demoAlerts(){
  const data = await loadPrices();
  const seuil = 15; // %
  const flagged = data.items
    .map(p=> ({...p, delta_pct: Math.round(100*(p.price_dom-p.price_hex)/p.price_hex)}))
    .filter(p=> p.delta_pct >= seuil);
  localStorage.setItem('akp_alerts', JSON.stringify(flagged));
  write({ message:`Produits au-dessus du seuil ${seuil}%`, count: flagged.length, items: flagged.slice(0,10) });
}

// Wiring UI
document.getElementById('btn-compare').onclick = demoCompare;
document.getElementById('btn-ia').onclick = demoForecast;
document.getElementById('btn-vwa').onclick = demoVoice;
document.querySelectorAll('[data-demo="compare"]').forEach(b=> b.onclick = demoCompare);
document.querySelectorAll('[data-demo="forecast"]').forEach(b=> b.onclick = demoForecast);
document.querySelectorAll('[data-demo="voice"]').forEach(b=> b.onclick = demoVoice);
document.querySelectorAll('[data-demo="alerts"]').forEach(b=> b.onclick = demoAlerts);

// Service worker (offline démo)
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('../sw.js').catch(console.warn);
}
