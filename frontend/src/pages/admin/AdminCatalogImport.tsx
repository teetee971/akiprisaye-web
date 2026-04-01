import React, { useState, useMemo, useRef, type ChangeEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, BookOpen, CheckCircle, Loader2, RotateCcw, Upload, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { catalogSchema, type CatalogPayload, makeDeterministicId, zodErrorToMessage } from './importSchemas';

const SAMPLE_CATALOG_JSON = `{
  "campaign": {
    "name": "Coliprix Mars 2026",
    "retailers": ["Coliprix", "MaximaX"],
    "validity_start": "2026-03-15",
    "validity_end": "2026-03-30",
    "territory": "GP"
  },
  "stores_applicable": ["Pointe-à-Pitre", "Abymes"],
  "products": [{ "category": "Boissons", "name": "Jus orange 1L", "price": 2.99 }]
}`;

export default function AdminCatalogImport() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_CATALOG_JSON);
  const [parsedCatalog, setParsedCatalog] = useState<CatalogPayload | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setAnalysisError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/scan-price', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur scan');
      setJsonInput(JSON.stringify(data?.json || data, null, 2));
      toast.success('Scan réussi');
    } catch (e: any) {
      setAnalysisError(e.message);
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleAnalyze = () => {
    setAnalysisError(null);
    try {
      const raw = JSON.parse(jsonInput);
      const result = catalogSchema.safeParse(raw);
      if (!result.success) { setAnalysisError(zodErrorToMessage(result.error)); return; }
      setParsedCatalog(result.data);
      toast.success('Analyse OK');
    } catch { setAnalysisError('JSON invalide'); }
  };

  const handlePublish = async () => {
    if (!parsedCatalog) return;
    setIsLoading(true);
    try {
      const id = makeDeterministicId(parsedCatalog.campaign.name + Date.now());
      await setDoc(doc(db, 'campaigns', id), { ...parsedCatalog.campaign, created_at: serverTimestamp() });
      setSuccessMessage('Publié !');
    } catch (e: any) { setAnalysisError(e.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-white min-h-screen">
      <Helmet><title>Admin - Catalogue</title></Helmet>
      <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen /> Import Catalogues</h1>
      <div className="flex gap-3">
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={async (e) => { const t = await e.target.files?.[0]?.text(); if(t) setJsonInput(t); }} />
        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-800 rounded-lg">JSON</button>
        <button onClick={() => photoInputRef.current?.click()} className="px-4 py-2 bg-purple-600 rounded-lg">Scanner Photo</button>
      </div>
      <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="w-full h-80 p-4 bg-slate-900 border border-slate-800 rounded-lg font-mono text-sm" />
      <div className="flex gap-4">
        <button onClick={handleAnalyze} className="px-6 py-2 bg-blue-500 text-slate-950 font-bold rounded-lg">Analyser le catalogue</button>
        <button onClick={handlePublish} disabled={!parsedCatalog || isLoading} className="px-6 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg disabled:opacity-50">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Publier en base de données'}
        </button>
      </div>
      {analysisError && <div className="text-red-400">{analysisError}</div>}
      {successMessage && <div className="text-emerald-400">{successMessage}</div>}
    </div>
  );
}
