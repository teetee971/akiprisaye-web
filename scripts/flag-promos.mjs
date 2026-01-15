#!/usr/bin/env node
/**
 * flag-promos.mjs
 * Simple script that marks probable promos in catalogue (heuristic)
 */
import fs from 'fs/promises'
import path from 'path'
const inPath = path.resolve('public/data/catalogue.json')

async function run(){
  const raw = await fs.readFile(inPath,'utf8');
  const data = JSON.parse(raw);
  const out = data.map(item=>{
    const obs = (item.observations||[]).slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    if(obs.length<2) return item;
    const latest = obs[obs.length-1];
    const last30 = obs.filter(o => (Date.now()-new Date(o.date).getTime()) <= 30*24*3600*1000);
    if(last30.length){
      const avg30 = last30.reduce((s,o)=>s+o.price,0)/last30.length;
      if(latest.price <= avg30*0.9){
        latest.isPromo = true;
        latest.promoLabel = latest.promoLabel || 'Promo probable';
      }
    }
    item.observations = obs;
    return item;
  });
  await fs.writeFile(inPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('flag-promos done');
}
run().catch(e=>{ console.error(e); process.exit(1); });
