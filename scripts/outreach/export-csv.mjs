#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inPath = path.join(__dirname, 'outreach-generated.json');

if (!fs.existsSync(inPath)) {
  console.error('Run generate-outreach.mjs first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const header = 'domain,name,territory,type,status,targetPage,subject';
const rows = data.map(r =>
  [r.domain, r.name, r.territory, r.type, r.status, r.targetPage, `"${r.subject}"`].join(',')
);
const csv = [header, ...rows].join('\n');
const outPath = path.join(__dirname, 'outreach-export.csv');
fs.writeFileSync(outPath, csv);
console.log(`✔ Exported ${data.length} rows → ${outPath}`);
