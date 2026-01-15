#!/usr/bin/env node

/**
 * Script de mise à jour automatique des actualités
 * A KI PRI SA YÉ - Actualités prix & consommation DOM
 * 
 * Usage:
 *   node scripts/update-news.js
 * 
 * Ce script peut être:
 * - Lancé manuellement
 * - Intégré dans un cron job
 * - Appelé par GitHub Actions
 * - Déclenché par un webhook
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_FILE = path.join(__dirname, '../public/data/actualites.json');

console.log('📰 A KI PRI SA YÉ - Mise à jour des actualités');
console.log('================================================\n');

/**
 * Fonction pour ajouter une nouvelle actualité
 * @param {Object} article - Nouvelle actualité
 */
export function addArticle(article) {
  try {
    // Lire le fichier actuel
    const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
    
    // Vérifier que l'article n'existe pas déjà (par ID)
    const exists = data.articles.some(a => a.id === article.id);
    if (exists) {
      console.log(`⚠️  Article ${article.id} existe déjà`);
      return false;
    }
    
    // Ajouter le nouvel article au début
    data.articles.unshift(article);
    
    // Limiter à 20 articles max (garder les plus récents)
    if (data.articles.length > 20) {
      data.articles = data.articles.slice(0, 20);
    }
    
    // Mettre à jour la date de dernière modification
    data.lastUpdated = new Date().toISOString();
    
    // Sauvegarder
    fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`✅ Article ajouté: ${article.title}`);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout:', error.message);
    return false;
  }
}

/**
 * Fonction pour supprimer les articles trop anciens
 * @param {number} daysOld - Supprimer les articles de plus de X jours
 */
export function cleanOldArticles(daysOld = 90) {
  try {
    const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const initialCount = data.articles.length;
    data.articles = data.articles.filter(article => {
      const articleDate = new Date(article.date);
      return articleDate >= cutoffDate;
    });
    
    const removed = initialCount - data.articles.length;
    if (removed > 0) {
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
      console.log(`🗑️  ${removed} article(s) ancien(s) supprimé(s)`);
    }
    
    return removed;
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    return 0;
  }
}

/**
 * Fonction pour mettre à jour la date de dernière modification
 */
export function updateTimestamp() {
  try {
    const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ Timestamp mis à jour');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

/**
 * Fonction pour lister les actualités
 */
export function listArticles() {
  try {
    const data = JSON.parse(fs.readFileSync(NEWS_FILE, 'utf8'));
    console.log(`\n📋 ${data.articles.length} actualité(s) dans la base:\n`);
    
    data.articles.forEach((article, index) => {
      console.log(`${index + 1}. [${article.date}] ${article.icon} ${article.title}`);
      console.log(`   Territory: ${article.territory} | Category: ${article.category}`);
    });
    
    console.log(`\n⏱️  Dernière mise à jour: ${data.lastUpdated}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// ============================================
// EXEMPLE D'UTILISATION
// ============================================

// Commande passée via arguments
const command = process.argv[2];

switch (command) {
  case 'list': {
    listArticles();
    break;
  }
  case 'clean': {
    const days = parseInt(process.argv[3]) || 90;
    console.log(`🧹 Nettoyage des articles > ${days} jours...\n`);
    cleanOldArticles(days);
    break;
  }
  case 'add': {
    // Exemple: node scripts/update-news.js add
    // Pour une vraie automatisation, il faudrait:
    // 1. Scraper des sources RSS autorisées (Insee, DGCCRF, etc.)
    // 2. Utiliser une API de news
    // 3. Recevoir des webhooks
    console.log('ℹ️  Pour ajouter un article, modifier ce script ou utiliser l\'API');
    break;
  }
  case 'update-timestamp': {
    updateTimestamp();
    break;
  }
  default: {
    console.log('Usage:');
    console.log('  node scripts/update-news.js list              - Lister les actualités');
    console.log('  node scripts/update-news.js clean [days]      - Nettoyer articles anciens');
    console.log('  node scripts/update-news.js update-timestamp  - MAJ timestamp');
    console.log('  node scripts/update-news.js add               - Ajouter un article');
    console.log('\n📖 Voir README_AUTOMATISATION.md pour plus d\'infos\n');
    
    // Par défaut, lister
    listArticles();
}

// Script principal si lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  handleCommand(command);
}

function handleCommand(command) {
  switch (command) {
    case 'list': {
      listArticles();
      break;
    }
    case 'clean': {
      const days = parseInt(process.argv[3]) || 90;
      console.log(`🧹 Nettoyage des articles > ${days} jours...\n`);
      cleanOldArticles(days);
      break;
    }
    case 'add': {
      console.log('ℹ️  Pour ajouter un article, modifier ce script ou utiliser l\'API');
      break;
    }
    case 'update-timestamp': {
      updateTimestamp();
      break;
    }
    default: {
      console.log('Usage:');
      console.log('  node scripts/update-news.js list              - Lister les actualités');
      console.log('  node scripts/update-news.js clean [days]      - Nettoyer articles anciens');
      console.log('  node scripts/update-news.js update-timestamp  - MAJ timestamp');
      console.log('  node scripts/update-news.js add               - Ajouter un article');
      console.log('\n📖 Voir README_AUTOMATISATION.md pour plus d\'infos\n');
      
      // Par défaut, lister
      listArticles();
      break;
    }
  }
}
