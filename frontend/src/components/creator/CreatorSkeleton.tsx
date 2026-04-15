import React from 'react';

const CreatorSkeleton: React.FC = () => (
  <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-5 w-5 rounded bg-slate-800" />
      <div className="h-5 w-48 rounded bg-slate-800" />
    </div>
    <div className="space-y-3">
      <div className="h-4 w-full rounded bg-slate-800" />
      <div className="h-4 w-3/4 rounded bg-slate-800" />
      <div className="h-4 w-1/2 rounded bg-slate-800" />
    </div>
  </div>
);

export default CreatorSkeleton;
