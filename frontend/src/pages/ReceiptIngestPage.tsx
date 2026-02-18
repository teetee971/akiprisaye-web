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

export default function ReceiptIngestPage() {
  const [territory, setTerritory] = useState<Territory>('gp');
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>('idle');
  const [jobId, setJobId] = useState('');
  const [error, setError] = useState('');
  const [job, setJob] = useState<Awaited<ReturnType<typeof getReceiptJob>> | null>(null);

  const canSubmit = useMemo(() => files.length >= 1 && files.length <= 6, [files.length]);

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).slice(0, 6);
    setFiles(selected);
  };

  const pollJob = async (id: string) => {
    for (let i = 0; i < 15; i += 1) {
      const current = await getReceiptJob(id);
      setJob(current);
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
      await confirmReceiptJob(jobId, { items: job.items, totals: job.totals });
      setStep('done');
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Erreur de confirmation');
    }
  };

  return (
    <section className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Ingestion ticket photo (beta)</h1>
      <p className="text-sm text-slate-300">Flux sécurisé: upload R2 privé, OCR, suppression PII et validation utilisateur.</p>

      <label className="block">
        <span className="text-sm">Territoire</span>
        <select className="block mt-1 rounded border bg-slate-900 p-2" value={territory} onChange={(e) => setTerritory(e.target.value as Territory)}>
          <option value="gp">Guadeloupe</option>
          <option value="mq">Martinique</option>
          <option value="fr">France hexagonale</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Photos du ticket (1 à 6)</span>
        <input className="block mt-1" type="file" accept="image/*" capture="environment" multiple onChange={onFiles} />
      </label>

      <button disabled={!canSubmit || step === 'uploading' || step === 'processing'} onClick={startFlow} className="rounded bg-blue-600 px-4 py-2 disabled:opacity-50">
        {step === 'uploading' ? 'Upload...' : step === 'processing' ? 'Extraction...' : 'Envoyer'}
      </button>

      {jobId && <p className="text-xs text-slate-400">Job: {jobId}</p>}
      {error && <p className="text-red-400">{error}</p>}

      {job && (
        <div className="rounded border border-slate-700 p-3 space-y-2">
          <h2 className="font-semibold">Résultat sanitizé</h2>
          <p className="text-sm">Status: {job.status} · Confiance: {Math.round(job.confidence * 100)}%</p>
          <ul className="space-y-1">
            {job.items.map((item) => (
              <li key={`${item.lineIndex}-${item.productLabel}`} className="text-sm">
                {item.productLabel} — {item.lineTotal ?? item.unitPrice ?? 0} €
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
