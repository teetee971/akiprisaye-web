import admin from 'firebase-admin';
import vision from '@google-cloud/vision';

// Client OCR Google Vision
const client = new vision.ImageAnnotatorClient();

const db = admin.firestore();
const bucket = admin.storage().bucket();

/**
 * Traite un ticket stocké et extrait les lignes de prix
 */
export async function processTicketOCR(ticketId: string) {
  const ticketRef = db.collection('tickets').doc(ticketId);
  const ticketSnap = await ticketRef.get();

  if (!ticketSnap.exists) {
    throw new Error('Ticket introuvable');
  }

  const ticket = ticketSnap.data();
  if (!ticket?.file?.path) {
    throw new Error('Fichier manquant');
  }

  // 1️⃣ OCR IMAGE
  const file = bucket.file(ticket.file.path);
  const [buffer] = await file.download();

  const [result] = await client.textDetection({
    image: { content: buffer }
  });

  const fullText = result.fullTextAnnotation?.text || '';

  // 2️⃣ PARSING SIMPLE (robuste & évolutif)
  const lines = fullText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

  // 3️⃣ EXTRACTION PRIX (heuristique simple)
  const extractedPrices = lines
    .map(line => {
      const match = line.match(/(.+?)\s+(\d+[,.]\d{2})/);
      if (!match) return null;

      return {
        rawLabel: match[1],
        price: parseFloat(match[2].replace(',', '.')),
        currency: 'EUR'
      };
    })
    .filter(Boolean);

  // 4️⃣ SAUVEGARDE FIRESTORE
  await ticketRef.update({
    status: 'processed',
    ocrText: fullText,
    extractedPrices,
    processedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    ticketId,
    extractedPricesCount: extractedPrices.length
  };
}