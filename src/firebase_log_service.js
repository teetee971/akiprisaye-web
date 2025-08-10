import { db } from './firebase_config.js';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

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
