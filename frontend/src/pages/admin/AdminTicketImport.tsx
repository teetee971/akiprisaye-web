import { Camera } from "lucide-react";

import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, CheckCircle2, Loader2, ReceiptText, RotateCcw, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, doc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { makeDeterministicId, receiptSchema, type ReceiptPayload, zodErrorToMessage } from './importSchemas';

const SAMPLE_JSON = `{
  "store": {
    "name": "SHILO H INTERNATIONAL",
    "address": "65 RUE BRION, 97111 MORNE A L EAU",
    "territory": "GP",
    "siret": "82019082500027"
  },
  "transaction": {
    "date": "2026-03-11T12:01:00",
    "ticket_id": "1610669",
    "total_amount": 37.46
  },
  "items": [
    { "name": "COCA COLA BTLLE 2L", "price": 3.49, "quantity": 1 },
    { "name": "LAITUE LOCALE", "price": 3.00, "quantity": 1 }
  ]
}`;

export default function AdminTicketImport() {
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSON);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedPayload, setParsedPayload] = useState<ReceiptPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const preview = useMemo(() => {
    if (!parsedPayload) {
      return { itemsCount: 0, total: 0, ticketId: '-', computedTotal: 0 };
    }

    const computedTotal = parsedPayload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      itemsCount: parsedPayload.items.length,
      total: parsedPayload.transaction.total_amount,
      ticketId: parsedPayload.transaction.ticket_id,
      computedTotal,
    };
  }, [parsedPayload]);

  const warnings = useMemo(() => {
    if (!parsedPayload) return [];
    const list: string[] = [];
    if (Math.abs(preview.total - preview.computedTotal) > 0.01) {
      list.push(`Écart total ticket (${preview.total.toFixed(2)}€) vs somme articles (${preview.computedTotal.toFixed(2)}€).`);
    }
    return list;
  }, [parsedPayload, preview.computedTotal, preview.total]);

  const handleAnalyze = () => {
    setStatusMessage(null);
    setErrorMessage(null);
    setParsedPayload(null);

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(jsonInput);
    } catch {
      const message = 'JSON invalide. Vérifiez la syntaxe avant analyse.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const validation = receiptSchema.safeParse(parsedValue);
    if (!validation.success) {
      const message = `Ticket invalide — ${zodErrorToMessage(validation.error)}`;
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setParsedPayload(validation.data);
    toast.success('Ticket analysé avec succès.');
  };

  const handleSubmit = async () => {
    setStatusMessage(null);
    setErrorMessage(null);

    if (!db) {
      const message = 'Firestore indisponible dans cet environnement.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!parsedPayload) {
      const message = 'Veuillez analyser un ticket valide avant enregistrement.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const firestoreDb = db;
    const receiptId = makeDeterministicId(
      [
        parsedPayload.store.siret ?? parsedPayload.store.name,
        parsedPayload.transaction.ticket_id,
        parsedPayload.transaction.date,
      ].join('|'),
    );

    setLoading(true);
    try {
      await setDoc(doc(firestoreDb, 'receipts', receiptId), {
        store: parsedPayload.store,
        transaction: parsedPayload.transaction,
        itemsCount: parsedPayload.items.length,
        source: 'admin_manual_import',
        importedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const itemsCollection = collection(firestoreDb, 'receipts', receiptId, 'items');
      const existingItemsSnapshot = await getDocs(itemsCollection);
      const batch = writeBatch(firestoreDb);

      existingItemsSnapshot.docs.forEach((entry) => {
        batch.delete(entry.ref);
      });

      parsedPayload.items.forEach((item, index) => {
        const itemRef = doc(firestoreDb, 'receipts', receiptId, 'items', String(index));
        batch.set(itemRef, {
          ...item,
          itemIndex: index,
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      const message = `Ticket ${parsedPayload.transaction.ticket_id} enregistré (${parsedPayload.items.length} article(s)).`;
      setStatusMessage(message);
      setJsonInput('');
      setParsedPayload(null);
      toast.success(message);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue pendant l\'enregistrement.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setJsonInput(SAMPLE_JSON);
    setStatusMessage(null);
    setErrorMessage(null);
    setParsedPayload(null);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setJsonInput(content);
    setStatusMessage(null);
    setErrorMessage(null);
    setParsedPayload(null);
  };

  return (
    <>
      <Helmet>
        <title>Import tickets de caisse — Admin AkiPrisaye</title>
      </Helmet>

      <div className="max-w-5xl mx-auto text-white space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <ReceiptText className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-black tracking-tight">Import tickets de caisse</h1>
          </div>
          <p className="text-slate-300 mt-2">
            Collez un JSON complet (store, transaction, items), analysez puis enregistrez en base Firestore.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="receipt-json" className="block text-sm font-medium text-slate-200">
              JSON du ticket
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                <Upload className="w-4 h-4" />
                Charger un .json
                <button onClick={() => fileInputRef.current.click()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Camera className="w-5 h-5" />Scanner Photo</button><input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
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
            id="receipt-json"
            value={jsonInput}
            onChange={(event) => setJsonInput(event.target.value)}
            placeholder="Collez ici votre JSON de ticket..."
            className="w-full min-h-[420px] rounded-xl border border-slate-700 bg-slate-950 text-slate-100 p-4 font-mono text-sm leading-6 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" />
              Analyser le ticket
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !parsedPayload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Enregistrement...' : 'Publier en base de données'}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Ticket</p>
            <p className="font-semibold">#{preview.ticketId}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Articles</p>
            <p className="font-semibold">{preview.itemsCount}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Total ticket</p>
            <p className="font-semibold">{preview.total.toFixed(2)} €</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3">
            <p className="text-slate-400 text-xs uppercase tracking-wide">Total calculé</p>
            <p className="font-semibold">{preview.computedTotal.toFixed(2)} €</p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 p-3 space-y-1">
            {warnings.map((warning) => (
              <p key={warning} className="inline-flex items-center gap-2 text-sm text-amber-200">
                <AlertTriangle className="w-4 h-4" />
                {warning}
              </p>
            ))}
          </div>
        )}

        {statusMessage && (
          <p className="inline-flex items-center gap-2 text-sm text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            {statusMessage}
          </p>
        )}

        {errorMessage && (
          <p className="inline-flex items-center gap-2 text-sm text-red-300">
            <AlertTriangle className="w-4 h-4" />
            {errorMessage}
          </p>
        )}
      </div>
    </>
  );
}
