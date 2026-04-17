// src/components/ScanErrorState.tsx
import React from 'react';

type ScanErrorStateProps = {
  message: string;
};

export default function ScanErrorState({ message }: ScanErrorStateProps) {
  return (
    <div className="bg-white/[0.08] backdrop-blur-[14px] border border-white/[0.22] rounded-xl p-8 text-center">
      <div className="text-5xl mb-4">❌</div>
      <h3 className="text-lg font-semibold text-white mb-2">Produit non trouvé</h3>
      <p className="text-white/70">{message}</p>
    </div>
  );
}
