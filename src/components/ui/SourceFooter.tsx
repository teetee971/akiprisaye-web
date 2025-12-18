/**
 * SourceFooter - Civic Glass Design System
 * Component to display official data sources with attribution
 */
import React from 'react';
import { CivicSource } from '../../types/civic';

export function SourceFooter({ source }: { source: CivicSource }) {
  return (
    <div className="text-xs text-gray-400 mt-2">
      Source officielle :{" "}
      <a 
        href={source.url} 
        target="_blank" 
        rel="noreferrer noopener" 
        className="underline hover:text-blue-400 transition-colors"
      >
        {source.name}
      </a>
    </div>
  );
}

export default SourceFooter;
