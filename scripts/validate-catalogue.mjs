#!/usr/bin/env node
/**
 * validate-catalogue.mjs
 * Basic schema validation (non exhaustive)
 */
import fs from 'fs/promises'
import path from 'path'
const inPath = path.resolve('public/data/catalogue.json')

function isISODate(s){ 
  // Strict ISO date validation
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(s) && !Number.isNaN(Date.parse(s)); 
}

async function run(){
  const raw = await fs.readFile(inPath,'utf8');
  const data = JSON.parse(raw);
  for(const it of data){
    if(!it.id || !it.name) throw new Error('Item missing id/name: '+JSON.stringify(it).slice(0,80));
    if(!Array.isArray(it.observations)) throw new Error('Observations missing for '+it.id);
    for(const o of it.observations){
      if(typeof o.price !== 'number' || o.price < 0) throw new Error('Invalid price for '+it.id);
      if(!isISODate(o.date)) throw new Error('Invalid date for '+it.id+': '+o.date);
    }
  }
  console.log('validation OK');
}
run().catch(e=>{ console.error(e.message); process.exit(1); });
