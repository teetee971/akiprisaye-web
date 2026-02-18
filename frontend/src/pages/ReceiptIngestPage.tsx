import { useMemo, useState } from 'react';
import { mergeTexts, ocrFiles, parseReceipt, type NormalizedReceiptItem } from '../services/receiptOcrClient';
import { getApiBaseUrl } from '../utils/apiBase';

interface CompletePayload {
  territory: 'fr' | 'gp' | 'mq';
  retailer: string;
  storeLabel?: string;
  purchasedAt?: string;
  currency: 'EUR';
  confidence: number;
  redactedText: string;
  ocrText: string;
  items: Array<NormalizedReceiptItem>;
}

export default function ReceiptIngestPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [payload, setPayload] = useState<CompletePayload | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canScan = files.length >= 1 && files.length <= 6;

  const onScan = async () => {
    setMessage(null);
    const texts = await ocrFiles(files, setProgress);
    const merged = mergeTexts(texts);
    const parsed = parseReceipt(merged);
    setPayload({ ...parsed, territory: 'gp' });
  };

  const updateItem = (index: number, key: 'label' | 'priceCents', value: string) => {
    if (!payload) return;
    const nextItems = [...payload.items];
    if (key === 'priceCents') {
      nextItems[index] = { ...nextItems[index], priceCents: Math.max(0, Math.round(Number.parseFloat(value || '0') * 100)) };
    } else {
      nextItems[index] = { ...nextItems[index], label: value };
    }
    setPayload({ ...payload, items: nextItems });
  };

  const onSend = async () => {
    if (!payload) return;
    setSending(true);
    setMessage(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/v1/ingest/receipt/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Envoi impossible (${response.status})`);
      }
      setMessage('Ticket envoyé avec succès.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur d’envoi');
    } finally {
      setSending(false);
    }
  };

  const summary = useMemo(() => {
    if (!payload) return null;
    const total = payload.items.reduce((sum, item) => sum + item.priceCents, 0) / 100;
    return `${payload.items.length} lignes détectées · total estimé ${total.toFixed(2)} €`;
  }, [payload]);

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Ingestion ticket (OCR gratuit)</h1>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 6))}
      />
      <p className="text-sm text-gray-600">Sélectionner 1 à 6 images.</p>
      <button type="button" onClick={onScan} disabled={!canScan} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        Lancer OCR
      </button>
      {progress > 0 ? <p>Progression OCR: {progress}%</p> : null}
      {summary ? <p>{summary}</p> : null}

      {payload?.items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="grid grid-cols-2 gap-2">
          <input value={item.label} onChange={(e) => updateItem(index, 'label', e.target.value)} className="border rounded p-2" />
          <input
            value={(item.priceCents / 100).toFixed(2)}
            onChange={(e) => updateItem(index, 'priceCents', e.target.value)}
            className="border rounded p-2"
          />
        </div>
      ))}

      <button type="button" onClick={onSend} disabled={!payload || sending} className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50">
        Envoyer
      </button>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
