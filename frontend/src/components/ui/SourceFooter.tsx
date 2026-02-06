import { ExternalLink } from 'lucide-react';

interface SourceFooterProps {
  sourceName: string;
  sourceUrl: string;
  className?: string;
}

export default function SourceFooter({ sourceName, sourceUrl, className }: SourceFooterProps) {
  return (
    <div className={`mt-3 pt-3 border-t border-white/10 ${className || ''}`}>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="font-medium">Source officielle:</span>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          aria-label={`Ouvrir ${sourceName} dans un nouvel onglet`}
        >
          {sourceName}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-[10px] text-gray-500 mt-1.5 italic">
        ℹ️ Information issue d'une source publique officielle.
      </p>
    </div>
  );
}
