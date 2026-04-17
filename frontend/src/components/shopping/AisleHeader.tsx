import React from 'react';
import { Leaf, Snowflake, Carrot, Package, Droplets, Sparkles, HelpCircle } from 'lucide-react';

interface AisleHeaderProps {
  aisleName: string;
}

const getAisleIconAndColor = (name: string) => {
  switch (name) {
    case 'Fruits & Légumes':
      return { icon: Carrot, color: 'text-green-700 bg-green-100 border-green-300' };
    case 'Frais':
      return { icon: Snowflake, color: 'text-blue-700 bg-blue-100 border-blue-300' };
    case 'Épicerie':
      return { icon: Package, color: 'text-orange-700 bg-orange-100 border-orange-300' };
    case 'Boissons':
      return { icon: Droplets, color: 'text-cyan-700 bg-cyan-100 border-cyan-300' };
    case 'Hygiène':
      return { icon: Sparkles, color: 'text-purple-700 bg-purple-100 border-purple-300' };
    case 'Surgelés':
      return { icon: Leaf, color: 'text-indigo-700 bg-indigo-100 border-indigo-300' };
    default:
      return { icon: HelpCircle, color: 'text-slate-600 bg-slate-100 border-slate-300' };
  }
};

export const AisleHeader: React.FC<AisleHeaderProps> = ({ aisleName }) => {
  const { icon: Icon, color } = getAisleIconAndColor(aisleName);

  return (
    <div className={`flex items-center gap-2 p-3 my-2 border rounded-full font-semibold ${color}`}>
      <Icon size={20} />
      <span>{aisleName}</span>
    </div>
  );
};
