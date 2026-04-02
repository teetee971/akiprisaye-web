import React from 'react';
import { Fingerprint, Sparkles } from 'lucide-react';
export default function AkiLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 rounded-3xl bg-slate-900 border-2 border-slate-800 p-2 shadow-inner">
        <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-emerald-700 text-white shadow-xl">
          <Fingerprint size={24} />
          <Sparkles size={10} className="absolute top-1 right-1 text-yellow-300 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-end gap-0.5">
          <span className="text-2xl font-black text-blue-500 italic">Aki</span>
          <span className="text-2xl font-black text-emerald-500">Prisaye</span>
        </div>
        <span className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.3em] mt-1">
          SOUVERAINETÉ {import.meta.env.VITE_APP_VERSION ?? ''}
        </span>
      </div>
    </div>
  );
}
