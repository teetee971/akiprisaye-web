import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEntitlements } from '../billing/useEntitlements';
import {
  DEFAULT_LOOKUP_TERRITORY,
  resolveBarcode,
  useContinuousBarcodeScanner,
  type ResolvedProduct,
  type ScanStatus,
} from '../hooks/useContinuousBarcodeScanner';
import { useToast } from '../hooks/useToast';
import { getShoppingListCount } from '../store/useShoppingListStore';
import type { Territoire } from '../types/ean';

const TERRITORIES: Territoire[] = [
  'guadeloupe', 'martinique', 'guyane', 'reunion', 'mayotte', 'polynesie', 'nouvelle_caledonie', 'wallis_et_futuna', 'saint_martin', 'saint_barthelemy', 'saint_pierre_et_miquelon',
];

function getTerritoire(value: string | null): Territoire {
  if (value && TERRITORIES.includes(value as Territoire)) return value as Territoire;
  return DEFAULT_LOOKUP_TERRITORY;
}

function StatusBadge({ status }: { status: ScanStatus }) {
  const tone = status === 'ok' ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' : status === 'loading' ? 'bg-blue-500/20 border-blue-400/50 text-blue-200' : status === 'not_found' ? 'bg-amber-500/20 border-amber-400/50 text-amber-200' : 'bg-rose-500/20 border-rose-400/50 text-rose-200';
  const label = status === 'loading' ? '…' : status === 'ok' ? 'OK' : status === 'not_found' ? 'VIDE' : 'ERR';
  return <span className={`inline-flex h-6 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-semibold ${tone}`}>{label}</span>;
}

export default function ScannerHub() {
  const [searchParams] = useSearchParams();
  const debugEnabled = searchParams.get('debug') === '1';
  const navigate = useNavigate();
  const toast = useToast();
  const { quota } = useEntitlements();
  const [listCount, setListCount] = useState(() => getShoppingListCount());
  const [manualEan, setManualEan] = useState('');
  const [manualResult, setManualResult] = useState<ResolvedProduct | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const territoire = useMemo(() => getTerritoire(searchParams.get('territoire')), [searchParams]);

  const {
    videoRef, cameraError, barcodeSupport, scanActive, setScanActive, results, clear, removeItem,
    addAllOk, addItemToCart, okItems, autoAddToCart, setAutoAddToCart, debugInfo,
  } = useContinuousBarcodeScanner({ territoire, debug: debugEnabled, stabilityThreshold: 2, maxItems: quota('maxItems') });

  useEffect(() => {
    const syncCount = () => setListCount(getShoppingListCount());
    window.addEventListener('storage', syncCount);
    window.addEventListener('focus', syncCount);
    window.addEventListener('akiprisaye:shopping-list-updated', syncCount as EventListener);
    return () => {
      window.removeEventListener('storage', syncCount);
      window.removeEventListener('focus', syncCount);
      window.removeEventListener('akiprisaye:shopping-list-updated', syncCount as EventListener);
    };
  }, []);

  const handleManualLookup = async () => {
    setManualError(null);
    setManualResult(null);
    const cleaned = manualEan.replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(cleaned)) {
      setManualError('EAN invalide');
      return;
    }
    const result = await resolveBarcode(cleaned, territoire, 'scan_utilisateur');
    if (!result) {
      setManualError('Produit non trouvé');
      return;
    }
    setManualResult(result);
  };

  const handleAddAllOk = () => {
    const added = addAllOk();
    if (added > 0) toast.success(`${added} article${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} à la liste`);
  };

  const handleAddManual = (id: string) => {
    const added = addItemToCart(id);
    if (added) toast.success('Ajouté à la liste');
  };

  return (
    <>
      <Helmet><title>Scanner - A KI PRI SA YÉ</title><meta name="description" content="Scanner continu: code-barres avec historique et ajout rapide au panier" /></Helmet>
      <div className="min-h-screen bg-slate-950 p-4 pt-24 text-white">
        <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h1 className="mb-3 text-2xl font-semibold">SCANNER V3 DEV TEST</h1>
          <p className="mb-4 text-sm text-slate-300">Scan continu actif: caméra en boucle, anti-doublon et ajout rapide au panier.</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setScanActive((value) => !value)} className="rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700" aria-pressed={scanActive} aria-label={scanActive ? 'Mettre le scan en pause' : 'Démarrer le scan'}>{scanActive ? 'Pause scan' : 'Start scan'}</button>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-500 px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={autoAddToCart} onChange={(event) => setAutoAddToCart(event.target.checked)} aria-label="Activer l’ajout automatique au panier pour les résultats OK" />Ajout auto au panier (OK)</label>
            <button type="button" onClick={handleAddAllOk} disabled={okItems.length === 0} className="rounded-lg border border-emerald-500/60 px-4 py-3 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Ajouter tous les produits valides au panier (${okItems.length})`}>Ajouter tous les OK ({okItems.length})</button>
            {listCount > 0 && <button type="button" onClick={() => navigate('/liste')} className="rounded-lg border border-blue-400/60 px-4 py-3 text-sm font-semibold text-blue-100">Voir la liste ({listCount})</button>}
            <button type="button" onClick={clear} disabled={results.length === 0} className="rounded-lg border border-rose-500/60 px-4 py-3 text-sm font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Vider la liste des résultats (${results.length})`}>Vider ({results.length})</button>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
            <video ref={videoRef} playsInline muted autoPlay className="aspect-video w-full object-cover" aria-label="Caméra de scan" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-[45%] w-[70%] rounded-xl border-2 border-white/60" /></div>
            <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">Caméra: {scanActive ? 'ACTIVE' : 'PAUSE'}</div>
          </div>

          <div className="mt-3 text-sm text-slate-300">
            {!barcodeSupport && (
              <div className="space-y-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <div>BarcodeDetector non disponible sur ce navigateur.</div>
                <button type="button" onClick={() => navigate('/scan-ean')} className="rounded-lg border border-blue-500/60 px-3 py-2 text-xs font-semibold text-blue-200">Utiliser le scan manuel (/scan-ean)</button>
                <div className="flex flex-wrap gap-2">
                  <input value={manualEan} onChange={(e) => setManualEan(e.target.value)} placeholder="Saisir EAN (fallback)" className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm" aria-label="Saisir un code EAN manuellement" />
                  <button type="button" onClick={handleManualLookup} className="rounded border border-blue-500/60 px-3 py-1 text-xs font-semibold text-blue-100">Rechercher</button>
                </div>
                {manualError ? <div className="text-xs text-rose-300">{manualError}</div> : null}
                {manualResult ? <div className="text-xs text-emerald-300">✅ {manualResult.name}{manualResult.brand ? ` — ${manualResult.brand}` : ''}</div> : null}
              </div>
            )}
            {cameraError && <div className="text-rose-300">{cameraError}</div>}
            {!cameraError && barcodeSupport && 'Astuce: gardez le code au centre 1-2 secondes pour stabiliser la détection.'}
          </div>

          {debugEnabled && <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100"><p><strong>Mode debug</strong> (debug=1)</p><p>État: {debugInfo.status}</p><p>Dernier code: {debugInfo.lastCode ?? '—'}</p><p>Validation stable: {debugInfo.stableCounter}/2</p><p>Aucun code détecté depuis: {debugInfo.secondsSinceLastDetection === null ? '—' : `${debugInfo.secondsSinceLastDetection} s`}</p></div>}

          <div className="mt-6">
            <div className="mb-3 text-lg font-semibold text-white">Résultats (scan continu)</div>
            {results.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-gray-400">Aucun scan pour l'instant.</div> : (
              <div className="grid gap-3">
                {results.map((item) => (
                  <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm text-white">{item.barcode}</span><StatusBadge status={item.status} /><span className="text-xs text-gray-500">{new Date(item.detectedAt).toLocaleString()}</span></div>
                      <div className="mt-2 text-sm text-gray-300">
                        {item.status === 'loading' && 'Recherche…'}
                        {item.status === 'not_found' && 'Produit non référencé.'}
                        {item.status === 'error' && (item.errorMessage || 'Erreur inconnue.')}
                        {item.status === 'ok' && item.product && <div className="flex items-start gap-3">{item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} className="h-14 w-14 rounded object-cover" loading="lazy" /> : null}<div><span className="font-semibold text-white">{item.product.name || `Produit (EAN: ${item.barcode})`}</span>{item.product.brand ? <span> — {item.product.brand}</span> : null}{item.product.quantity ? <div className="text-xs text-gray-400">{item.product.quantity}</div> : null}<button type="button" onClick={() => navigate(`/product/${item.barcode}`)} className="mt-1 text-xs text-blue-300 underline">Voir fiche</button></div></div>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => handleAddManual(item.id)} disabled={item.status !== 'ok' || !item.product} className="rounded-lg border border-emerald-500/60 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Ajouter ${item.barcode} au panier`}>Ajouter au panier</button>
                      <button type="button" onClick={() => removeItem(item.id)} className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-200" aria-label={`Supprimer la ligne ${item.barcode}`}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
