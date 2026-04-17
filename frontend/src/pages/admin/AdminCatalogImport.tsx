import React, { useState, useMemo, useRef, type ChangeEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Loader2,
  RotateCcw,
  Upload,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  catalogSchema,
  type CatalogPayload,
  makeDeterministicId,
  zodErrorToMessage,
} from './importSchemas';
import { getAdminDegradedModeReason, isStaticPreviewEnv } from '@/services/admin/runtimeEnv';
import { runOCR } from '@/services/ocrService';

/** Run local OCR on a catalog photo and return a best-effort JSON string */
async function localCatalogOcrScan(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const ocrResult = await runOCR(objectUrl, 'fra', { timeout: 45000 });
    if (!ocrResult.success || !ocrResult.rawText) {
      throw new Error(ocrResult.error ?? 'Échec OCR');
    }
    // Extract price lines from raw OCR text and build a minimal catalog JSON
    const lines = ocrResult.rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const priceRe = /(.+?)\s+(\d+[.,]\d{2})\s*€?$/;
    const products: { name: string; price: number; category: string }[] = [];
    for (const line of lines) {
      const m = line.match(priceRe);
      if (m) {
        products.push({
          name: m[1].trim(),
          price: parseFloat(m[2].replace(',', '.')),
          category: 'Divers',
        });
      }
    }
    const json = {
      campaign: {
        name: 'Import OCR local',
        retailers: ['Inconnu'],
        validity_start: new Date().toISOString().slice(0, 10),
        validity_end: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        territory: 'GP',
      },
      stores_applicable: [],
      products:
        products.length > 0
          ? products
          : [{ name: 'Produit détecté', price: 0, category: 'Divers' }],
    };
    return JSON.stringify(json, null, 2);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const SAMPLE_CATALOG_JSON = `{\n  "campaign": {\n    "name": "Coliprix Mars 2026",\n    "retailers": ["Coliprix", "MaximaX"],\n    "validity_start": "2026-03-15",\n    "validity_end": "2026-03-30",\n    "territory": "GP"\n  },\n  "stores_applicable": ["Pointe-à-Pitre", "Abymes"],\n  "products": [\n    {\n      "category": "Boissons",\n      "name": "Jus d'orange 1L",\n      "brand": "Tropicana",\n      "price": 2.99,\n      "unit_price_text": "2,99€/L",\n      "origin": "UE"\n    }\n  ]\n}`;

export default function AdminCatalogImport() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_CATALOG_JSON);
  const [parsedCatalog, setParsedCatalog] = useState<CatalogPayload | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const isDegradedMode = isStaticPreviewEnv();
  const degradedReason = getAdminDegradedModeReason();

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setAnalysisError(null);
    try {
      if (!isDegradedMode) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/scan-price', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Erreur scan');
        setJsonInput(JSON.stringify(data?.json || data, null, 2));
        toast.success('Scan réussi');
        return;
      }
      toast('🔍 Analyse OCR locale en cours…', { duration: 3000 });
      const jsonStr = await localCatalogOcrScan(file);
      setJsonInput(jsonStr);
      toast.success('Scan OCR local réussi — vérifiez et ajustez si besoin');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur scan';
      setAnalysisError(
        isDegradedMode ? `Scan OCR local échoué : ${msg}. Essayez une photo plus nette.` : msg
      );
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleAnalyze = () => {
    setAnalysisError(null);
    setParsedCatalog(null);
    try {
      const raw = JSON.parse(jsonInput);
      const result = catalogSchema.safeParse(raw);
      if (!result.success) {
        setAnalysisError(zodErrorToMessage(result.error));
        return;
      }
      setParsedCatalog(result.data);
      toast.success('Analyse réussie !');
    } catch {
      setAnalysisError('JSON mal formaté');
    }
  };

  const handlePublish = async () => {
    if (!parsedCatalog) return;
    setIsLoading(true);
    try {
      if (!db) throw new Error('Firestore non initialisé');
      const id = makeDeterministicId(
        parsedCatalog.campaign.name + parsedCatalog.campaign.validity_start
      );
      await setDoc(doc(db, 'campaigns', id), {
        ...parsedCatalog.campaign,
        stores_applicable: parsedCatalog.stores_applicable,
        created_at: serverTimestamp(),
        source: 'import_admin',
      });
      setSuccessMessage(`Catalogue "${parsedCatalog.campaign.name}" publié.`);
      toast.success('Publication réussie !');
    } catch (e: any) {
      setAnalysisError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-white min-h-screen">
      <Helmet>
        <title>Import Catalogues — Admin AkiPrisaye</title>
      </Helmet>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BookOpen className="text-blue-300" /> Import de Catalogues Promotionnels
      </h1>
      {isDegradedMode && (
        <div className="p-3 rounded-lg border border-amber-400/40 bg-amber-900/20 text-amber-200 text-sm">
          {degradedReason}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={async (e) => {
            const text = await e.target.files?.[0]?.text();
            if (text) setJsonInput(text);
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
          className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-2"
        >
          Charger un .json
        </button>
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 rounded-lg flex items-center gap-2 hover:bg-purple-500 transition-colors"
        >
          {isDegradedMode ? 'Scanner photo (OCR local)' : 'Scanner photo'}
        </button>
        <button
          type="button"
          onClick={() => {
            setJsonInput(SAMPLE_CATALOG_JSON);
            setParsedCatalog(null);
            setAnalysisError(null);
          }}
          className="px-4 py-2 bg-slate-800 rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        <label htmlFor="catalog-json" className="text-sm font-semibold text-slate-200">
          JSON brut du catalogue
        </label>
        <textarea
          id="catalog-json"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full h-80 p-4 bg-slate-900 border border-slate-800 rounded-lg font-mono text-sm"
        />
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleAnalyze}
          className="px-6 py-2 bg-blue-500 text-slate-950 font-bold rounded-lg hover:bg-blue-400"
        >
          Analyser le catalogue
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!parsedCatalog || isLoading || isDegradedMode}
          className="px-6 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Publier en base de données'}
        </button>
      </div>
      {analysisError && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {analysisError}
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/50 text-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}
    </div>
  );
}
