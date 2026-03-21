#!/usr/bin/env node
/**
 * build-executive-os-exports.mjs — V8.2 Executive OS exports
 *
 * Reads:   data/output/revenue-os-products.json
 *          data/output/b2b-retailer-ranking.json
 *          data/output/predictive-ranking.json
 *          data/output/user-retention-priority.json
 * Writes:
 *   data/output/executive-kpis.json
 *   data/output/executive-risks.json
 *   data/output/executive-decisions.json
 *   data/output/platform-health.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname }                                    from 'node:path';
import { fileURLToPath }                                       from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'data/output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function load(name, fb) {
  const p = resolve(OUT_DIR, name);
  if (!existsSync(p)) return fb;
  try { const r=JSON.parse(readFileSync(p,'utf8')); return Array.isArray(r)?r:(r.products??r.retailers??r.segments??r.items??fb); }
  catch { return fb; }
}

const revenueProducts = load('revenue-os-products.json', []);
const retailers       = load('b2b-retailer-ranking.json', []);
const predictive      = load('predictive-ranking.json', []);
const retentionSegs   = load('user-retention-priority.json', []);

const ts = new Date().toISOString();

// ── 1. KPIs ───────────────────────────────────────────────────────────────────

const totalProducts       = revenueProducts.length || predictive.length;
const cashMaxProducts     = revenueProducts.filter(p=>(p.revenueOSScore??0)>=80).length;
const growthProducts      = revenueProducts.filter(p=>(p.revenueOSScore??0)>=50&&(p.revenueOSScore??0)<80).length;
const topRetailer         = retailers[0] ?? { name:'—', retailerScore:0 };
const avgRetentionScore   = retentionSegs.reduce((s,r)=>s+(r.retentionScore??50),0)/Math.max(1,retentionSegs.length);
const estimatedMonthlyRev = revenueProducts.filter(p=>(p.revenueOSScore??0)>=60).length * 0.5; // €0.50 per high-rev product/month proxy

const kpis = [
  { id:'total-products',     name:'Produits suivis',              value:totalProducts,                        unit:'produits',   trend:'stable',  impact:'info' },
  { id:'cash-max-products',  name:'Produits cash-max',            value:cashMaxProducts,                       unit:'produits',   trend:'up',      impact:'high' },
  { id:'growth-products',    name:'Produits growth',              value:growthProducts,                        unit:'produits',   trend:'stable',  impact:'medium' },
  { id:'top-retailer',       name:'Enseigne #1',                  value:topRetailer.name,                     unit:'',           trend:'stable',  impact:'info' },
  { id:'top-retailer-score', name:'Score enseigne #1',            value:topRetailer.retailerScore??0,          unit:'/100',       trend:'up',      impact:'medium' },
  { id:'avg-retention',      name:'Score rétention moyen',        value:Math.round(avgRetentionScore),         unit:'/100',       trend:'stable',  impact:'medium' },
  { id:'est-monthly-rev',    name:'Revenu affilié estimé (mois)', value:parseFloat(estimatedMonthlyRev.toFixed(2)), unit:'€',   trend:'up',      impact:'high' },
  { id:'indexed-territories',name:'Territoires couverts',         value:5,                                     unit:'territoires',trend:'stable',  impact:'info' },
];

// ── 2. Risks ──────────────────────────────────────────────────────────────────

const risks = [];

if (cashMaxProducts === 0) risks.push({ id:'risk-no-cash-max', type:'revenue', severity:'critical', title:'Aucun produit cash-max', description:'Aucun produit n\'atteint le seuil de 80 pour Revenue OS. Trafic insuffisant ou delta trop faible.', action:'Relancer le scraping + vérifier les sources de prix' });
if (totalProducts < 10)    risks.push({ id:'risk-low-coverage', type:'data', severity:'high', title:'Couverture produits faible', description:`Seulement ${totalProducts} produits suivis. Cible : 100+.`, action:'Ajouter des sources de prix ou élargir les territoires' });
if (avgRetentionScore < 60) risks.push({ id:'risk-low-retention', type:'retention', severity:'medium', title:'Rétention utilisateur faible', description:`Score rétention moyen : ${Math.round(avgRetentionScore)}/100.`, action:'Activer push personnalisés et favoris' });
if (retailers.length === 0) risks.push({ id:'risk-no-retailer-data', type:'data', severity:'medium', title:'Aucune donnée enseigne', description:'Impossible de scorer les enseignes sans événements de clic.', action:'Activer le tracking eventTracker côté front' });

if (risks.length === 0) risks.push({ id:'risk-none', type:'operational', severity:'low', title:'Aucun risque critique détecté', description:'Système stable. Continuer la surveillance.', action:'Maintenir le pipeline actuel' });

// ── 3. Decisions ──────────────────────────────────────────────────────────────

const seenDecisions = new Set();
const decisions = [];

function addDecision(id, priority, category, title, rationale, actions) {
  if (seenDecisions.has(id)) return;
  seenDecisions.add(id);
  decisions.push({ id, priority, category, title, rationale, actions, generatedAt:ts });
}

if (cashMaxProducts < 5)   addDecision('d-boost-content','critical','content','Créer du contenu sur les top produits revenue','Peu de produits cash-max = manque de contenu ou de visibilité',['Générer pages SEO /comparateur pour les top 10 produits','Activer push pour ces produits','Planifier posts sociaux']);
if (totalProducts < 50)    addDecision('d-expand-scraping','high','data','Élargir le scraping produits','Couverture insuffisante pour identifier toutes les opportunités',['Ajouter 2+ sources de prix','Cibler les catégories à forte tension']);
if (retailers.length < 3)  addDecision('d-track-retailers','high','tracking','Activer le tracking enseignes','Sans données de clic, impossible de scorer les enseignes',['Déployer eventTracker.ts côté front','Exporter les events régulièrement']);
addDecision('d-b2b-outreach','medium','revenue','Initier démarche B2B','Le système est mature, il est temps de contacter des enseignes partenaires',['Envoyer proposition Starter à 3 enseignes locales','Préparer deck B2B avec données territories']);
addDecision('d-social-blast','medium','distribution','Activer la distribution sociale','Les contenus growth sont générés mais peu distribués',['Planifier 10 posts/semaine sur les top deals','Activer le workflow social-blast']);

decisions.sort((a,b) => { const o={critical:0,high:1,medium:2,low:3}; return (o[a.priority]??4)-(o[b.priority]??4); });

// ── 4. Platform health ────────────────────────────────────────────────────────

const trafficScore  = Math.min(100, (totalProducts/100)*50 + (retailers.length/10)*50);
const revenueScore  = Math.min(100, (cashMaxProducts/20)*100);
const retentionScore = Math.min(100, avgRetentionScore);
const dataScore     = Math.min(100, (totalProducts/100)*100);
const stabilityScore = risks.filter(r=>r.severity==='critical').length===0 ? 80 : 40;

const overallHealth = Math.round(trafficScore*0.25 + revenueScore*0.30 + retentionScore*0.20 + dataScore*0.15 + stabilityScore*0.10);

const platformHealth = {
  overallScore: Math.min(100, overallHealth),
  status: overallHealth>=75?'healthy':overallHealth>=50?'warning':'critical',
  dimensions: {
    traffic:   Math.round(trafficScore),
    revenue:   Math.round(revenueScore),
    retention: Math.round(retentionScore),
    data:      Math.round(dataScore),
    stability: Math.round(stabilityScore),
  },
  summary: overallHealth>=75 ? 'Plateforme opérationnelle. Continuer à scaler.' : overallHealth>=50 ? 'Plateforme fonctionnelle. Actions prioritaires identifiées.' : 'Attention requise. Plusieurs risques actifs.',
};

const write = (n,d) => { writeFileSync(resolve(OUT_DIR,n),JSON.stringify(d,null,2),'utf8'); console.log(`✅ ${n}`); };
write('executive-kpis.json',      { generatedAt:ts, count:kpis.length,       kpis });
write('executive-risks.json',     { generatedAt:ts, count:risks.length,      risks });
write('executive-decisions.json', { generatedAt:ts, count:decisions.length,  decisions });
write('platform-health.json',     { generatedAt:ts, ...platformHealth });
console.log(`\n🏁 Executive OS exports done — health: ${platformHealth.overallScore}/100 (${platformHealth.status})`);
