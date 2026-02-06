import { Request, Response } from 'express';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import admin from 'firebase-admin';

// ===============================
// INIT GOOGLE VISION + FIREBASE
// ===============================
const visionClient = new ImageAnnotatorClient();

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ===============================
// POST /api/ocr-ticket
// ===============================
/**
 * Analyse OCR d’un ticket stocké dans Firebase Storage
 * Entrée :
 *  - ticketId (Firestore)
 *  - fileUrl (URL signée ou gs://)
 */
export async function ocrTicket(req: Request, res: Response) {
  try {
    const { ticketId, fileUrl } = req.body;

    if (!ticketId || !fileUrl) {
      return res.status(400).json({
        error: 'ticketId et fileUrl requis'
      });
    }

    // ===============================
    // 1️⃣ OCR GOOGLE VISION
    // ===============================
    const [result] = await visionClient.textDetection(fileUrl);
    const fullText = result.fullTextAnnotation?.text || '';

    if (!fullText) {
      return res.status(422).json({
        error: 'Aucun texte détecté sur le ticket'
      });
    }

    // ===============================
    // 2️⃣ PARSING SIMPLE (SAFE)
    // ===============================
    const lines = fullText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    // Heuristiques simples (évolutives)
    const detectedStore =
      lines.find(l =>
        /carrefour|leclerc|super\s*u|intermarché|casino/i.test(l)
      ) || null;

    const detectedDate =
      lines.find(l =>
        /\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/.test(l)
      ) || null;

    const priceLines = lines.filter(l =>
      /\d+[,.]\d{2}\s?€?/.test(l)
    );

    const prices = priceLines.map(l => {
      const match = l.match(/(\d+[,.]\d{2})/);
      return match ? Number(match[1].replace(',', '.')) : null;
    }).filter(Boolean);

    const total =
      prices.length > 0
        ? Math.max(...prices)
        : null;

    // ===============================
    // 3️⃣ STRUCTURE OCR NORMALISÉE
    // ===============================
    const ocrResult = {
      rawText: fullText,
      detected: {
        store: detectedStore,
        date: detectedDate,
        total
      },
      extractedPrices: prices,
      parsedAt: admin.firestore.FieldValue.serverTimestamp(),
      confidence: 'auto',
      status: 'ocr_done'
    };

    // ===============================
    // 4️⃣ SAUVEGARDE FIRESTORE
    // ===============================
    await db.collection('tickets').doc(ticketId).update({
      ocr: ocrResult,
      status: 'processed',
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // ===============================
    // 5️⃣ RÉPONSE API
    // ===============================
    return res.json({
      success: true,
      ticketId,
      ocr: {
        store: detectedStore,
        date: detectedDate,
        total
      }
    });

  } catch (error) {
    console.error('OCR ERROR:', error);
    return res.status(500).json({
      error: 'Erreur OCR',
      message: (error as any)?.message
    });
  }
}