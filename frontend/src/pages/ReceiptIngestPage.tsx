import React, { useMemo, useState } from 'react';
import {
  completeReceiptIngest,
  confirmReceiptJob,
  getReceiptJob,
  initReceiptIngest,
  uploadReceiptImages,
  type Territory,
} from '../services/receiptIngestApi';

type Step = 'idle' | 'uploading' | 'processing' | 'review' | 'done';

type EditableItem = {
  lineIndex: number;
  productLabel: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
  confidence: number;
  ean?: string;
};

export default function ReceiptIngestPage() {
  const [territory, setTerritory] = useState<Territory>('gp');
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>('idle');
  const [jobId, setJobId] = useState('');
  const [error, setError] = useState('');
  const [job, setJob] = useState<Awaited<ReturnType<typeof getReceiptJob>> | null>(null);
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);

  const canSubmit = useMemo(() => files.length >= 1 && files.length <= 6, [files.length]);

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).slice(0, 6);
    setFiles(selected);
  };

  const onItemEanChange = (lineIndex: number, value: string) => {
    setEditableItems((current) =>
      current.map((item) => (item.lineIndex === lineIndex ? { ...item, ean: value.replace(/\D/g, '').slice(0, 14) } : item)),
    );
  };

  const pollJob = async (id: string) => {
    for (let i = 0; i < 15; i += 1) {
      const current = await getReceiptJob(id);
      setJob(current);
      setEditableItems(
        current.items.map((item) => ({
          lineIndex: item.lineIndex,
          productLabel: item.productLabel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          confidence: item.confidence,
          ean: item.ean ?? '',
        })),
      );
      if (['success', 'partial', 'failed'].includes(current.status)) {
        setStep(current.status === 'failed' ? 'idle' : 'review');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    setStep('review');
  };

  const startFlow = async () => {
    if (!canSubmit) return;
    setError('');
    setStep('uploading');

    try {
      const init = await initReceiptIngest({ territory, sourceType: 'receipt', imagesCount: files.length });
      setJobId(init.jobId);
      const uploaded = await uploadReceiptImages(files, init.uploadUrls);
      await completeReceiptIngest(init.jobId, uploaded);
      setStep('processing');
      await pollJob(init.jobId);
    } catch (flowError) {
      setStep('idle');
      setError(flowError instanceof Error ? flowError.message : 'Erreur inconnue');
    }
  };

  const submitConfirm = async () => {
    if (!jobId || !job) return;
    setError('');
    try {
      await confirmReceiptJob(jobId, { items: editableItems, totals: job.totals });
      setStep('done');
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Erreur de confirmation');
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-bold">Ingestion ticket photo (beta)</h1>
      <p className="text-sm text-slate-300">Flux sécurisé: upload R2 privé, OCR, suppression PII et validation utilisateur.</p>

      <label className="block">
        <span className="text-sm">Territoire</span>
        <select className="mt-1 block rounded border bg-slate-900 p-2" value={territory} onChange={(e) => setTerritory(e.target.value as Territory)}>
          <option value="gp">Guadeloupe</option>
          <option value="mq">Martinique</option>
          <option value="fr">France hexagonale</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Photos du ticket (1 à 6)</span>
        <input className="mt-1 block" type="file" accept="image/*" capture="environment" multiple onChange={onFiles} />
      </label>

      <button disabled={!canSubmit || step === 'uploading' || step === 'processing'} onClick={startFlow} className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50">
        {step === 'uploading' ? 'Upload...' : step === 'processing' ? 'Extraction...' : 'Envoyer'}
      </button>

      {jobId && <p className="text-xs text-slate-400">Job: {jobId}</p>}
      {error && <p className="text-red-400">{error}</p>}

      {job && (
        <div className="space-y-2 rounded border border-slate-700 p-3">
          <h2 className="font-semibold">Résultat sanitizé</h2>
          <p className="text-sm">Status: {job.status} · Confiance: {Math.round(job.confidence * 100)}%</p>
          <p className="text-xs text-slate-400">Ajoutez/corrigez un EAN (8-14 chiffres) pour chaque ligne que vous voulez enregistrer en base prix.</p>
          <ul className="space-y-2">
            {editableItems.map((item) => (
              <li key={`${item.lineIndex}-${item.productLabel}`} className="rounded border border-slate-800 p-2 text-sm">
                <div>
                  {item.productLabel} — {item.lineTotal ?? item.unitPrice ?? 0} €
                </div>
                <label className="mt-1 block text-xs">
                  EAN (optionnel mais recommandé)
                  <input
                    className="mt-1 block w-full rounded border bg-slate-900 p-2"
                    value={item.ean ?? ''}
                    onChange={(event) => onItemEanChange(item.lineIndex, event.target.value)}
                    inputMode="numeric"
                    placeholder="ex: 3560070894222"
                  />
                </label>
              </li>
            ))}
          </ul>
          <button onClick={submitConfirm} disabled={step !== 'review'} className="rounded bg-emerald-600 px-4 py-2 disabled:opacity-50">
            Confirmer et enregistrer
          </button>
        </div>
      )}

      {step === 'done' && <p className="text-emerald-400">Observations enregistrées avec succès.</p>}
    </section>
  );
}
