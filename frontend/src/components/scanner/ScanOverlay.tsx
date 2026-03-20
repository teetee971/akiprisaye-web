import { ScannerPreview } from './ScannerPreview';

const DEMO_BARCODE = '3270190204877';

interface ScanOverlayProps {
  onClose: () => void;
  onUseDemo: (barcode: string) => void;
}

export function ScanOverlay({ onClose, onUseDemo }: ScanOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-8 p-6 md:grid-cols-2">
        <ScannerPreview barcode={DEMO_BARCODE} name="Pack eau 6x1.5L" />
        <div className="flex flex-col justify-center gap-6">
          <div>
            <div className="text-xl font-semibold text-white">Scanner un produit</div>
            <p className="mt-2 text-sm text-zinc-400">
              Utilisez la démo pour tester la comparaison de prix.
            </p>
          </div>
          <button
            onClick={() => onUseDemo(DEMO_BARCODE)}
            className="rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-400"
          >
            Utiliser la démo
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 py-3 text-zinc-400 transition hover:bg-white/[0.04]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
