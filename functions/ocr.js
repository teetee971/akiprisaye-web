/**
 * Backend Function: OCR
 * Cloudflare Pages Function: /functions/ocr.js
 * 
 * Processes receipt images using OCR (Tesseract.js or Google Vision API)
 * Extracts product names, prices, and EAN codes
 * 
 * @param {FormData} image - Receipt image file
 * @returns {Object} Extracted data: products, total, store, date
 */

import { logInfo, logWarn, logError } from './utils/logger.js';
import { saveReceipt } from './utils/firestore.js';

/**
 * Validate image file
 * @param {File} file - Uploaded file
 * @returns {boolean} True if valid image
 */
function validateImage(file) {
  if (!file) return false;
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
}

/**
 * Extract text from image using OCR
 * NOTE: This is a placeholder. In production, use:
 * - Google Vision API for best accuracy
 * - Tesseract.js for client-side processing
 * - Azure Computer Vision as alternative
 * 
 * @param {ArrayBuffer} imageBuffer - Image data
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(_imageBuffer) {
  // TODO: PRODUCTION IMPLEMENTATION
  // 
  // Option 1: Google Vision API (Recommended for server-side)
  // const vision = require('@google-cloud/vision');
  // const client = new vision.ImageAnnotatorClient();
  // const [result] = await client.textDetection(imageBuffer);
  // return result.fullTextAnnotation.text;
  //
  // Option 2: Tesseract.js (Good for client-side)
  // const { createWorker } = require('tesseract.js');
  // const worker = await createWorker();
  // await worker.loadLanguage('fra');
  // await worker.initialize('fra');
  // const { data: { text } } = await worker.recognize(imageBuffer);
  // await worker.terminate();
  // return text;
  
  // Mock response for development
  return `
SUPERMARCHÉ CARAIBES
123 Rue Example, 97110 Pointe-à-Pitre
Date: 09/11/2025 14:30
Ticket #: 12345

Produits:
Pain de mie 500g        3901234567890    2.50 EUR
Lait demi-écrémé 1L     3245678901234    1.85 EUR
Yaourt nature x4        3456789012345    2.30 EUR
Huile d'olive 750ml     3567890123456    5.99 EUR
Bananes (kg)                             2.15 EUR
Tomates (kg)                             3.50 EUR

SOUS-TOTAL                               18.29 EUR
TVA 2.1%                                  0.38 EUR
TOTAL                                    18.67 EUR

Carte bancaire: **** 1234
Merci de votre visite!
  `.trim();
}

/**
 * Calculate confidence score for OCR results
 * @param {Object} receiptData - Parsed receipt data
 * @returns {number} Confidence score (0-100)
 */
function calculateConfidenceScore(receiptData) {
  let score = 0;
  const weights = {
    store: 20,
    date: 15,
    total: 25,
    items: 30,
    structure: 10,
  };
  
  // Check if store name is identified
  if (receiptData.store && receiptData.store.length > 2) {
    score += weights.store;
  }
  
  // Check if date is valid
  if (receiptData.date && !isNaN(Date.parse(receiptData.date))) {
    score += weights.date;
  }
  
  // Check if total is valid
  if (receiptData.total && receiptData.total > 0) {
    score += weights.total;
  }
  
  // Check if items are extracted
  if (receiptData.items && receiptData.items.length > 0) {
    const itemsScore = Math.min(receiptData.items.length / 10, 1) * weights.items;
    score += itemsScore;
  }
  
  // Check structure quality
  if (receiptData.items && receiptData.items.length > 0) {
    const validItems = receiptData.items.filter(item => 
      item.name && item.price && item.price > 0
    );
    const structureScore = (validItems.length / receiptData.items.length) * weights.structure;
    score += structureScore;
  }
  
  return Math.round(score);
}

/**
 * Parse receipt text and extract structured data
 * @param {string} text - OCR extracted text
 * @returns {Object} Structured receipt data
 */
function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  // Extract basic info
  const products = [];
  let total = null;
  let storeName = null;
  let date = null;
  
  // Simple patterns (should be enhanced in production)
  const eanPattern = /\b\d{8,14}\b/;
  const pricePattern = /(\d+[.,]\d{2})\s*(EUR|€)/i;
  const totalPattern = /TOTAL\s*:?\s*(\d+[.,]\d{2})/i;
  const datePattern = /(\d{2}[/-]\d{2}[/-]\d{4})/;
  
  // Extract store name (usually first line)
  if (lines.length > 0) {
    storeName = lines[0];
  }
  
  // Extract date
  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      date = dateMatch[1];
      break;
    }
  }
  
  // Extract total
  for (const line of lines) {
    const totalMatch = line.match(totalPattern);
    if (totalMatch) {
      total = parseFloat(totalMatch[1].replace(',', '.'));
      break;
    }
  }
  
  // Extract products
  for (const line of lines) {
    const eanMatch = line.match(eanPattern);
    const priceMatch = line.match(pricePattern);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(',', '.'));
      const ean = eanMatch ? eanMatch[0] : null;
      
      // Try to extract product name (text before EAN or price)
      let name = line;
      if (eanMatch) {
        name = line.substring(0, line.indexOf(eanMatch[0])).trim();
      } else if (priceMatch) {
        name = line.substring(0, line.indexOf(priceMatch[0])).trim();
      }
      
      if (name && !name.match(/TOTAL|SOUS-TOTAL|TVA|CARTE/i)) {
        products.push({
          name: name,
          ean: ean,
          price: price,
          unit: 'unité',
        });
      }
    }
  }
  
  return {
    storeName,
    date,
    products,
    total,
    itemCount: products.length,
    rawText: text,
  };
}

/**
 * Main handler for POST /api/ocr
 */
export async function onRequestPost(context) {
  try {
    const { request } = context;
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({
        error: 'Invalid content type',
        message: 'Expected multipart/form-data',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const formData = await request.formData();
    const imageFile = formData.get('image') || formData.get('ticket');
    
    if (!imageFile) {
      return new Response(JSON.stringify({
        error: 'Missing image file',
        message: 'Please provide an image file in the "image" or "ticket" field',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    if (!validateImage(imageFile)) {
      return new Response(JSON.stringify({
        error: 'Invalid image file',
        message: 'Image must be JPEG, PNG, or WebP and less than 10MB',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Convert to buffer for OCR processing
    const imageBuffer = await imageFile.arrayBuffer();
    
    // Extract text using OCR
    const extractedText = await extractTextFromImage(imageBuffer);
    
    // Parse receipt data
    const receiptData = parseReceiptText(extractedText);
    
    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(receiptData);
    
    // Add metadata
    const enrichedReceiptData = {
      ...receiptData,
      confidence: confidenceScore,
      needsVerification: confidenceScore < 80,
      processedAt: new Date().toISOString(),
    };
    
    // Save to Firestore if confidence is acceptable
    try {
      if (confidenceScore >= 50) {
        const receiptId = await saveReceipt(enrichedReceiptData);
        
        logInfo('Receipt processed and saved', {
          receiptId,
          confidence: confidenceScore,
          itemCount: receiptData.items?.length || 0,
        });
        
        enrichedReceiptData.id = receiptId;
      } else {
        logWarn('Receipt confidence too low, not saving to Firestore', {
          confidence: confidenceScore,
        });
      }
    } catch (firestoreError) {
      logError('Failed to save receipt to Firestore', firestoreError);
      // Continue anyway - user still gets OCR results
    }
    
    // TODO: PRODUCTION ENHANCEMENTS (Next Phase)
    // 1. Upload receipt image to Firebase Storage for archival
    // 2. Implement verification workflow for prices with confidence < 80%
    // 3. Queue receipts for manual verification if confidence < 80%
    // 4. Update prices in /prices collection after admin approval
    // 5. Link to user account if authenticated (request.auth)
    // 6. Send notification to user when receipt is processed
    
    return new Response(JSON.stringify({
      success: true,
      data: enrichedReceiptData,
      message: confidenceScore >= 80 
        ? 'Receipt processed successfully'
        : 'Receipt processed with low confidence - may require verification',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Don't cache OCR results
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    logError('Error in /api/ocr:', error);
    
    return new Response(JSON.stringify({
      error: 'OCR processing failed',
      message: error.message,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * CORS preflight handler
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
