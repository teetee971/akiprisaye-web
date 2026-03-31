import { Camera } from "lucide-react";
import { useRef } from "react";
import { Camera } from "lucide-react";
import { type ChangeEvent, useMemo, useRef, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, BookOpen, CheckCircle, Loader2, RotateCcw, Upload } from 'lucide-react';
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
  "products": [
    {
      "category": "Boissons",
      "name": "Jus d'orange 1L",
      "brand": "Tropicana",
      "price": 2.99,
      "unit_price_text": "2,99€/L",
      "origin": "UE"
    }
  ]
}`;

export default function AdminCatalogImport() {
  const [jsonInput, setJsonInput] = useState, useRef(SAMPLE_CATALOG_JSON);
  const fileInputRef = useRef<HTMLInputElement>(null); const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = async () => { const base64 = (reader.result as string).split(",")[1]; try { const res = await fetch("/api/scan-price", { method: "POST", body: JSON.stringify({ imageBase64: base64 }) }); const data = await res.json(); const text = data.candidates[0].content.parts[0].text; setJsonInput(text.replace(/```json|```/g, "").trim()); } catch (err) { alert("Erreur scan IA"); } }; reader.readAsDataURL(file); };
  const [parsedCatalog, setParsedCatalog] = useState, useRef<CatalogPayload | null>(null);
  const [analysisError, setAnalysisError] = useState, useRef<string | null>(null);
  const [successMessage, setSuccessMessage] = useState, useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState, useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const warnings = useMemo(() => {
    if (!parsedCatalog) return [];
    const list: string[] = [];
    const start = new Date(parsedCatalog.campaign.validity_start).getTime();
    const end = new Date(parsedCatalog.campaign.validity_end).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      list.push('La date de fin est antérieure à la date de début.');
    }
    if (parsedCatalog.products.some((product) => product.price === 0)) {
      list.push('Au moins un produit possède un prix à 0.');
    }
    return list;
  }, [parsedCatalog]);

  const preview = useMemo(() => {
    if (!parsedCatalog) {
      return { campaignName: '-', validity: '- → -', productCount: 0, avgPrice: 0 };
    }

    const total = parsedCatalog.products.reduce((sum, product) => sum + product.price, 0);
    const avgPrice = parsedCatalog.products.length > 0 ? total / parsedCatalog.products.length : 0;

    return {
      campaignName: parsedCatalog.campaign.name,
      validity: `${parsedCatalog.campaign.validity_start} → ${parsedCatalog.campaign.validity_end}`,
      productCount: parsedCatalog.products.length,
      avgPrice,
    };
  }, [parsedCatalog]);

  const handleAnalyze = () => {
    setSuccessMessage(null);
    setAnalysisError(null);
    setParsedCatalog(null);

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(jsonInput);
    } catch {
      const msg = 'JSON mal formaté : impossible de parser le contenu. Vérifiez les virgules et accolades.';
      setAnalysisError(msg);
      toast.error(msg);
      return;
    }

    const validation = catalogSchema.safeParse(parsedValue);
    if (!validation.success) {
      const msg = `Catalogue invalide — ${zodErrorToMessage(validation.error)}`;
      setAnalysisError(msg);
      toast.error(msg);
      return;
    }

    setParsedCatalog(validation.data);
    toast.success('Catalogue analysé avec succès. Prévisualisation prête.');
  };

  const handlePublish = async () => {
    setSuccessMessage(null);
    setAnalysisError(null);

    if (!db) {
      const msg = 'Firestore indisponible dans cet environnement.';
      setAnalysisError(msg);
      toast.error(msg);
      return;
    }

    if (!parsedCatalog) {
      const msg = 'Veuillez analyser un catalogue valide avant publication.';
      setAnalysisError(msg);
      toast.error(msg);
      return;
    }

    const firestoreDb = db;
    const catalogId = makeDeterministicId(
      [
        parsedCatalog.campaign.name,
        parsedCatalog.campaign.territory,
        parsedCatalog.campaign.validity_start,
        parsedCatalog.campaign.validity_end,
      ].join('|'),
    );

    setIsLoading(true);
    try {
      await setDoc(doc(firestoreDb, 'catalogs', catalogId), {
        campaign: parsedCatalog.campaign,
        stores_applicable: parsedCatalog.stores_applicable,
        products: parsedCatalog.products,
        productsCount: parsedCatalog.products.length,
        source: 'admin_manual_catalog_import',
        importedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const msg = `Catalogue « ${parsedCatalog.campaign.name} » publié avec succès.`;
      setSuccessMessage(msg);
      setParsedCatalog(null);
      setJsonInput('');
      toast.success(msg);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue pendant la publication.';
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setJsonInput(SAMPLE_CATALOG_JSON);
    setParsedCatalog(null);
    setAnalysisError(null);
    setSuccessMessage(null);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setJsonInput(content);
    setParsedCatalog(null);
    setAnalysisError(null);
    setSuccessMessage(null);
  };


  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccessMessage(null);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/scan-price', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload?.error ?? 'Échec du scan photo.';
        throw new Error(message);
      }

      const scannedJson = payload?.json ?? payload?.data ?? payload;
      setJsonInput(typeof scannedJson === 'string' ? scannedJson : JSON.stringify(scannedJson, null, 2));
      setParsedCatalog(null);
      toast.success('Scan photo terminé. JSON chargé.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue lors du scan photo.';
      setAnalysisError(message);
      toast.error(message);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <>
      <Helmet>
        <title>Import catalogues promotionnels — Admin AkiPrisaye</title>
      </Helmet>

      <div className="min-h-[calc(100vh-8rem)] bg-slate-950 text-slate-100 rounded-2xl p-6 lg:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-7 h-7 text-blue-300 mt-0.5" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">Import de Catalogues Promotionnels</h1>
            <p className="text-slate-300 mt-1">
              Collez un JSON OCR (Coliprix, MaximaX, etc.), analysez la structure puis publiez en base Firestore.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <label htmlFor="catalog-json" className="text-sm font-semibold text-slate-200">
              JSON brut du catalogue
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                <Upload className="w-4 h-4" />
                Charger un .json
              </button>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Camera className="w-4 h-4" />
                Scanner photo
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>

          <textarea
            id="catalog-json"
            value={jsonInput}
            onChange={(event) => setJsonInput(event.target.value)}
            placeholder="Collez ici le JSON brut du catalogue..."
            className="w-full min-h-[420px] rounded-lg border border-slate-700 bg-slate-950 text-slate-100 p-4 font-mono text-sm leading-6 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/70"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" />
              Analyser le catalogue
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={!parsedCatalog || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isLoading ? 'Publication...' : 'Publier en base de données'}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
          <h2 className="text-lg font-bold mb-3">Prévisualisation</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Campagne</p>
              <p className="font-semibold text-slate-100">{preview.campaignName}</p>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Période</p>
              <p className="font-semibold text-slate-100">{preview.validity}</p>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Produits détectés</p>
              <p className="font-semibold text-slate-100">{preview.productCount}</p>
            </div>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Prix moyen</p>
              <p className="font-semibold text-slate-100">{preview.avgPrice.toFixed(2)} €</p>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-900/20 p-3 space-y-1">
              {warnings.map((warning) => (
                <p key={warning} className="text-sm text-amber-200 inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {warning}
                </p>
              ))}
            </div>
          )}

          {analysisError && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4" />
              {analysisError}
            </p>
          )}

          {successMessage && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle className="w-4 h-4" />
              {successMessage}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
