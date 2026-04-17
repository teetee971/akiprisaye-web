import React, { useState, useRef, type ChangeEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ReceiptText,
  Upload,
  Camera,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  makeDeterministicId,
  receiptSchema,
  type ReceiptPayload,
  zodErrorToMessage,
} from './importSchemas';
import { getAdminDegradedModeReason, isStaticPreviewEnv } from '@/services/admin/runtimeEnv';
import { runOCR } from '@/services/ocrService';
import { parseReceipt } from '@/services/receiptParser';

/** Convert DD/MM/YYYY (from receiptParser) → YYYY-MM-DD */
function normalizeDate(d?: string): string {
  if (!d) return new Date().toISOString().slice(0, 10);
  const parts = d.split(/[/\-.]/);
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (yyyy && yyyy.length === 4) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

/** Run local OCR scan on a File and return the structured ticket JSON string */
async function localOcrScan(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const ocrResult = await runOCR(objectUrl, 'fra', { receiptMode: true, timeout: 45000 });
    if (!ocrResult.success || !ocrResult.rawText) {
      throw new Error(ocrResult.error ?? 'Échec OCR');
    }
    const parsed = parseReceipt(ocrResult.rawText);
    const json = {
      store: {
        name: parsed.storeName ?? 'Enseigne inconnue',
        address: parsed.storeAddress ?? '',
        territory: 'GP',
      },
      transaction: {
        date: normalizeDate(parsed.date),
        ticket_id: parsed.receiptNumber ?? String(Date.now()),
        total_amount: parsed.total ?? parsed.checksum.computed,
      },
      items: parsed.items.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.qty ?? 1,
      })),
    };
    return JSON.stringify(json, null, 2);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const SAMPLE_JSON = `{\n  "store": { "name": "SHILO H INTERNATIONAL", "address": "65 RUE BRION", "territory": "GP" },\n  "transaction": { "date": "2026-03-11", "ticket_id": "1610669", "total_amount": 37.46 },\n  "items": [{ "name": "COCA COLA 2L", "price": 3.49, "quantity": 1 }]\n}`;

export default function AdminTicketImport() {
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSON);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedPayload, setParsedPayload] = useState<ReceiptPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const isDegradedMode = isStaticPreviewEnv();
  const degradedReason = getAdminDegradedModeReason();

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // Try backend API first (when not in degraded/static mode)
      if (!isDegradedMode) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/scan-price', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erreur scan');
        setJsonInput(JSON.stringify(data?.json || data, null, 2));
        toast.success('Scan ticket réussi');
        return;
      }
      // Fallback: local Tesseract OCR (works in static preview without backend)
      toast('🔍 Analyse OCR locale en cours…', { duration: 3000 });
      const jsonStr = await localOcrScan(file);
      setJsonInput(jsonStr);
      toast.success('Scan OCR local réussi — vérifiez et corrigez si besoin');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur scan';
      setErrorMessage(
        isDegradedMode
          ? `Scan OCR local échoué : ${msg}. Essayez une photo plus nette ou saisissez le JSON manuellement.`
          : msg
      );
    } finally {
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleAnalyze = () => {
    setErrorMessage(null);
    setParsedPayload(null);
    try {
      const raw = JSON.parse(jsonInput);
      const result = receiptSchema.safeParse(raw);
      if (!result.success) {
        setErrorMessage(zodErrorToMessage(result.error));
        return;
      }
      setParsedPayload(result.data);
      toast.success('Analyse réussie !');
    } catch {
      setErrorMessage('JSON mal formaté');
    }
  };

  const handleSave = async () => {
    if (!parsedPayload) return;
    setLoading(true);
    try {
      if (!db) throw new Error('Firestore non initialisé');
      const id = makeDeterministicId(parsedPayload.transaction.ticket_id + Date.now());
      await setDoc(doc(db, 'receipts', id), {
        ...parsedPayload,
        created_at: serverTimestamp(),
        source: 'admin_import',
      });
      setStatusMessage('Ticket enregistré !');
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-white space-y-6 bg-slate-900 rounded-2xl min-h-screen border border-slate-800">
      <Helmet>
        <title>Import tickets — Admin</title>
      </Helmet>
      <h1 className="text-2xl font-black flex items-center gap-2">
        <ReceiptText /> Import tickets de caisse
      </h1>
      {isDegradedMode && (
        <div className="p-3 rounded-lg border border-amber-400/40 bg-amber-900/20 text-amber-200 text-sm">
          {degradedReason}
        </div>
      )}
      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={async (e) => {
            const t = await e.target.files?.[0]?.text();
            if (t) setJsonInput(t);
          }}
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-slate-800 rounded-lg"
        >
          Charger un .json
        </button>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
        >
          {isDegradedMode ? 'Scanner photo (OCR local)' : 'Scanner photo'}
        </button>
        <button
          type="button"
          onClick={() => {
            setJsonInput(SAMPLE_JSON);
            setParsedPayload(null);
            setErrorMessage(null);
          }}
          className="px-4 py-2 bg-slate-800 rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <label htmlFor="receipt-json" className="text-sm font-medium text-slate-200">
          JSON du ticket
        </label>
        <textarea
          id="receipt-json"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full h-80 p-4 bg-slate-950 rounded-xl font-mono text-sm"
        />
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleAnalyze}
          className="px-6 py-2 bg-blue-500 text-slate-950 font-bold rounded-lg hover:bg-blue-400"
        >
          Analyser le ticket
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!parsedPayload || loading}
          className="px-6 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            'Enregistrer en base de données'
          )}
        </button>
      </div>
      {errorMessage && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {errorMessage}
        </div>
      )}
      {statusMessage && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/50 text-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {statusMessage}
        </div>
      )}
    </div>
  );
}
