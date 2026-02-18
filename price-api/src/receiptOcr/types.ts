export interface RawReceiptLine {
  label: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  confidence?: number;
  ean?: string;
  brand?: string;
  category?: string;
}

export interface RawReceipt {
  merchantCandidates: string[];
  storeCandidates: string[];
  dateCandidates: string[];
  totals: {
    total?: number;
    tax?: number;
    subtotal?: number;
  };
  lines: RawReceiptLine[];
  rawText: string;
  confidence: number;
  status: 'OK' | 'NO_DATA' | 'PARTIAL';
}

export interface ExtractorImageInput {
  r2Key: string;
  bytes?: ArrayBuffer;
}

export interface ReceiptExtractor {
  id: string;
  extract(images: ExtractorImageInput[], ctx: { env: { OCR_API_KEY?: string; OCR_ENDPOINT?: string } }): Promise<RawReceipt>;
}
