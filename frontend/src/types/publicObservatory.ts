/**
 * Public Observatory Types - v4.3.0
 * 
 * Types for official public observatory
 * 
 * @module publicObservatoryTypes
 */

/**
 * Observatory indicator
 */
export interface ObservatoryIndicator {
  id: string;
  name: string;
  description: string;
  unit: string;
  methodology: string;
  version: string;
}

/**
 * Publication version
 */
export interface PublicationVersion {
  version: string;
  date: string;
  methodology: string;
  frozenAt: string;
}

/**
 * Public dataset
 */
export interface PublicDataset {
  id: string;
  title: string;
  permanentUrl: string;
  version: string;
  data: any[];
}
