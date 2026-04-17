interface GlobalDisclaimerProps {
  className?: string;
}

const baseStyles =
  'bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 text-sm text-gray-300 leading-relaxed';

export default function GlobalDisclaimer({ className }: GlobalDisclaimerProps) {
  return (
    <div className={`${baseStyles} ${className || ''}`}>
      <div className="max-w-4xl mx-auto space-y-2">
        <p className="font-medium text-gray-200">
          A KI PRI SA YÉ est une plateforme civique indépendante.
        </p>
        <p>Les données proviennent exclusivement de sources publiques officielles.</p>
        <p>Aucun contenu sponsorisé, aucune manipulation commerciale.</p>
      </div>
    </div>
  );
}
