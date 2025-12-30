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
async function extractTextFromImage(imageBuffer) {
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
    
    // TODO: PRODUCTION ENHANCEMENTS
    // 1. Save receipt to Firebase Storage
    // 2. Save receipt data to Firestore /receipts collection
    // 3. Update prices in /prices collection (with verification workflow)
    // 4. Link to user account if authenticated
    // 5. Calculate confidence scores for extracted data
    // 6. Queue for manual verification if confidence < 80%
    
    return new Response(JSON.stringify({
      success: true,
      data: receiptData,
      message: 'Receipt processed successfully',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Don't cache OCR results
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error in /api/ocr:', error);
    
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
