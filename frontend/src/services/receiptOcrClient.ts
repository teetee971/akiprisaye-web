import { runOCR } from './ocrService';

export interface NormalizedReceiptItem {
  label: string;
  qty?: number;
  unit?: string;
  priceCents: number;
  ean?: string;
  confidence: number;
}

export interface NormalizedReceiptPayload {
  retailer: string;
  storeLabel?: string;
  purchasedAt?: string;
  territory: 'fr' | 'gp' | 'mq';
  currency: 'EUR';
  items: NormalizedReceiptItem[];
  totals?: {
    totalCents?: number;
  };
  confidence: number;
  redactedText: string;
  ocrText: string;
}

const PII_PATTERNS: RegExp[] = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g,
  /\b(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}\b/g,
  /\b(?:\d{4}[\s.-]?){3}\d{4}\b/g,
  /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi,
  /\b\d{1,4}\s+[A-Za-zÀ-ÿ'\-\s]{3,}(?:rue|avenue|av\.?|impasse|lotissement|boulevard|bd\.?|chemin)\b/gi,
  /\b(?:carte\s+fid[ée]lit[ée]|fid[ée]lit[ée]|n[°o]\s*client)\s*[:#-]?\s*[A-Z0-9\-]{4,}\b/gi,
];

const RETAILER_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /carrefour(?:\s+market|\s+express)?/i, name: 'carrefour' },
  { pattern: /e?\.?\s*leclerc/i, name: 'leclerc' },
  { pattern: /inter\s*march[ée]/i, name: 'intermarché' },
  { pattern: /super\s*u|hyper\s*u/i, name: 'superu' },
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function redactPII(text: string): string {
  return PII_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, '[REDACTED]'), text);
}

function parsePriceToCents(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

function detectRetailer(lines: string[]): string {
  const header = lines.slice(0, 12).join('\n');
  for (const entry of RETAILER_PATTERNS) {
    if (entry.pattern.test(header)) {
      return entry.name;
    }
  }

  return 'unknown';
}

function detectPurchasedAt(text: string): string | undefined {
  const match = text.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) {
    return undefined;
  }

  const date = `${match[3]}-${match[2]}-${match[1]}`;
  if (!match[4] || !match[5]) {
    return `${date}T00:00:00.000Z`;
  }

  return `${date}T${match[4]}:${match[5]}:00.000Z`;
}

function parseLineAsItem(line: string): NormalizedReceiptItem | null {
  const cleaned = normalizeWhitespace(line);
  if (cleaned.length < 4) {
    return null;
  }

  if (/^(total|tva|cb|carte|paiement|rendu|a\s+r[eé]gler)/i.test(cleaned)) {
    return null;
  }

  const priceMatch = cleaned.match(/(\d{1,4}(?:[\s.,]\d{2}))\s*(?:€|eur)?$/i);
  if (!priceMatch) {
    return null;
  }

  const priceCents = parsePriceToCents(priceMatch[1]);
  if (!priceCents) {
    return null;
  }

  const label = normalizeWhitespace(cleaned.slice(0, cleaned.length - priceMatch[0].length));
  if (label.length < 2) {
    return null;
  }

  const qtyMatch = label.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|x)\b/i);
  const qty = qtyMatch ? Number.parseFloat(qtyMatch[1].replace(',', '.')) : undefined;
  const unit = qtyMatch ? qtyMatch[2].toLowerCase() : undefined;

  return {
    label,
    qty,
    unit,
    priceCents,
    confidence: 0.75,
  };
}

export function parseReceipt(text: string): Omit<NormalizedReceiptPayload, 'territory'> {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const items = lines.map(parseLineAsItem).filter((item): item is NormalizedReceiptItem => Boolean(item));
  const totalLine = lines.find((line) => /^total\s*(ttc)?/i.test(line));

  return {
    retailer: detectRetailer(lines),
    storeLabel: lines[0],
    purchasedAt: detectPurchasedAt(text),
    currency: 'EUR',
    items,
    totals: {
      totalCents: totalLine ? parsePriceToCents(totalLine.replace(/^total\s*(ttc)?/i, '')) ?? undefined : undefined,
    },
    confidence: items.length > 0 ? Math.min(1, items.reduce((s, i) => s + i.confidence, 0) / items.length) : 0,
    redactedText: redactPII(text),
    ocrText: text,
  };
}

export async function preprocessImage(file: File, maxDimension = 2000): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D unavailable');
  }

  ctx.filter = 'grayscale(100%) contrast(115%)';
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('image preprocessing failed'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export async function ocrFiles(files: File[], onProgress?: (value: number) => void): Promise<string[]> {
  const outputs: string[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const processed = await preprocessImage(files[i]);
    const url = URL.createObjectURL(processed);
    try {
      const result = await runOCR(url, 'fra');
      outputs.push(result.rawText ?? '');
    } finally {
      URL.revokeObjectURL(url);
      onProgress?.(Math.round(((i + 1) / files.length) * 100));
    }
  }

  return outputs;
}

export function mergeTexts(texts: string[]): string {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const text of texts) {
    for (const line of text.split('\n')) {
      const normalized = normalizeWhitespace(line.toLowerCase());
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      merged.push(line.trim());
    }
  }
  return merged.join('\n');
}
