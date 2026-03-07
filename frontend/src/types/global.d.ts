 
import 'react';
import 'react-dom';

// Extension de Window pour Leaflet (L)
declare global {
  interface Window {
    L: any;
    gtag?: (...args: any[]) => void;
    storeMapGetDirections?: (storeId: string) => void;
    storeMapViewDetails?: (storeId: string) => void;
  }
}

// Correction des codes territoires pour être inclusifs
export type TerritoryCode = 'GP' | 'MQ' | 'GF' | 'RE' | 'YT' | 'BL' | 'MF' | 'PM' | 'WF' | 'PF' | 'NC' | 'TF' | 'FRA' | 'GLP' | 'MTQ' | 'GUF' | 'REU' | 'MYT';

export type DataSource = 'open_data' | 'agent_public' | 'ticket_scan' | 'user_contrib' | 'scan_photo' | 'estimation' | 'historical';
