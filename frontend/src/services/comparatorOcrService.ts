/**
 * Comparator OCR Service
 * 
 * Enhanced OCR service for comparator infrastructure with intelligent parsing.
 * Wraps the existing ocrService.ts with additional parsing capabilities for:
 * - Invoices
 * - Receipts
 * - Lists
 * - ID cards
 * - Generic documents
 */

import { runOCR } from './ocrService';
import type { OCRResult as BaseOCRResult } from './ocrService';
import type { 
  OCRResult, 
  InvoiceParsed, 
  ReceiptParsed 
} from '../types/comparatorCommon';

/**
 * Document types supported by OCR scanner
 */
export type DocumentType = 
  | 'invoice'      // Facture
  | 'list'         // Liste
  | 'receipt'      // Ticket de caisse
  | 'id_card'      // Carte d'identité
  | 'generic';     // Document générique

/**
 * Extract text from an image file
 * 
 * @param file - Image file to process
 * @param language - OCR language (default: 'fra')
 * @returns OCR result with extracted text
 */
export async function extractTextFromImageFile(
  file: File,
  language: string = 'fra'
): Promise<OCRResult> {
  // Convert File to URL for the existing OCR service
  const imageUrl = URL.createObjectURL(file);
  
  try {
    const result = await runOCR(imageUrl, language);
    
    return {
      text: result.rawText,
      confidence: result.confidence,
      language,
      structured: undefined,
    };
  } catch (error) {
    // Clean up on error
    URL.revokeObjectURL(imageUrl);
    throw error;
  } finally {
    // Clean up the object URL
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Extract text from PDF file
 * 
 * @param file - PDF file to process
 * @returns OCR result with extracted text
 */
export async function extractTextFromPDF(file: File): Promise<OCRResult> {
  // For now, we'll use the same image processing
  // In the future, we could use pdf.js for better PDF support
  return extractTextFromImageFile(file);
}

/**
 * Parse invoice text to extract structured data
 * 
 * @param text - Raw text from OCR
 * @returns Parsed invoice data
 */
export function parseInvoice(text: string): InvoiceParsed {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const invoice: InvoiceParsed = {
    supplier: '',
    totalAmount: 0,
    date: '',
    items: [],
  };
  
  // Extract supplier (usually at the top)
  if (lines.length > 0) {
    invoice.supplier = lines[0];
  }
  
  // Extract date (look for date patterns)
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      invoice.date = match[1];
      break;
    }
  }
  
  // Extract total amount (look for "total", "montant", etc.)
  const totalPattern = /(?:total|montant|ttc|à payer)[\s:]*(\d+[,\.]\d{2})/i;
  for (const line of lines) {
    const match = line.match(totalPattern);
    if (match) {
      invoice.totalAmount = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  // Extract items (look for price patterns)
  const itemPattern = /(.+?)\s+(\d+[,\.]\d{2})\s*€?/;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      const name = match[1].trim();
      const price = parseFloat(match[2].replace(',', '.'));
      
      // Skip if it looks like a total line
      if (!/total|montant|ttc/i.test(name)) {
        invoice.items.push({ name, price });
      }
    }
  }
  
  return invoice;
}

/**
 * Parse list text (line by line)
 * 
 * @param text - Raw text from OCR
 * @returns Array of items (one per line)
 */
export function parseList(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.length > 0);
}

/**
 * Parse receipt text to extract structured data
 * 
 * @param text - Raw text from OCR
 * @returns Parsed receipt data
 */
export function parseReceipt(text: string): ReceiptParsed {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  const receipt: ReceiptParsed = {
    store: '',
    date: '',
    items: [],
    total: 0,
  };
  
  // Extract store name (usually at the top)
  if (lines.length > 0) {
    receipt.store = lines[0];
  }
  
  // Extract date
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
  for (const line of lines) {
    const match = line.match(datePattern);
    if (match) {
      receipt.date = match[1];
      break;
    }
  }
  
  // Extract items with quantity and price
  // Format: "Product Name x 2 4.50"
  const itemPattern = /(.+?)\s+(?:x\s*)?(\d+)?\s+(\d+[,\.]\d{2})\s*€?/;
  for (const line of lines) {
    const match = line.match(itemPattern);
    if (match) {
      const name = match[1].trim();
      const quantity = match[2] ? parseInt(match[2], 10) : 1;
      const price = parseFloat(match[3].replace(',', '.'));
      
      // Skip if it looks like a total line
      if (!/total|montant|ttc/i.test(name)) {
        receipt.items.push({ name, price, quantity });
      }
    }
  }
  
  // Extract total
  const totalPattern = /(?:total|montant|ttc)[\s:]*(\d+[,\.]\d{2})/i;
  for (const line of lines) {
    const match = line.match(totalPattern);
    if (match) {
      receipt.total = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  return receipt;
}

/**
 * Process document with intelligent parsing based on type
 * 
 * @param file - File to process
 * @param documentType - Type of document
 * @param language - OCR language
 * @returns OCR result with structured data
 */
export async function processDocument(
  file: File,
  documentType: DocumentType,
  language: string = 'fra'
): Promise<OCRResult> {
  const result = await extractTextFromImageFile(file, language);
  
  // Parse based on document type
  switch (documentType) {
    case 'invoice':
      result.structured = parseInvoice(result.text);
      break;
    case 'list':
      result.structured = parseList(result.text);
      break;
    case 'receipt':
      result.structured = parseReceipt(result.text);
      break;
    case 'id_card':
    case 'generic':
    default:
      // No special parsing for generic documents
      break;
  }
  
  return result;
}

/**
 * Validate OCR result quality
 * 
 * @param result - OCR result to validate
 * @param minConfidence - Minimum confidence threshold (0-100)
 * @returns true if result meets quality criteria
 */
export function validateOCRResult(
  result: OCRResult,
  minConfidence: number = 60
): boolean {
  return (
    result.text.length > 0 &&
    result.confidence >= minConfidence
  );
}

/**
 * Clean OCR text (remove extra whitespace, fix common errors)
 * 
 * @param text - Text to clean
 * @returns Cleaned text
 */
export function cleanOCRText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n')  // Multiple newlines to single
    .replace(/[|]/g, 'l')  // Common OCR error: | to l
    .replace(/[0O]/g, (match) => {
      // Context-aware 0/O correction could go here
      return match;
    })
    .trim();
}
