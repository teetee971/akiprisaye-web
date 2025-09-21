import React from "react";

export default function StoreBadge({ store, region }) {
  // Map regions to optimized SVG icon paths
  const getIconPath = (region) => {
    const regionCode = region?.toLowerCase();
    if (['gp', 'mq', 'gf', 're', 'yt', 'pf', 'nc', 'wf', 'pm'].includes(regionCode)) {
      return `/icons/territories/${regionCode}.svg`;
    }
    return '/icons/territories/default.svg';
  };

  const iconPath = getIconPath(region);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5
                     rounded-full bg-slate-100 text-slate-700 text-xs">
      <img 
        src={iconPath} 
        alt={`Territoire ${region || 'Inconnu'}`}
        width="16" 
        height="16" 
        className="flex-shrink-0"
        onError={(e) => {
          e.target.src = '/icons/territories/default.svg';
        }}
      />
      <span>{store}</span>
    </span>
  );
}
