/**
 * ticket-ocr-processor.js
 *
 * OCR + Extraction intelligente des produits du ticket
 * Utilisé par upload-ticket.html
 */

import { getDB } from '../firebase-config.js';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 🔥 Charger Tesseract automatiquement
import Tesseract from 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js';

/**
 * Détection simple du nom du produit + prix sur une ligne OCR
 */
function parseLine(line) {
  const priceRegex = /(\d+[.,]\d{2})$/;
  const match = line.match(priceRegex);
  if (!match) return null;

  const price = parseFloat(match[1].replace(',', '.'));
  const name = line.replace(priceRegex, '').trim();

  return { name, price };
}

/**
 * Catégorisation simple selon le nom d’article
 */
function detectCategory(name) {
  const lower = name.toLowerCase();

  if (lower.includes('eau') || lower.includes('cristaline')) return 'boisson';
  if (lower.includes('riz') || lower.includes('pâte')) return 'épicerie';
  if (lower.includes('poulet') || lower.includes('viande')) return 'viande';
  if (lower.includes('banane') || lower.includes('pomme')) return 'fruit';
  if (lower.includes('lait') || lower.includes('yaourt')) return 'laitier';
  if (lower.includes('lessive') || lower.includes('savon')) return 'hygiène';

  return 'autre';
}

/**
 * 🔥 Analyse OCR complète d’un ticket
 */
export async function processTicketImage(file, userId = 'anonymous') {
  const ocr = await Tesseract.recognize(file, 'fra');
  const lines = ocr.data.text.split('\n').map((l) => l.trim()).filter(Boolean);

  const items = [];

  for (const line of lines) {
    const item = parseLine(line);
    if (!item) continue;

    item.category = detectCategory(item.name);
    items.push(item);
  }

  const total = items.reduce((sum, i) => sum + i.price, 0);

  const result = {
    userId,
    items,
    total,
    itemCount: items.length,
    createdAt: Date.now(),
  };

  // 🔥 Sauvegarde dans Firestore (historique utilisateur)
  const db = await getDB();
  await addDoc(collection(db, 'purchaseHistory'), {
    ...result,
    serverTime: serverTimestamp(),
  });

  console.info('[OCR] Ticket analysé :', result);
  return result;
}