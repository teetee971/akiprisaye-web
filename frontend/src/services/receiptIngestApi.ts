export type Territory = 'gp' | 'mq' | 'fr';
export type SourceType = 'receipt' | 'invoice' | 'quote';

interface UploadUrl {
  imageId: string;
  url: string;
  headers?: Record<string, string>;
}

interface InitResponse {
  jobId: string;
  uploadUrls: UploadUrl[];
  expiresInSec: number;
}

interface JobResult {
  jobId: string;
  status: 'queued' | 'running' | 'success' | 'partial' | 'failed';
  confidence: number;
  totals: Record<string, unknown> | null;
  items: Array<{
    lineIndex: number;
    productLabel: string;
    quantity: number | null;
    unitPrice: number | null;
    lineTotal: number | null;
    confidence: number;
  }>;
  error?: string | null;
}

function baseUrl(): string {
  const base = import.meta.env.VITE_PRICE_API_BASE as string | undefined;
  if (!base) throw new Error('VITE_PRICE_API_BASE is not configured');
  return base.replace(/\/$/, '');
}

function ingestToken(): string {
  const token = import.meta.env.VITE_RECEIPT_INGEST_TOKEN as string | undefined;
  if (!token) throw new Error('VITE_RECEIPT_INGEST_TOKEN is not configured');
  return token;
}

async function sha256Hex(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function initReceiptIngest(payload: { territory: Territory; sourceType: SourceType; imagesCount: number }): Promise<InitResponse> {
  const response = await fetch(`${baseUrl()}/v1/ingest/receipt/init`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ingestToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`init failed (${response.status})`);
  return response.json() as Promise<InitResponse>;
}

export async function uploadReceiptImages(files: File[], uploadUrls: UploadUrl[]): Promise<Array<{ imageId: string; sha256: string; width: number; height: number }>> {
  const result: Array<{ imageId: string; sha256: string; width: number; height: number }> = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const target = uploadUrls[i];
    if (!target) throw new Error('missing upload url');

    const sha256 = await sha256Hex(file);
    const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const put = await fetch(target.url, {
      method: 'PUT',
      headers: {
        'content-type': 'image/jpeg',
        ...(target.headers ?? {}),
      },
      body: file,
    });

    if (!put.ok) throw new Error(`upload failed for ${target.imageId}`);
    result.push({ imageId: target.imageId, sha256, width: imageInfo.width, height: imageInfo.height });
  }

  return result;
}

export async function completeReceiptIngest(jobId: string, images: Array<{ imageId: string; sha256: string; width: number; height: number }>): Promise<void> {
  const response = await fetch(`${baseUrl()}/v1/ingest/receipt/complete`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ingestToken()}`,
    },
    body: JSON.stringify({ jobId, images }),
  });

  if (!response.ok) throw new Error(`complete failed (${response.status})`);
}

export async function getReceiptJob(jobId: string): Promise<JobResult> {
  const response = await fetch(`${baseUrl()}/v1/ingest/receipt/jobs/${encodeURIComponent(jobId)}`, {
    headers: { authorization: `Bearer ${ingestToken()}` },
  });
  if (!response.ok) throw new Error(`job read failed (${response.status})`);
  return response.json() as Promise<JobResult>;
}

export async function confirmReceiptJob(jobId: string, payload: Pick<JobResult, 'items' | 'totals'>): Promise<void> {
  const response = await fetch(`${baseUrl()}/v1/ingest/receipt/jobs/${encodeURIComponent(jobId)}/confirm`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ingestToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`confirm failed (${response.status})`);
}
