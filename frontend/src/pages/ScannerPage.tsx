import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScannerPreview } from '../components/scanner/ScannerPreview';

export default function ScannerPage() {
  const [barcode, setBarcode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      navigate(`/product/${barcode.trim()}?territory=GP`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8 px-4 py-8">
      <ScannerPreview barcode={barcode || undefined} />
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Entrez un code-barres…"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-zinc-500 outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-400"
        >
          Rechercher
        </button>
      </form>
    </div>
  );
}
