/**
 * Custom hook for sharing comparison data
 * Encodes data in URL for sharing across devices
 */

export interface ComparisonData {
  products?: unknown[];
  filters?: unknown;
  timestamp?: number;
  [key: string]: unknown;
}

export function useShare() {
  const generateShareUrl = (comparisonData: ComparisonData): string => {
    try {
      // Encode comparison data in URL
      const encoded = btoa(JSON.stringify(comparisonData));
      const baseUrl = window.location.origin;
      return `${baseUrl}/comparateur/partage?data=${encodeURIComponent(encoded)}`;
    } catch (error) {
      console.error('Error encoding share URL:', error);
      return window.location.href;
    }
  };

  const decodeShareUrl = (encodedData: string): ComparisonData | null => {
    try {
      const decoded = decodeURIComponent(encodedData);
      return JSON.parse(atob(decoded));
    } catch (error) {
      console.error('Error decoding share URL:', error);
      return null;
    }
  };

  return {
    generateShareUrl,
    decodeShareUrl
  };
}
