 
/**
 * Localized Text Component
 * Provides text localization with support for rich formatting
 */

import { useTranslation, Trans } from 'react-i18next';

interface LocalizedTextProps {
  i18nKey: string;
  ns?: string;
  values?: Record<string, any>;
  components?: Record<string, React.ReactElement>;
  fallback?: string;
}

export function LocalizedText({ 
  i18nKey, 
  ns, 
  values, 
  components,
  fallback 
}: LocalizedTextProps) {
  const { t } = useTranslation(ns);
  
  if (components) {
    return (
      <Trans 
        i18nKey={i18nKey} 
        ns={ns} 
        values={values} 
        components={components}
        defaults={fallback}
      />
    );
  }
  
  return <>{t(i18nKey, { ...values, defaultValue: fallback })}</>;
}

// Hook pour les traductions avec formatage
export function useLocalizedFormat() {
  const { i18n } = useTranslation();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };
  
  const formatDate = (date: Date | string, style: 'short' | 'medium' | 'long' = 'medium') => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: style,
    }).format(new Date(date));
  };
  
  const formatRelativeTime = (date: Date | string) => {
    const diff = Date.now() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const rtf = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
    
    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
  };
  
  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('fr-FR', options).format(num);
  };
  
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  return {
    formatPrice,
    formatDate,
    formatRelativeTime,
    formatNumber,
    formatPercent,
    currentLanguage: i18n.language,
  };
}
