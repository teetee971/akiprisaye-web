import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${className}`}
      aria-label="Aide et tutoriel"
      title="Relancer le tutoriel"
    >
      <HelpCircle className="w-5 h-5" />
      <span className="hidden sm:inline">Aide</span>
    </button>
  );
};

export default HelpButton;
