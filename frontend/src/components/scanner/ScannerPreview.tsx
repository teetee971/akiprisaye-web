interface ScannerPreviewProps {
  barcode?: string;
  name?: string;
}

export function ScannerPreview({ barcode, name }: ScannerPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-[9/16] w-full max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-px w-2/3 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" />
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="rounded-full border border-white/10 bg-black/60 px-4 py-1 text-xs text-zinc-400">
            Visez le code-barres
          </div>
        </div>
      </div>
      {barcode && (
        <div className="text-center">
          <div className="font-mono text-sm text-emerald-400">{barcode}</div>
          {name && <div className="mt-1 text-xs text-zinc-400">{name}</div>}
        </div>
      )}
    </div>
  );
}
