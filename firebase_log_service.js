
// firebase_log_service.js

import { db } from './firebase_config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Enregistre un message dans Firestore
 * @param {string} from - 'user' ou 'ia'
 * @param {string} text - contenu du message
 * @param {string} language - langue utilisée
 */
export async function logMessage(from, text, language) {
  try {
    await addDoc(collection(db, 'chat_logs'), {
      from,
      text,
      language,
      timestamp: Timestamp.now()
    });
  } catch (e) {
    console.error('Erreur enregistrement Firestore :', e);
  }
}
