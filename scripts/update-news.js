#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * update-news.js
 * Script Node.js SAFE
 * - Aucun code navigateur
 * - Aucun JSX
 * - Aucun import externe
 * - Compatible ESLint / CI / Termux
 */

const fs = require('fs');
const path = require('path');

const NEWS_FILE = path.join(process.cwd(), 'public', 'data', 'news.json');
const MAX_ITEMS = 50;

function log(msg) {
  console.log(`[update-news] ${msg}`);
}

function ensureDir(file) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadNews() {
  if (!fs.existsSync(NEWS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveNews(items) {
  ensureDir(NEWS_FILE);
  fs.writeFileSync(NEWS_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function addNews() {
  const news = loadNews();
  news.unshift({
    id: `news-${Date.now()}`,
    title: 'Mise à jour automatique',
    description: 'Actualisation des données effectuée.',
    date: new Date().toISOString(),
    source: 'system',
  });
  saveNews(news.slice(0, MAX_ITEMS));
  log('News ajoutée');
}

function listNews() {
  loadNews().forEach((n) =>
    console.log(`- ${n.date} | ${n.title}`)
  );
}

function cleanNews(days = 90) {
  const limit = Date.now() - days * 86400000;
  const filtered = loadNews().filter(
    (n) => new Date(n.date).getTime() >= limit
  );
  saveNews(filtered);
  log(`Nettoyage effectué (${filtered.length} éléments restants)`);
}

function main() {
  const cmd = process.argv[2];

  switch (cmd) {
    case 'list':
      listNews();
      break;
    case 'clean':
      cleanNews(Number(process.argv[3]) || 90);
      break;
    default:
      addNews();
  }
}

try {
  main();
  process.exit(0);
} catch (e) {
  console.error(e);
  process.exit(1);
}